// This is a Cloudflare Pages Function that acts as a secure backend.
// It is "bimodal":
// 1. If a custom API URL/Key is provided, it acts as a secure proxy.
// 2. If not, it uses the built-in Google Gemini SDK with the environment's API_KEY.

import { GoogleGenAI } from '@google/genai';
import {
  getStoryOutlinePrompts,
  getChapterPrompts,
  getChapterTitlesPrompts,
  getDetailedOutlinePrompts,
  getRefineDetailedOutlinePrompts,
  getEditChapterTextPrompts,
  getCharacterInteractionPrompts,
  getNewCharacterProfilePrompts,
} from './prompts';

import type { StoryOptions } from '../types';

interface PagesFunctionContext {
  request: Request;
  env: {
    API_KEY?: string;
  };
}

// =================================================================
// == CUSTOM OPENAI-COMPATIBLE API HELPERS
// =================================================================

// Helper to forward the request and handle the SSE stream from a custom API
async function streamOpenAIResponse(
    apiUrl: string,
    apiKey: string,
    model: string,
    messages: { role: string; content: string }[],
    options: StoryOptions,
    writable: WritableStream
) {
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    
    try {
        const response = await fetch(new URL('/v1/chat/completions', apiUrl), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                temperature: options.temperature,
                top_p: (options.diversity - 0.1) / 2.0,
                top_k: options.topK > 0 ? options.topK : undefined,
            }),
        });

        if (!response.ok) throw new Error(`Upstream API Error: ${response.status} - ${await response.text()}`);
        if (!response.body) throw new Error("Upstream API response has no body.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') break;
                    try {
                        const parsed = JSON.parse(data);
                        const delta = parsed.choices[0]?.delta?.content;
                        if (delta) {
                            await writer.write(encoder.encode(JSON.stringify({ text: delta }) + '\n'));
                        }
                    } catch (e) { /* Ignore parsing errors for incomplete chunks */ }
                }
            }
        }
    } catch (e: any) {
        await writer.write(encoder.encode(JSON.stringify({ error: e.message }) + '\n'));
    } finally {
        await writer.close();
    }
}

// Helper for non-streaming requests to a custom API
async function postOpenAIRequest(
    apiUrl: string, apiKey: string, model: string, messages: { role: string; content: string }[], options: StoryOptions
): Promise<string> {
    const response = await fetch(new URL('/v1/chat/completions', apiUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: options.temperature,
            top_p: (options.diversity - 0.1) / 2.0,
            top_k: options.topK > 0 ? options.topK : undefined,
        }),
    });

    if (!response.ok) throw new Error(`Upstream API Error: ${response.status} - ${await response.text()}`);
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Upstream API returned an empty response.");
    return content;
}

// =================================================================
// == DEFAULT GEMINI SDK HELPERS
// =================================================================

// Helper for streaming responses from the Gemini API
async function streamGeminiResponse(
    ai: GoogleGenAI, model: string, prompt: string, writable: WritableStream
) {
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    try {
        const stream = await ai.models.generateContentStream({ model, contents: prompt });
        for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
                 await writer.write(encoder.encode(JSON.stringify({ text }) + '\n'));
            }
        }
    } catch (e: any) {
        await writer.write(encoder.encode(JSON.stringify({ error: e.message }) + '\n'));
    } finally {
        await writer.close();
    }
}

// Helper for non-streaming requests to the Gemini API
async function postGeminiRequest(ai: GoogleGenAI, model: string, prompt: string): Promise<string> {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
}

// =================================================================
// == MAIN API HANDLER
// =================================================================

export const onRequestPost: (context: PagesFunctionContext) => Promise<Response> = async (context) => {
    const { request, env } = context;
    
    try {
        const { action, payload } = await request.json();
        const { options, ...restPayload } = payload;

        const isCustomApi = options && options.apiBaseUrl && options.apiKey;

        // Handle 'listModels' action separately as it's always custom
        if (action === 'listModels') {
            if (!isCustomApi) { // In default mode, provide default models
                return new Response(JSON.stringify(['gemini-2.5-pro', 'gemini-2.5-flash']), { headers: { 'Content-Type': 'application/json' } });
            }
            const modelResponse = await fetch(new URL('/v1/models', options.apiBaseUrl), { headers: { 'Authorization': `Bearer ${options.apiKey}` }});
            if (!modelResponse.ok) throw new Error(`Failed to fetch models: ${modelResponse.status} - ${await modelResponse.text()}`);
            const modelData = await modelResponse.json();
            const modelIds = modelData.data.map((m: any) => m.id).sort();
            return new Response(JSON.stringify(modelIds), { headers: { 'Content-Type': 'application/json' }});
        }
        
        // Prepare Gemini AI instance for default mode
        const ai = isCustomApi ? null : new GoogleGenAI({ apiKey: env.API_KEY || '' });
        if (!isCustomApi && !env.API_KEY) {
            throw new Error("AI Studio Mode Error: The API_KEY environment variable is not set.");
        }


        let prompt: string | { role: string; content: string }[] = '';
        let model: string = '';
        let isStreaming = false;
        
        switch (action) {
            case 'generateStoryOutline':
                isStreaming = true;
                model = isCustomApi ? options.planningModel : 'gemini-2.5-flash';
                prompt = getStoryOutlinePrompts(restPayload.storyCore, options, isCustomApi);
                break;
            case 'generateChapter':
                isStreaming = true;
                model = isCustomApi ? options.writingModel : 'gemini-2.5-pro';
                prompt = getChapterPrompts(restPayload.outline, restPayload.historyChapters, options, restPayload.detailedChapterOutline, isCustomApi);
                break;
            case 'generateChapterTitles':
                isStreaming = false;
                model = isCustomApi ? options.planningModel : 'gemini-2.5-flash';
                prompt = getChapterTitlesPrompts(restPayload.outline, restPayload.chapters, options, isCustomApi);
                break;
            case 'generateDetailedOutline':
                isStreaming = true;
                model = isCustomApi ? options.planningModel : 'gemini-2.5-flash';
                prompt = getDetailedOutlinePrompts(restPayload.outline, restPayload.chapters, restPayload.chapterTitle, restPayload.userInput, options, restPayload.iterationConfig, isCustomApi);
                break;
            case 'refineDetailedOutline':
                 isStreaming = true;
                 model = isCustomApi ? options.planningModel : 'gemini-2.5-flash';
                 prompt = getRefineDetailedOutlinePrompts(restPayload.originalOutlineJson, restPayload.refinementRequest, restPayload.chapterTitle, restPayload.storyOutline, options, restPayload.iterationConfig, isCustomApi);
                 break;
            case 'editChapterText':
                isStreaming = false;
                model = isCustomApi ? options.writingModel : 'gemini-2.5-pro';
                prompt = getEditChapterTextPrompts(restPayload.originalText, restPayload.instruction, options, isCustomApi);
                break;
            case 'generateCharacterInteraction':
                isStreaming = true;
                model = isCustomApi ? options.planningModel : 'gemini-2.5-flash';
                prompt = getCharacterInteractionPrompts(restPayload.char1, restPayload.char2, restPayload.outline, options, isCustomApi);
                break;
            case 'generateNewCharacterProfile':
                isStreaming = false;
                model = isCustomApi ? options.planningModel : 'gemini-2.5-flash';
                prompt = getNewCharacterProfilePrompts(restPayload.storyOutline, restPayload.characterPrompt, options, isCustomApi);
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // --- Execute and Respond ---
        if (isStreaming) {
            const { readable, writable } = new TransformStream();
            if (isCustomApi) {
                streamOpenAIResponse(options.apiBaseUrl, options.apiKey, model, prompt as { role: string; content: string }[], options, writable);
            } else {
                streamGeminiResponse(ai!, model, prompt as string, writable);
            }
            return new Response(readable, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' }});
        } else {
            let resultText: string;
            if (isCustomApi) {
                resultText = await postOpenAIRequest(options.apiBaseUrl, options.apiKey, model, prompt as { role: string; content: string }[], options);
            } else {
                resultText = await postGeminiRequest(ai!, model, prompt as string);
            }
            // Frontend expects a specific object structure for some non-streaming calls
            let responseBody;
            if (action === 'generateChapterTitles') responseBody = { titlesJson: resultText };
            else if (action === 'editChapterText' || action === 'generateNewCharacterProfile') responseBody = { text: resultText };
            else responseBody = resultText;
            
            return new Response(JSON.stringify(responseBody), { headers: { 'Content-Type': 'application/json' }});
        }

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || "An unknown error occurred" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

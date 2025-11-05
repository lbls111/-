import { GoogleGenAI } from '@google/genai';
import {
  getSearchPrompts,
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

// A more robust helper to extract a JSON object or array from a string.
const extractJsonFromText = (text: string): string => {
    // 1. Try to find JSON within markdown code blocks first.
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try {
            JSON.parse(markdownMatch[1]);
            return markdownMatch[1].trim();
        } catch (e) {
            // Malformed JSON in code block, fall through to next method.
        }
    }

    // 2. Find the first '{' or '[' to signal the start of a JSON structure.
    let startIndex = -1;
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startIndex = firstBracket;
    }

    if (startIndex === -1) {
        // No JSON object or array signature found. Return original text for debugging.
        return text;
    }

    // 3. Scan from the start to find the matching closing character.
    const startChar = text[startIndex];
    const endChar = startChar === '{' ? '}' : ']';
    let openCount = 0;

    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === startChar) {
            openCount++;
        } else if (text[i] === endChar) {
            openCount--;
        }

        if (openCount === 0) {
            // We found the end of the JSON structure.
            const potentialJson = text.substring(startIndex, i + 1);
            try {
                // Final validation.
                JSON.parse(potentialJson);
                return potentialJson;
            } catch (e) {
                // The balanced substring is not valid JSON. This can happen with corrupted data.
                // We break and fall through to the last-resort return.
                break; 
            }
        }
    }

    // 4. If all else fails (e.g., malformed/unbalanced JSON), return the original text.
    // This allows the frontend to see the raw model output for error diagnosis.
    return text;
};


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
        const response = await fetch(new URL('/v1/chat/completions', apiUrl).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages,
                stream: true,
                temperature: options.temperature,
                top_p: (options.diversity - 0.1) / 2.0,
                ...(options.topK > 0 && {top_k: options.topK}),
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
                    } catch (e) { /* Ignore parsing errors */ }
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
    const response = await fetch(new URL('/v1/chat/completions', apiUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model,
            messages,
            stream: false,
            temperature: options.temperature,
            top_p: (options.diversity - 0.1) / 2.0,
            ...(options.topK > 0 && {top_k: options.topK}),
        }),
    });

    if (!response.ok) throw new Error(`Upstream API Error: ${response.status} - ${await response.text()}`);
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error("Upstream API returned an empty response.");
    return content;
}

// Helper for streaming responses from the Gemini API
async function streamGeminiResponse(
    ai: GoogleGenAI, model: string, prompt: string, options: StoryOptions, writable: WritableStream
) {
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    try {
        const stream = await ai.models.generateContentStream({ 
            model, 
            contents: prompt,
            config: {
                temperature: options.temperature,
                topP: (options.diversity - 0.1) / 2.0,
                topK: options.topK,
            }
        });
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
async function postGeminiRequest(ai: GoogleGenAI, model: string, prompt: string, options: StoryOptions): Promise<string> {
    const response = await ai.models.generateContent({ 
        model, 
        contents: prompt,
        config: {
            temperature: options.temperature,
            topP: (options.diversity - 0.1) / 2.0,
            topK: options.topK,
        }
    });
    return response.text;
}

export const onRequestPost: (context: PagesFunctionContext) => Promise<Response> = async (context) => {
    const { request, env } = context;
    
    try {
        const { action, payload } = await request.json();
        const { options, ...restPayload } = payload;

        const isCustomApi = options && options.apiBaseUrl && options.apiKey;

        if (action === 'listModels') {
            if (!isCustomApi) {
                return new Response(JSON.stringify(['gemini-2.5-pro', 'gemini-2.5-flash']), { headers: { 'Content-Type': 'application/json' } });
            }
            const modelResponse = await fetch(new URL('/v1/models', options.apiBaseUrl).toString(), { headers: { 'Authorization': `Bearer ${options.apiKey}` }});
            if (!modelResponse.ok) throw new Error(`Failed to fetch models: ${modelResponse.status} - ${await modelResponse.text()}`);
            const modelData = await modelResponse.json();
            const modelIds = modelData.data.map((m: any) => m.id).sort();
            return new Response(JSON.stringify(modelIds), { headers: { 'Content-Type': 'application/json' }});
        }
        
        const ai = isCustomApi ? null : new GoogleGenAI({ apiKey: env.API_KEY || '' });
        if (!isCustomApi && !env.API_KEY) {
            throw new Error("AI Studio Mode Error: The API_KEY environment variable is not set.");
        }

        let prompt: string | { role: string; content: string }[] = '';
        let model: string = '';
        let isStreaming = false;
        
        switch (action) {
            case 'generateStoryOutline':
            case 'generateDetailedOutline':
            case 'refineDetailedOutline':
            case 'generateChapterTitles':
            case 'editChapterText':
            case 'generateNewCharacterProfile':
            case 'performSearch':
                isStreaming = false;
                break;
            case 'generateChapter':
            case 'generateCharacterInteraction':
                isStreaming = true;
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        // --- Get Model and Prompt ---
        switch (action) {
            case 'performSearch':
                model = options.searchModel || 'gemini-2.5-flash';
                prompt = getSearchPrompts(restPayload.storyCore, options, isCustomApi);
                break;
            case 'generateStoryOutline':
                model = options.planningModel || 'gemini-2.5-flash';
                prompt = getStoryOutlinePrompts(restPayload.storyCore, options, isCustomApi);
                break;
            case 'generateChapter':
                model = options.writingModel || 'gemini-2.5-pro';
                prompt = getChapterPrompts(restPayload.outline, restPayload.historyChapters, options, restPayload.detailedChapterOutline, isCustomApi);
                break;
            case 'generateChapterTitles':
                model = options.planningModel || 'gemini-2.5-flash';
                prompt = getChapterTitlesPrompts(restPayload.outline, restPayload.chapters, options, isCustomApi);
                break;
            case 'generateDetailedOutline':
                model = options.planningModel || 'gemini-2.5-flash';
                prompt = getDetailedOutlinePrompts(restPayload.outline, restPayload.chapters, restPayload.chapterTitle, restPayload.userInput, options, restPayload.iterationConfig, isCustomApi);
                break;
            case 'refineDetailedOutline':
                 model = options.planningModel || 'gemini-2.5-flash';
                 prompt = getRefineDetailedOutlinePrompts(restPayload.originalOutlineJson, restPayload.refinementRequest, restPayload.chapterTitle, restPayload.storyOutline, options, restPayload.iterationConfig, isCustomApi);
                 break;
            case 'editChapterText':
                model = options.writingModel || 'gemini-2.5-pro';
                prompt = getEditChapterTextPrompts(restPayload.originalText, restPayload.instruction, options, isCustomApi);
                break;
            case 'generateCharacterInteraction':
                model = options.planningModel || 'gemini-2.5-flash';
                prompt = getCharacterInteractionPrompts(restPayload.char1, restPayload.char2, restPayload.outline, options, isCustomApi);
                break;
            case 'generateNewCharacterProfile':
                model = options.planningModel || 'gemini-2.5-flash';
                prompt = getNewCharacterProfilePrompts(restPayload.storyOutline, restPayload.characterPrompt, options, isCustomApi);
                break;
        }

        if (!model) {
            throw new Error(`No model selected for action: ${action}. Please check your settings.`);
        }

        // --- Execute and Respond ---
        if (isStreaming) {
            const { readable, writable } = new TransformStream();
            if (isCustomApi) {
                streamOpenAIResponse(options.apiBaseUrl, options.apiKey, model, prompt as { role: string; content: string }[], options, writable);
            } else {
                streamGeminiResponse(ai!, model, prompt as string, options, writable);
            }
            return new Response(readable, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' }});
        } else {
            let resultText: string;
            if (isCustomApi) {
                resultText = await postOpenAIRequest(options.apiBaseUrl, options.apiKey, model, prompt as { role: string; content: string }[], options);
            } else {
                resultText = await postGeminiRequest(ai!, model, prompt as string, options);
            }

            let responseBody;
            switch (action) {
                case 'generateStoryOutline': {
                    const jsonText = isCustomApi ? extractJsonFromText(resultText) : resultText;
                    responseBody = { text: `[START_OUTLINE_JSON]\n${jsonText}\n[END_OUTLINE_JSON]` };
                    break;
                }
                case 'generateDetailedOutline':
                case 'refineDetailedOutline': {
                    const jsonText = isCustomApi ? extractJsonFromText(resultText) : resultText;
                    responseBody = { text: `[START_DETAILED_OUTLINE_JSON]\n${jsonText}\n[END_DETAILED_OUTLINE_JSON]` };
                    break;
                }
                case 'generateChapterTitles': {
                    const jsonText = isCustomApi ? extractJsonFromText(resultText) : resultText;
                    responseBody = { titles: JSON.parse(jsonText) };
                    break;
                }
                case 'generateNewCharacterProfile': {
                    const jsonText = isCustomApi ? extractJsonFromText(resultText) : resultText;
                    responseBody = { text: jsonText };
                    break;
                }
                case 'performSearch':
                case 'editChapterText':
                    responseBody = { text: resultText };
                    break;
                default:
                    responseBody = { text: resultText }; // Fallback
            }
            
            return new Response(JSON.stringify(responseBody), { headers: { 'Content-Type': 'application/json' }});
        }

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || "An unknown error occurred" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
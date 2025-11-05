import { prompts } from './prompts';
import type { StoryOptions, StoryOutline, GeneratedChapter, CharacterProfile, DetailedOutlineAnalysis } from '../types';

export const config = {
  runtime: 'edge',
};

// This is the new, correct implementation that proxies to an OpenAI-compatible API.
const callExternalApi = async (options: StoryOptions, model: string, prompt: any[], stream = false) => {
    const { apiBaseUrl, apiKey, temperature, diversity, topK } = options;

    const body = {
        model,
        messages: prompt,
        temperature,
        top_p: ((diversity - 0.1) / 2.0), // Custom mapping
        top_k: topK, // Note: Not all OpenAI-compatible APIs support top_k
        stream,
    };

    const response = await fetch(apiBaseUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upstream API Error: ${response.status} - ${errorText}`);
    }

    return response;
};

// Helper to extract JSON from a text response that might have markdown noise.
const extractJsonFromText = (text: string): any => {
    // Find the start of the JSON, which can be '{' or '['
    const jsonStart = text.indexOf('{');
    const arrayStart = text.indexOf('[');
    
    let start = -1;
    if (jsonStart === -1 && arrayStart === -1) {
        throw new Error("JSON数据中未找到起始 '{' 或 '['。");
    }
    if (jsonStart === -1) start = arrayStart;
    else if (arrayStart === -1) start = jsonStart;
    else start = Math.min(jsonStart, arrayStart);
    
    const jsonString = text.substring(start);
    try {
        return JSON.parse(jsonString);
    } catch (e: any) {
        console.error("解析JSON失败:", jsonString);
        throw new Error(`解析JSON数据时失败: ${e.message}`);
    }
}


export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { action, payload } = await req.json();
        const { options } = payload;
        
        // This is a special case that doesn't call the upstream API
        if (action === 'listModels') {
             // For custom APIs, we can't truly list models.
             // We return a default set and let the user type in custom ones.
             // This part of the UI might need adjustment for better UX with custom APIs.
            return new Response(JSON.stringify(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemma-7b-it', 'llama3-70b-8192']), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        switch (action) {
            case 'performSearch': // Note: True Google Search is not available via custom API. This will be a standard generation.
            case 'generateStoryOutline': {
                const { storyCore, options } = payload;
                const prompt = action === 'performSearch' ? prompts.search(storyCore) : prompts.storyOutline(storyCore, options);
                const response = await callExternalApi(options, options.planningModel, prompt);
                const data = await response.json();
                const text = data.choices[0].message.content;
                // For search, since we can't get real citations, return an empty array.
                return new Response(JSON.stringify({ text, citations: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'generateChapter':
            case 'generateCharacterInteraction': {
                 const prompt = action === 'generateChapter'
                    ? prompts.generateChapter(payload.outline, payload.historyChapters, payload.detailedChapterOutline, payload.options)
                    : prompts.generateCharacterInteraction(payload.char1, payload.char2, payload.outline, payload.options);
                 const response = await callExternalApi(options, options.writingModel, prompt, true);
                 // Proxy the stream directly
                 return new Response(response.body, { headers: { 'Content-Type': 'text/event-stream' } });
            }

            case 'generateChapterTitles':
            case 'generateNewCharacterProfile': {
                const prompt = action === 'generateChapterTitles'
                    ? prompts.generateChapterTitles(payload.outline, payload.chapters, payload.options)
                    : prompts.generateNewCharacter(payload.storyOutline, payload.characterPrompt, payload.options);
                const response = await callExternalApi(options, options.planningModel, prompt);
                const data = await response.json();
                const rawText = data.choices[0].message.content;
                const jsonContent = extractJsonFromText(rawText);
                return new Response(JSON.stringify(jsonContent), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            // FIX: Refactored to use a single API call as intended by the monolithic prompts.
            // This resolves errors from calling non-existent prompt-generation functions.
            case 'generateDetailedOutline':
            case 'refineDetailedOutline': {
                 const { outline, chapters, chapterTitle, userInput, options, previousOutlineJson, refinementRequest, storyOutline } = payload;
                 
                 const prompt = action === 'generateDetailedOutline' 
                    ? prompts.generateDetailedOutline(outline, chapters, chapterTitle, userInput, options)
                    : prompts.refineDetailedOutline(previousOutlineJson, refinementRequest, chapterTitle, storyOutline, options);

                 const response = await callExternalApi(options, options.planningModel, prompt);
                 const data = await response.json();
                 const text = data.choices[0].message.content;
                 
                 // The prompt asks the model to return the full text with markers, which the frontend will parse.
                 return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'editChapterText': {
                const { originalText, instruction, options } = payload;
                const prompt = prompts.editChapter(originalText, instruction, options);
                const response = await callExternalApi(options, options.writingModel, prompt);
                const data = await response.json();
                const text = data.choices[0].message.content;
                return new Response(JSON.stringify({ text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            
            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (e: any) {
        console.error("API Proxy Error:", e);
        const error = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
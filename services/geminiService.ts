import type { GenerateContentResponse } from "@google/genai";
import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, StoryModel, DetailedOutlineAnalysis } from '../types';

// Helper for streaming responses from our backend
async function* streamFetch(endpoint: string, body: any): AsyncGenerator<any, void, undefined> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    if (!response.body) {
        throw new Error("Response body is empty.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            if (buffer.trim().length > 0) {
                 try { yield JSON.parse(buffer); } catch (e) { console.error("Error parsing final chunk:", buffer, e); }
            }
            break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process line by line for line-delimited JSON
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last, potentially incomplete line

        for (const line of lines) {
            if (line.trim()) {
                 try { yield JSON.parse(line); } catch (e) { console.error("Error parsing stream line:", line, e); }
            }
        }
    }
}

// Helper for non-streaming JSON responses from our backend
async function postFetch<T>(endpoint: string, body: any): Promise<T> {
     const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const jsonText = await response.text();
    // The backend function might return a JSON string inside a JSON object
    try {
        const parsedOuter = JSON.parse(jsonText);
        if (typeof parsedOuter === 'object' && parsedOuter !== null && Object.keys(parsedOuter).length === 1) {
             const innerValue = Object.values(parsedOuter)[0];
             if (typeof innerValue === 'string') {
                try {
                    // Try parsing inner value if it's a stringified JSON
                    return JSON.parse(innerValue);
                } catch {
                    // fall through
                }
             }
        }
        return parsedOuter;
    }
    catch {
        return jsonText as any; // Fallback for raw text
    }
}


export const generateStoryOutlineStream = (storyCore: string, options: StoryOptions) => {
    return streamFetch('/api', {
        action: 'generateStoryOutline',
        payload: { storyCore, options }
    });
};

export const generateChapterStream = (
    outline: StoryOutline,
    historyChapters: GeneratedChapter[],
    options: StoryOptions,
    detailedChapterOutline: DetailedOutlineAnalysis
) => {
    return streamFetch('/api', {
        action: 'generateChapter',
        payload: { outline, historyChapters, options, detailedChapterOutline }
    });
};

export const generateChapterTitlesStream = async (
    outline: StoryOutline,
    chapters: GeneratedChapter[]
) => {
    const { titlesJson } = await postFetch<{ titlesJson: string }>('/api', {
        action: 'generateChapterTitles',
        payload: { outline, chapters }
    });
     // Return as a stream-like object for consistency with original code
    return (async function*() {
        yield { text: titlesJson };
    })();
};

export async function* generateDetailedOutlineStream(
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    chapterTitle: string,
    userInput: string,
    model: StoryModel,
    options: StoryOptions,
    iterationConfig: { maxIterations: number; scoreThreshold: number; }
): AsyncGenerator<any, void, undefined> {
     yield* streamFetch('/api', {
        action: 'generateDetailedOutline',
        payload: { outline, chapters, chapterTitle, userInput, model, options, iterationConfig }
     });
}

export async function* refineDetailedOutlineStream(
    originalOutlineJson: string,
    refinementRequest: string,
    chapterTitle: string,
    storyOutline: StoryOutline,
    model: StoryModel,
    options: StoryOptions,
    iterationConfig: { maxIterations: number; scoreThreshold: number; }
): AsyncGenerator<any, void, undefined> {
     yield* streamFetch('/api', {
        action: 'refineDetailedOutline',
        payload: { originalOutlineJson, refinementRequest, chapterTitle, storyOutline, model, options, iterationConfig }
     });
}

export const editChapterText = async (
    originalText: string,
    instruction: string,
    options: StoryOptions
): Promise<GenerateContentResponse> => {
     return postFetch<GenerateContentResponse>('/api', {
        action: 'editChapterText',
        payload: { originalText, instruction, options }
    });
};

export const generateCharacterInteractionStream = (
    char1: CharacterProfile,
    char2: CharacterProfile,
    outline: StoryOutline,
    options: StoryOptions
) => {
    return streamFetch('/api', {
        action: 'generateCharacterInteraction',
        payload: { char1, char2, outline, options }
    });
};

export const generateNewCharacterProfile = async (
    storyOutline: StoryOutline,
    characterPrompt: string,
): Promise<GenerateContentResponse> => {
    return postFetch<GenerateContentResponse>('/api', {
        action: 'generateNewCharacterProfile',
        payload: { storyOutline, characterPrompt }
    });
};

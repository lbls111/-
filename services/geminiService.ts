import type { GenerateContentResponse } from "@google/genai";
import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis, FinalDetailedOutline, Citation } from '../types';

// Helper for streaming responses from our backend
async function* streamFetch(endpoint: string, body: any): AsyncGenerator<any, void, undefined> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
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
        // Try to parse error JSON from backend
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `API Error: ${response.status}`);
        } catch {
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
    }
    return response.json();
}

// FIX: Removed apiMode from the options type as it's no longer needed.
export const listModels = async (options: { apiBaseUrl: string, apiKey: string }): Promise<string[]> => {
    return postFetch<string[]>('/api', {
        action: 'listModels',
        payload: { options }
    });
}

// NON-STREAMING: The initial research step before planning.
export const performSearch = (storyCore: string, options: StoryOptions): Promise<{ text: string; citations: Citation[] }> => {
    return postFetch<{ text: string; citations: Citation[] }>('/api', {
        action: 'performSearch',
        payload: { storyCore, options }
    });
};

// NON-STREAMING: More reliable for a critical one-off generation.
export const generateStoryOutline = (storyCore: string, options: StoryOptions): Promise<{ text: string }> => {
    return postFetch<{ text: string }>('/api', {
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

// NON-STREAMING: This is a quick action, streaming is overkill.
export const generateChapterTitles = async (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    options: StoryOptions
): Promise<string[]> => {
    const { titles } = await postFetch<{ titles: string[] }>('/api', {
        action: 'generateChapterTitles',
        payload: { outline, chapters, options }
    });
    return titles;
};

// STREAMING: The iterative process is now streamed to the frontend for progress display and reliability.
export const generateDetailedOutlineStream = (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    chapterTitle: string,
    userInput: string,
    options: StoryOptions,
    iterationConfig: { maxIterations: number; scoreThreshold: number; }
) => {
     return streamFetch('/api', {
        action: 'generateDetailedOutline',
        payload: { outline, chapters, chapterTitle, userInput, options, iterationConfig }
     });
}

// STREAMING: Refinement also becomes a streaming action for consistency.
export const refineDetailedOutlineStream = (
    originalOutlineJson: string,
    refinementRequest: string,
    chapterTitle: string,
    storyOutline: StoryOutline,
    options: StoryOptions,
    iterationConfig: { maxIterations: number; scoreThreshold: number; }
) => {
     return streamFetch('/api', {
        action: 'refineDetailedOutline',
        payload: { originalOutlineJson, refinementRequest, chapterTitle, storyOutline, options, iterationConfig }
     });
}

export const editChapterText = async (
    originalText: string,
    instruction: string,
    options: StoryOptions
): Promise<{ text: string }> => {
     return postFetch<{ text: string }>('/api', {
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
    options: StoryOptions
): Promise<{ text: string }> => {
    return postFetch<{ text: string }>('/api', {
        action: 'generateNewCharacterProfile',
        payload: { storyOutline, characterPrompt, options }
    });
};

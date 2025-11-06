import type { GenerateContentResponse } from "@google/genai";
import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis, FinalDetailedOutline, Citation, OutlineCritique } from '../types';

// Helper for streaming responses from our backend
async function* streamFetch(endpoint: string, body: any, signal?: AbortSignal): AsyncGenerator<any, void, undefined> {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
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
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.trim()) {
                 try { yield JSON.parse(line); } catch (e) { console.error("Error parsing stream line:", line, e); }
            }
        }
    }
}

// Helper for non-streaming JSON responses from our backend
async function postFetch<T>(endpoint: string, body: any, signal?: AbortSignal): Promise<T> {
     const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
    });
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `API Error: ${response.status}`);
        } catch {
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
    }
    return response.json();
}

export const listModels = async (options: { apiBaseUrl: string, apiKey: string }): Promise<string[]> => {
    return postFetch<string[]>('/api', {
        action: 'listModels',
        payload: { options }
    });
}

export const performSearch = (storyCore: string, options: StoryOptions, signal?: AbortSignal): Promise<{ text: string; citations: Citation[] }> => {
    return postFetch<{ text: string; citations: Citation[] }>('/api', {
        action: 'performSearch',
        payload: { storyCore, options }
    }, signal);
};

export const generateChapterStream = (
    outline: StoryOutline,
    historyChapters: GeneratedChapter[],
    options: StoryOptions,
    detailedChapterOutline: DetailedOutlineAnalysis,
    signal?: AbortSignal
) => {
    return streamFetch('/api', {
        action: 'generateChapter',
        payload: { outline, historyChapters, options, detailedChapterOutline }
    }, signal);
};

export const generateChapterTitles = async (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    options: StoryOptions,
    signal?: AbortSignal
): Promise<string[]> => {
    const { titles } = await postFetch<{ titles: string[] }>('/api', {
        action: 'generateChapterTitles',
        payload: { outline, chapters, options }
    }, signal);
    return titles;
};

export const generateSingleOutlineIteration = async (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    chapterTitle: string,
    options: StoryOptions,
    previousAttempt: { outline: DetailedOutlineAnalysis, critique: OutlineCritique } | null,
    userInput: string,
    signal?: AbortSignal
): Promise<{ critique: OutlineCritique; outline: DetailedOutlineAnalysis; }> => {
    return postFetch<{ critique: OutlineCritique; outline: DetailedOutlineAnalysis; }>('/api', {
        action: 'generateSingleOutlineIteration',
        payload: { outline, chapters, chapterTitle, options, previousAttempt, userInput }
    }, signal);
};


export const editChapterText = async (
    originalText: string,
    instruction: string,
    options: StoryOptions,
    signal?: AbortSignal
): Promise<{ text: string }> => {
     return postFetch<{ text: string }>('/api', {
        action: 'editChapterText',
        payload: { originalText, instruction, options }
    }, signal);
};

export const generateCharacterInteractionStream = (
    char1: CharacterProfile,
    char2: CharacterProfile,
    outline: StoryOutline,
    options: StoryOptions,
    signal?: AbortSignal
) => {
    return streamFetch('/api', {
        action: 'generateCharacterInteraction',
        payload: { char1, char2, outline, options }
    }, signal);
};

export const generateNewCharacterProfile = async (
    storyOutline: StoryOutline,
    characterPrompt: string,
    options: StoryOptions,
    signal?: AbortSignal
): Promise<{ text: string }> => {
    return postFetch<{ text: string }>('/api', {
        action: 'generateNewCharacterProfile',
        payload: { storyOutline, characterPrompt, options }
    }, signal);
};

// --- NEW CREATIVE TOOL SERVICES ---

export const generateWorldbookSuggestions = async (storyOutline: StoryOutline, options: StoryOptions, signal?: AbortSignal): Promise<{ text: string }> => {
    return postFetch<{ text: string }>('/api', {
        action: 'getWorldbookSuggestions',
        payload: { storyOutline, options }
    }, signal);
};

export const generateCharacterArcSuggestions = async (character: CharacterProfile, storyOutline: StoryOutline, options: StoryOptions, signal?: AbortSignal): Promise<{ text: string }> => {
    return postFetch<{ text: string }>('/api', {
        action: 'getCharacterArcSuggestions',
        payload: { character, storyOutline, options }
    }, signal);
};

export const refineOutlineWithTool = async (
    tool: 'iceberg' | 'conflict',
    detailedOutline: DetailedOutlineAnalysis,
    storyOutline: StoryOutline,
    options: StoryOptions,
    signal?: AbortSignal
): Promise<{ refinedOutline: DetailedOutlineAnalysis; explanation: string; }> => {
    return postFetch<{ refinedOutline: DetailedOutlineAnalysis; explanation: string; }>('/api', {
        action: 'refineOutlineWithTool',
        payload: { tool, detailedOutline, storyOutline, options }
    }, signal);
};
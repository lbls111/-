import type { GenerateContentResponse } from "@google/genai";
// FIX: Added missing OptimizationHistoryEntry type for the new streaming function.
import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis, FinalDetailedOutline, Citation, OutlineCritique, OutlineGenerationProgress, OptimizationHistoryEntry } from '../types';

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

export const generateDetailedOutline = async (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    chapterTitle: string,
    options: StoryOptions,
    previousAttempt: { outline: DetailedOutlineAnalysis, critique: OutlineCritique } | null,
    userInput: string,
    signal?: AbortSignal
): Promise<{ outline: DetailedOutlineAnalysis }> => {
    return await postFetch<{ outline: DetailedOutlineAnalysis }>('/api', {
        action: 'generateDetailedOutline',
        payload: { outline, chapters, chapterTitle, options, previousAttempt, userInput }
    }, signal);
};

export const critiqueDetailedOutline = async (
    outlineToCritique: DetailedOutlineAnalysis,
    storyOutline: StoryOutline,
    chapterTitle: string,
    options: StoryOptions,
    signal?: AbortSignal
): Promise<{ critique: OutlineCritique }> => {
    return await postFetch<{ critique: OutlineCritique }>('/api', {
        action: 'critiqueDetailedOutline',
        payload: { outlineToCritique, storyOutline, chapterTitle, options }
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

export const generateNarrativeToolboxSuggestions = async (
    detailedOutline: DetailedOutlineAnalysis,
    storyOutline: StoryOutline,
    options: StoryOptions,
    signal?: AbortSignal
): Promise<{ text: string }> => {
    return postFetch<{ text: string }>('/api', {
        action: 'getNarrativeToolboxSuggestions',
        payload: { detailedOutline, storyOutline, options }
    }, signal);
};

// FIX: Implemented the missing streaming function for outline generation.
// This client-side async generator orchestrates the generate-and-critique flow,
// yielding progress updates to the UI without requiring backend changes.
export async function* generateSingleOutlineIterationStream(
    storyOutline: StoryOutline,
    chapters: GeneratedChapter[],
    chapterTitle: string,
    options: StoryOptions,
    parsedOutline: FinalDetailedOutline | null,
    userInput: string,
    signal?: AbortSignal
): AsyncGenerator<OutlineGenerationProgress, void, undefined> {
    const isRefinement = !!parsedOutline;
    const currentVersion = (parsedOutline?.finalVersion || 0) + 1;
    let previousAttempt: { outline: DetailedOutlineAnalysis; critique: OutlineCritique } | null = null;
    
    if (isRefinement && parsedOutline) {
        const latestHistory = parsedOutline.optimizationHistory[parsedOutline.optimizationHistory.length - 1];
        previousAttempt = {
            outline: latestHistory.outline,
            critique: latestHistory.critique,
        };
    }

    try {
        yield {
            status: 'refining',
            version: currentVersion,
            maxVersions: 0, // Not used in this implementation
            score: 0,
            message: `v${currentVersion} - 生成细纲草稿...`,
        };

        const { outline: newOutline } = await generateDetailedOutline(
            storyOutline, chapters, chapterTitle, options, previousAttempt, userInput, signal
        );

        if (signal?.aborted) { throw new Error("Operation aborted by user."); }

        yield {
            status: 'critiquing',
            version: currentVersion,
            maxVersions: 0,
            score: 0,
            message: `v${currentVersion} - 评估草稿...`,
        };

        const { critique: newCritique } = await critiqueDetailedOutline(
            newOutline, storyOutline, chapterTitle, options, signal
        );

        if (signal?.aborted) { throw new Error("Operation aborted by user."); }

        const newHistoryEntry: OptimizationHistoryEntry = {
            version: currentVersion,
            critique: newCritique,
            outline: newOutline,
        };

        const finalOutline: FinalDetailedOutline = {
            ...newOutline,
            finalVersion: currentVersion,
            optimizationHistory: isRefinement && parsedOutline ? [...parsedOutline.optimizationHistory, newHistoryEntry] : [newHistoryEntry],
        };

        yield {
            status: 'complete',
            version: currentVersion,
            maxVersions: 0,
            score: newCritique.overallScore,
            message: `v${currentVersion} - 完成。最终评分: ${newCritique.overallScore.toFixed(1)}`,
            finalOutline: finalOutline,
        };

    } catch (e: any) {
        if (e.name !== 'AbortError' && !e.message?.includes('aborted')) {
            yield { status: 'error', version: currentVersion, maxVersions: 0, score: 0, message: e.message };
        }
    }
}
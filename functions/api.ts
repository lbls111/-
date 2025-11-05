import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import type { GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import { prompts } from './prompts';
import type { StoryOptions, StoryOutline, GeneratedChapter, CharacterProfile, DetailedOutlineAnalysis, Citation } from '../types';

export const config = {
  runtime: 'edge',
};

const getClient = (options: StoryOptions) => {
    // Per Gemini API guidelines, API key must be used directly.
    // The user provides it via settings, which is passed in the payload.
    return new GoogleGenAI({ apiKey: options.apiKey });
};

// Safety settings to allow for creative writing freedom
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const callApi = async (options: StoryOptions, model: string, prompt: string, isJson = false): Promise<GenerateContentResponse> => {
    const ai = getClient(options);
    const generationConfig = {
        temperature: options.temperature,
        topP: ((options.diversity - 0.1) / 2.0), // A custom mapping from the UI's "diversity"
        topK: options.topK,
        candidateCount: 1,
    };
    
    const request: GenerateContentParameters = {
        model,
        contents: prompt,
        config: {
            ...generationConfig,
            ...(isJson && { responseMimeType: "application/json" })
        },
        safetySettings,
    };

    const response = await ai.models.generateContent(request);
    return response;
};

const callApiStream = async (options: StoryOptions, model: string, prompt: string) => {
    const ai = getClient(options);
    const generationConfig = {
        temperature: options.temperature,
        topP: ((options.diversity - 0.1) / 2.0),
        topK: options.topK,
        candidateCount: 1,
    };
    
    const request: GenerateContentParameters = {
        model,
        contents: prompt,
        config: generationConfig,
        safetySettings,
    };

    return await ai.models.generateContentStream(request);
};


export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { action, payload } = await req.json();
        const { options } = payload;

        switch (action) {
            case 'listModels':
                // @google/genai SDK doesn't have a listModels equivalent.
                // We return a curated list of recommended models to populate the UI.
                return new Response(JSON.stringify(['gemini-2.5-pro', 'gemini-2.5-flash']), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });

            case 'performSearch': {
                const { storyCore, options } = payload;
                const prompt = prompts.search(storyCore);
                const ai = getClient(options);
                
                const response = await ai.models.generateContent({
                    model: options.searchModel,
                    contents: prompt,
                    config: {
                      tools: [{googleSearch: {}}],
                      temperature: 0.5 // Lower temperature for factual research
                    },
                    safetySettings
                });
                
                const text = response.text;
                const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

                const citations: Citation[] = groundingMetadata?.groundingChunks
                    ?.filter((c: any) => c.web && c.web.uri)
                    .map((c: any) => ({ uri: c.web.uri, title: c.web.title || c.web.uri })) || [];

                return new Response(JSON.stringify({ text, citations }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'generateStoryOutline': {
                const { storyCore, options } = payload;
                const prompt = prompts.storyOutline(storyCore, options);
                const response = await callApi(options, options.planningModel, prompt);
                return new Response(JSON.stringify({ text: response.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            
            case 'generateChapter': {
                 const { outline, historyChapters, options, detailedChapterOutline } = payload as { outline: StoryOutline, historyChapters: GeneratedChapter[], options: StoryOptions, detailedChapterOutline: DetailedOutlineAnalysis };
                 const prompt = prompts.generateChapter(outline, historyChapters, detailedChapterOutline, options);
                 const stream = await callApiStream(options, options.writingModel, prompt);

                 const encoder = new TextEncoder();
                 const readableStream = new ReadableStream({
                     async start(controller) {
                         for await (const chunk of stream) {
                             const text = chunk.text;
                             controller.enqueue(encoder.encode(JSON.stringify({ text }) + '\n'));
                         }
                         controller.close();
                     },
                 });
                 return new Response(readableStream, { headers: { 'Content-Type': 'application/x-ndjson' } });
            }

            case 'generateChapterTitles': {
                const { outline, chapters, options } = payload;
                const prompt = prompts.generateChapterTitles(outline, chapters, options);
                const response = await callApi(options, options.planningModel, prompt, true);
                
                // Expecting a JSON response: { titles: ["...", "...", ...] }
                const result = JSON.parse(response.text);

                return new Response(JSON.stringify(result), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'generateDetailedOutline': {
                const { outline, chapters, chapterTitle, userInput, options } = payload;
                const prompt = prompts.generateDetailedOutline(outline, chapters, chapterTitle, userInput, options);
                const response = await callApi(options, options.planningModel, prompt);
                return new Response(JSON.stringify({ text: response.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'refineDetailedOutline': {
                const { previousOutlineJson, refinementRequest, chapterTitle, storyOutline, options } = payload;
                const prompt = prompts.refineDetailedOutline(previousOutlineJson, refinementRequest, chapterTitle, storyOutline, options);
                const response = await callApi(options, options.planningModel, prompt);
                return new Response(JSON.stringify({ text: response.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
            
            case 'editChapterText': {
                const { originalText, instruction, options } = payload;
                const prompt = prompts.editChapter(originalText, instruction, options);
                const response = await callApi(options, options.writingModel, prompt);
                return new Response(JSON.stringify({ text: response.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            case 'generateCharacterInteraction': {
                const { char1, char2, outline, options } = payload;
                const prompt = prompts.generateCharacterInteraction(char1, char2, outline, options);
                const stream = await callApiStream(options, options.writingModel, prompt);

                const encoder = new TextEncoder();
                const readableStream = new ReadableStream({
                     async start(controller) {
                         for await (const chunk of stream) {
                             const text = chunk.text;
                             controller.enqueue(encoder.encode(JSON.stringify({ text }) + '\n'));
                         }
                         controller.close();
                     },
                 });
                 return new Response(readableStream, { headers: { 'Content-Type': 'application/x-ndjson' } });
            }

            case 'generateNewCharacterProfile': {
                const { storyOutline, characterPrompt, options } = payload;
                const prompt = prompts.generateNewCharacter(storyOutline, characterPrompt, options);
                const response = await callApi(options, options.planningModel, prompt, true);
                return new Response(JSON.stringify({ text: response.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            default:
                return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (e: any) {
        console.error("API Error:", e);
        const error = e instanceof Error ? e.message : String(e);
        return new Response(JSON.stringify({ error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

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

import type { StoryOptions, Citation } from '../types';

interface PagesFunctionContext {
  request: Request;
}

// A more robust helper to extract a JSON object or array from a string.
const extractJsonFromText = (text: string): string => {
    const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
        try { JSON.parse(markdownMatch[1]); return markdownMatch[1].trim(); } catch (e) { /* Fall through */ }
    }
    let startIndex = -1;
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) { startIndex = firstBrace; } 
    else if (firstBracket !== -1) { startIndex = firstBracket; }
    if (startIndex === -1) { return text; }
    const startChar = text[startIndex];
    const endChar = startChar === '{' ? '}' : ']';
    let openCount = 0;
    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === startChar) { openCount++; } 
        else if (text[i] === endChar) { openCount--; }
        if (openCount === 0) {
            const potentialJson = text.substring(startIndex, i + 1);
            try { JSON.parse(potentialJson); return potentialJson; } catch (e) { break; }
        }
    }
    return text;
};

// --- Custom OpenAI-Compatible API Helpers ---

async function streamOpenAIResponse(
    apiUrl: string, apiKey: string, model: string, messages: { role: string; content: string }[], options: StoryOptions, writable: WritableStream
) {
    const writer = writable.getWriter();
    const encoder = new TextEncoder();
    try {
        const response = await fetch(new URL('/v1/chat/completions', apiUrl).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model, messages, stream: true, temperature: options.temperature,
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

async function postOpenAIRequest(
    apiUrl: string, apiKey: string, model: string, messages: { role: string; content: string }[], options: StoryOptions
): Promise<string> {
    const response = await fetch(new URL('/v1/chat/completions', apiUrl).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
            model, messages, stream: false, temperature: options.temperature,
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

// --- Main Handler ---

export const onRequestPost: (context: PagesFunctionContext) => Promise<Response> = async (context) => {
    let action: string | undefined;
    try {
        const { request } = context;
        const { action: reqAction, payload } = await request.json();
        action = reqAction;
        const { options, ...restPayload } = payload;
        
        if (action === 'listModels') {
            const modelResponse = await fetch(new URL('/v1/models', options.apiBaseUrl).toString(), { headers: { 'Authorization': `Bearer ${options.apiKey}` }});
            if (!modelResponse.ok) throw new Error(`Failed to fetch models: ${modelResponse.status} - ${await modelResponse.text()}`);
            const modelData = await modelResponse.json();
            const modelIds = modelData.data.map((m: any) => m.id).sort();
            return new Response(JSON.stringify(modelIds), { headers: { 'Content-Type': 'application/json' }});
        }
        
        let prompt: { role: string; content: string }[] = [];
        let model: string = '';
        let isStreaming = false;
        
        switch (action) {
            case 'performSearch': case 'generateStoryOutline': case 'generateDetailedOutline': 
            case 'refineDetailedOutline': case 'generateChapterTitles': case 'editChapterText': 
            case 'generateNewCharacterProfile':
                isStreaming = false; break;
            case 'generateChapter': case 'generateCharacterInteraction':
                isStreaming = true; break;
            default: throw new Error(`Unknown action: ${action}`);
        }

        switch (action) {
            case 'performSearch': model = options.searchModel; prompt = getSearchPrompts(restPayload.storyCore, options); break;
            case 'generateStoryOutline': model = options.planningModel; prompt = getStoryOutlinePrompts(restPayload.storyCore, options); break;
            case 'generateChapter': model = options.writingModel; prompt = getChapterPrompts(restPayload.outline, restPayload.historyChapters, options, restPayload.detailedChapterOutline); break;
            case 'generateChapterTitles': model = options.planningModel; prompt = getChapterTitlesPrompts(restPayload.outline, restPayload.chapters, options); break;
            case 'generateDetailedOutline': model = options.planningModel; prompt = getDetailedOutlinePrompts(restPayload.outline, restPayload.chapters, restPayload.chapterTitle, restPayload.userInput, options, restPayload.iterationConfig); break;
            case 'refineDetailedOutline': model = options.planningModel; prompt = getRefineDetailedOutlinePrompts(restPayload.originalOutlineJson, restPayload.refinementRequest, restPayload.chapterTitle, restPayload.storyOutline, options, restPayload.iterationConfig); break;
            case 'editChapterText': model = options.writingModel; prompt = getEditChapterTextPrompts(restPayload.originalText, restPayload.instruction, options); break;
            case 'generateCharacterInteraction': model = options.planningModel; prompt = getCharacterInteractionPrompts(restPayload.char1, restPayload.char2, restPayload.outline, options); break;
            case 'generateNewCharacterProfile': model = options.planningModel; prompt = getNewCharacterProfilePrompts(restPayload.storyOutline, restPayload.characterPrompt, options); break;
        }

        if (!model) throw new Error(`No model selected for action: ${action}. Please check your settings.`);

        if (isStreaming) {
            const { readable, writable } = new TransformStream();
            streamOpenAIResponse(options.apiBaseUrl, options.apiKey, model, prompt, options, writable);
            return new Response(readable, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' }});
        } else {
            const resultText = await postOpenAIRequest(options.apiBaseUrl, options.apiKey, model, prompt, options);
            let responseBody;
            const jsonText = extractJsonFromText(resultText);
            switch (action) {
                case 'performSearch': responseBody = { text: resultText, citations: [] }; break; // No citations in custom mode
                case 'generateStoryOutline': responseBody = { text: `[START_OUTLINE_JSON]\n${jsonText}\n[END_OUTLINE_JSON]` }; break;
                case 'generateDetailedOutline': case 'refineDetailedOutline': responseBody = { text: `[START_DETAILED_OUTLINE_JSON]\n${jsonText}\n[END_DETAILED_OUTLINE_JSON]` }; break;
                case 'generateChapterTitles': responseBody = { titles: JSON.parse(jsonText) }; break;
                case 'generateNewCharacterProfile': responseBody = { text: jsonText }; break;
                case 'editChapterText': responseBody = { text: resultText }; break;
                default: responseBody = { text: resultText };
            }
            return new Response(JSON.stringify(responseBody), { headers: { 'Content-Type': 'application/json' }});
        }

    } catch (e: any) {
        let status = 500;
        let message = e.message || "An unknown error occurred";
        const upstreamMatch = message.match(/Upstream API Error: (\d+)/);
        if (upstreamMatch && upstreamMatch[1]) {
            const upstreamStatus = parseInt(upstreamMatch[1], 10);
            const rawUpstreamBody = message.substring(message.indexOf('-') + 1).trim();
            if (upstreamStatus === 504 || upstreamStatus === 524) {
                message = "AI模型响应超时 (Gateway Timeout)。这通常在处理复杂请求（如生成多轮优化的细纲）时发生。建议：\n1. 在“细纲”设置中减少“最大优化次数”。\n2. 在系统设置中更换一个更快的模型（如Flash模型）用于规划。"; status = 504;
            } else if (upstreamStatus === 401) { message = "API密钥无效或未授权。请在设置中检查您的API密钥。"; status = 401;
            } else if (upstreamStatus === 429) { message = "已达到API速率限制 (Rate Limit Exceeded)。请稍后重试或检查您的API账户用量。"; status = 429;
            } else if (upstreamStatus === 400) {
                let upstreamError = "上游API报告了一个请求错误。";
                try { const errJson = JSON.parse(rawUpstreamBody); upstreamError = errJson.error?.message || rawUpstreamBody; } catch {}
                 message = `请求错误 (Bad Request): ${upstreamError}`; status = 400;
            } else { message = `上游API服务器错误 (状态码: ${upstreamStatus})。请稍后重试。`; status = upstreamStatus >= 500 ? 502 : 500; }
        }
        console.error(`[${new Date().toISOString()}] Action: ${action || 'unknown'} | Status: ${status} | Error: ${message}`);
        return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
    }
};
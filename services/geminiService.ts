// This service now handles both prompt generation and direct API calls,
// removing the need for a backend proxy and fixing the 405 errors.

import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis } from '../types';

// --- PROMPT GENERATION LOGIC (Moved from prompts.ts and fixed) ---

const formatForbiddenWords = (words: string[]): string => {
    if (!words || words.length === 0) return "无";
    return words.map(w => `"${w}"`).join('、');
};

const formatCharacters = (characters: CharacterProfile[]): string => {
    if (!characters || characters.length === 0) return "无";
    return characters.map(c => `- **${c.name} (${c.role})**: ${c.coreConcept}`).join('\n');
};

const formatWorldbook = (worldCategories: StoryOutline['worldCategories']): string => {
    if (!worldCategories || worldCategories.length === 0) return "无";
    return worldCategories.map(cat => `
### ${cat.name}
${cat.entries.map(e => `- **${e.key}**: ${e.value}`).join('\n')}
`).join('\n');
};

const formatHistory = (chapters: GeneratedChapter[]): string => {
    if (!chapters || chapters.length === 0) return "无";
    // Return last 3 chapters for context
    return chapters.slice(-3).map(c => `
### 第 ${c.id} 章: ${c.title} (摘要)
${c.content.substring(0, 300)}...
`).join('\n---\n');
};

const SYSTEM_PROMPT = `你是一个世界级的网络小说作家兼写作教练，人格被设定为“电影导演”，专注于通过文字营造强烈的画面感和动态感。你精通各种网文流派，尤其是用户指定的风格。你的任务是协助用户创作一部完整的小说。

**核心指令**:
1.  **绝对服从**: 严格遵循用户提供的所有指示、风格模仿要求和格式规范。
2.  **电影化写作**: 你的文字应像电影镜头一样，聚焦于角色的具体行动、环境的互动和富有潜台词的对话。多用短句，营造快节奏。
3.  **禁止内心独白与解释**: 除非被特别要求，否则绝不直接描写角色的内心想法或进行任何形式的旁白解释。通过角色的行为、表情和对话来“展示”他们的内心世界。
4.  **JSON格式**: 当被要求提供JSON时，你必须生成一个严格符合语法、可被解析的JSON对象。不要在JSON前后添加任何多余的文字或解释。
5.  **语言**: 你的所有输出都必须使用简体中文。`;

const SYSTEM_MESSAGE = { role: 'system', content: SYSTEM_PROMPT };

const prompts = {
    search: (storyCore: string): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：研究与分析
你是一个专业的市场分析师和网文研究员。请基于以下故事核心创意，利用你的知识库生成一份简明扼要的研究报告。

# 故事核心
\`\`\`
${storyCore}
\`\`\`

# 报告要求
1.  **题材分析**: 分析这个创意所属的网文题材，并列出该题材下最流行的3-5个核心“卖点”或“爽点”元素。
2.  **对标作品**: 找出2-3部与该创意相似的成功网络小说，并简要说明它们的成功之处以及可以借鉴的关键设定。
3.  **世界观构想**: 提出3个可以深化这个创意的世界观设定方向或独特的概念。
4.  **角色生态**: 基于“黄金配角”理论，构思多种功能的配角类型以丰富剧情。
5.  **总结**: 综合以上分析，为这个故事核心提供一个清晰、有市场潜力的发展方向建议。

报告需简洁、条理清晰，直接输出报告内容。`}]),

    storyOutline: (researchReport: string, options: StoryOptions): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：生成完整创作计划
你是一个顶级的网文编辑和策划人。基于以下AI研究报告和用户设定，为故事创作一份详尽的创作计划。这份计划必须是一个完整的JSON对象。

**你的输出必须且只能是一个JSON对象。**

# AI研究报告与用户设定
\`\`\`
${researchReport}
\`\`\`
- **故事类型**: ${options.style}
- **故事长度**: ${options.length}
- **仿写风格**: ${options.authorStyle}

# JSON结构要求
请严格按照下面的TypeScript类型定义来构建你的JSON输出。你必须自主决策并生成一个完整的“角色生态系统”，包括核心、次要和多个具体的“龙套”角色，并动态地、创造性地设计5-7个与故事类型高度相关的专属世界观分类。
\`\`\`typescript
interface StoryOutline {
  title: string;
  genreAnalysis: string;
  worldConcept: string;
  plotSynopsis: string;
  characters: CharacterProfile[];
  writingMethodology: WritingMethodology;
  antiPatternGuide: AntiPatternGuide;
  worldCategories: WorldCategory[];
}
//... (interfaces for CharacterProfile, WritingMethodology, etc. are implicitly defined here based on the fields below)
\`\`\`
# 角色档案 (CharacterProfile)
- role: '主角' | '核心配角' | '次要角色' | '龙套角色' | '反派'
- name: (一个独特且符合风格的名字)
- coreConcept, definingObject, physicalAppearance, behavioralQuirks, speechPattern, originFragment, hiddenBurden, immediateGoal, longTermAmbition, whatTheyRisk, keyRelationship, mainAntagonist, storyFunction, potentialChange
- customFields: (一个自创的、与故事高度相关的属性名): (属性值)

# 世界书 (WorldCategory)
- name: (一个原创的、对此故事至关重要的世界观分类)
- entries: [{key, value}]

# 执行指令
现在，请深度模仿 **${options.authorStyle}** 的风格，生成上述结构的JSON对象。确保所有字段都被填充，内容详实且引人入- 胜。`}]),

    generateChapter: (outline: StoryOutline, history: GeneratedChapter[], detailedOutline: DetailedOutlineAnalysis, options: StoryOptions): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：撰写小说章节
你是一位模仿大师，现在你的灵魂是 **${options.authorStyle}**。你的任务是基于故事大纲、章节历史、以及本章的详细分镜，撰写新的章节。

## 核心写作指令
- **风格模仿**: 你的每一个字、每一个标点，都必须深度模仿 **${options.authorStyle}** 的风格。
- **电影化叙事**: 严格遵循“电影导演”人格，只写角色能看到、听到、做到的事。通过动作、对话和环境互动来推动剧情。
- **禁止内心独白与旁白解释**: 绝对禁止。
- **违禁词**: 绝对禁止使用以下词汇: ${formatForbiddenWords(options.forbiddenWords)}
- **篇幅要求**: 本章内容必须充实，不低于2000字。

## 上下文
### 故事大纲
${outline.plotSynopsis}
### 角色简介
${formatCharacters(outline.characters)}
### 世界观核心
${formatWorldbook(outline.worldCategories)}
### 最近章节历史
${formatHistory(history)}

## 本章详细分镜
你必须严格按照下面的分镜作为剧本，来撰写本章内容。
\`\`\`json
${JSON.stringify(detailedOutline, null, 2)}
\`\`\`

## 输出格式
你的输出必须严格遵循以下格式，分为“思考过程”和“章节正文”两部分。
1.  **思考过程**: 在 \`[START_THOUGHT_PROCESS]\` 标签后，简要阐述你将如何运用 **${options.authorStyle}** 的标志性手法来表现本章的核心冲突和情绪转折。
2.  **章节正文**: 在 \`[START_CHAPTER_CONTENT]\` 标签后，直接开始撰写章节正文。

\`\`\`
[START_THOUGHT_PROCESS]
(在这里写下你的创作思路...)
[START_CHAPTER_CONTENT]
(在这里开始写章节正文...)
\`\`\`

现在，化身为 **${options.authorStyle}**，开始你的创作。`}]),
    
    generateChapterTitles: (outline: StoryOutline, chapters: GeneratedChapter[], options: StoryOptions): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：生成后续章节标题
你是一个经验丰富的网文编辑，擅长构思吸引人的章节标题。基于以下故事信息，生成10个符合故事风格和节奏的后续章节标题。

## 故事信息
- **标题**: ${outline.title}
- **大纲**: ${outline.plotSynopsis}
- **已完成章节数**: ${chapters.length}
- **仿写风格**: ${options.authorStyle}

## 要求
- 生成10个全新的、连贯的章节标题。
- 标题要能勾起读者好奇心，体现 **${options.authorStyle}** 的风格。
- 以JSON格式输出，结构如下：
\`\`\`json
{
  "titles": [
    "标题一",
    "标题二",
    ...
  ]
}
\`\`\`

请直接输出JSON对象。`}]),

    generateDetailedOutline: (outline: StoryOutline, chapters: GeneratedChapter[], chapterTitle: string, userInput: string): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：生成章节细纲初稿 (v1)
你是一个由顶级网文作家和资深编辑组成的AI写作委员会。你的任务是为指定章节生成一个极其详尽、可执行的“细纲分析初稿”及其“第三方评估报告”。

## 上下文
- **故事大纲**: ${outline.plotSynopsis}
- **角色列表**: ${formatCharacters(outline.characters)}
- **世界观**: ${formatWorldbook(outline.worldCategories)}
- **上一章内容摘要**: ${chapters.length > 0 ? chapters[chapters.length - 1].content.substring(0, 300) + '...' : '这是第一章。'}
- **当前章节标题**: "${chapterTitle}"
- **用户额外指令**: ${userInput || '无'}

## 输出格式
你的输出必须是一个被 \`[START_DETAILED_OUTLINE_JSON]\` 和 \`[END_DETAILED_OUTLINE_JSON]\` 包裹的、严格符合以下TypeScript接口的JSON对象。

\`\`\`typescript
interface FinalDetailedOutline {
  finalVersion: 1;
  optimizationHistory: [
    {
      version: 1,
      critique: OutlineCritique,
      outline: DetailedOutlineAnalysis
    }
  ];
  // ... plus all fields from DetailedOutlineAnalysis ...
}
//... (interfaces for DetailedOutlineAnalysis, PlotPointAnalysis, OutlineCritique etc. are implicitly defined here)
\`\`\`

## 执行流程 (原子操作)
1.  **生成v1细纲**: 首先，基于所有上下文，创作一个符合 \`DetailedOutlineAnalysis\` 结构的细纲初稿 (v1)。
2.  **批判v1**: 接着，你将扮演一个极其挑剔的评论家，对你刚刚生成的v1细纲进行评估，产出一个符合 \`OutlineCritique\` 结构体的评估报告。
3.  **组装最终JSON**: 最后，将v1细纲和对v1的批判报告组装成一个符合 \`FinalDetailedOutline\` 结构的最终JSON对象。

现在，开始工作。请直接输出最终的JSON对象。`}]),

    refineDetailedOutline: (previousOutlineJson: string, refinementRequest: string, chapterTitle: string, storyOutline: StoryOutline): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：迭代优化章节细纲
你是一个由顶级网文作家和资深编辑组成的AI写作委员会。你收到了一个已有的章节细纲版本和新的优化指令，需要在此基础上生成一个更优的新版本。

## 上下文
- **故事大纲**: ${storyOutline.plotSynopsis}
- **章节标题**: "${chapterTitle}"
- **用户本轮优化指令**: ${refinementRequest || '无，请根据上一轮的自我评估报告进行优化。'}

## 上一版细纲数据
\`\`\`json
${previousOutlineJson}
\`\`\`

## 输出格式
你的输出必须是一个被 \`[START_DETAILED_OUTLINE_JSON]\` 和 \`[END_DETAILED_OUTLINE_JSON]\` 包裹的、严格符合 \`FinalDetailedOutline\` 结构的JSON对象。

## 执行流程 (原子操作)
1.  **解析旧数据**: 解析“上一版细纲数据”。
2.  **生成新版细纲 (Vx+1)**: 基于旧版细纲、其历史评估报告以及用户本轮的优化指令，创作一个全新的、更强的 \`DetailedOutlineAnalysis\`。
3.  **批判新版**: 对新版细纲进行评估，产出新的 \`OutlineCritique\`。
4.  **组装最终JSON**: 将新版细纲和批判报告组合成一个新的历史条目，添加到 \`optimizationHistory\` 数组中，并更新 \`finalVersion\`。

现在，开始工作。请直接输出最终的JSON对象。`}]),

    editChapter: (originalText: string, instruction: string, options: StoryOptions): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：文本微调
你是一位精通模仿 **${options.authorStyle}** 风格的文字编辑。根据用户的指令，对提供的文本进行精确、局部的修改。

## 原始文本
\`\`\`
${originalText}
\`\`\`

## 修改指令
\`\`\`
${instruction}
\`\`\`

## 要求
1.  **精确修改**: 只修改指令中提到的部分。
2.  **风格一致**: 修改后的部分必须与原文风格（**${options.authorStyle}**）完美融合。
3.  **完整输出**: 返回修改后的完整章节文本。

现在，请开始修改并输出完整文本。`}]),

    generateCharacterInteraction: (char1: CharacterProfile, char2: CharacterProfile, outline: StoryOutline, options: StoryOptions): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：生成角色互动场景
你是一位模仿大师，现在你的灵魂是 **${options.authorStyle}**。你的任务是基于两个角色档案和故事背景，创作一个500字左右的短场景，展现他们之间的互动。

## 角色1: ${char1.name} (${char1.coreConcept})
## 角色2: ${char2.name} (${char2.coreConcept})
## 故事背景
${outline.plotSynopsis}

## 场景要求
创作一个能体现两人性格、关系和潜在冲突的场景。场景需要有明确的开始、发展和结束。

现在，化身为 **${options.authorStyle}**，开始你的创作。`}]),
    
    generateNewCharacter: (storyOutline: StoryOutline, characterPrompt: string, options: StoryOptions): any[] => ([SYSTEM_MESSAGE, { role: 'user', content: `
# 任务：生成新角色档案
你是一个顶级的网文作者，精通角色设计。基于已有的故事大纲和用户提供的新角色概念，生成一个符合 **${options.authorStyle}** 风格的、完整的角色档案。

## 故事大纲
${storyOutline.plotSynopsis}
## 已有角色
${formatCharacters(storyOutline.characters)}
## 用户新角色概念
\`\`\`
${characterPrompt}
\`\`\`

## 要求
- 你的输出必须是一个严格符合以下TypeScript接口的JSON对象。
- 不要输出任何其他内容，只输出JSON。

\`\`\`typescript
interface CharacterProfile {
  role: string; name: string; coreConcept: string; definingObject: string;
  physicalAppearance: string; behavioralQuirks: string; speechPattern: string;
  originFragment: string; hiddenBurden: string; immediateGoal: string;
  longTermAmbition: string; whatTheyRisk: string; keyRelationship: string;
  mainAntagonist: string; storyFunction: string; potentialChange: string;
}
\`\`\`

请立即生成JSON对象。`}]),
};


// --- API CALL LOGIC ---

// Helper to make all API calls directly from the frontend
const callExternalApi = async (options: StoryOptions, model: string, prompt: any[], stream = false) => {
    const { apiBaseUrl, apiKey, temperature, diversity, topK } = options;

    const body = {
        model,
        messages: prompt,
        temperature,
        top_p: ((diversity - 0.1) / 2.0),
        top_k: topK,
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
        throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response;
};

async function* streamFetch(options: StoryOptions, model: string, prompt: any[]): AsyncGenerator<any, void, undefined> {
    const response = await callExternalApi(options, model, prompt, true);

    if (!response.body) {
        throw new Error("Response body is empty.");
    }

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
                if (data.trim() === '[DONE]') return;
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed.choices?.[0]?.delta?.content || '';
                    if (text) yield { text };
                } catch (e) {
                    console.error("Error parsing stream data:", data, e);
                }
            }
        }
    }
}

async function postFetch<T>(options: StoryOptions, model: string, prompt: any[]): Promise<T> {
    const response = await callExternalApi(options, model, prompt);
    const data = await response.json();
    const rawText = data.choices[0].message.content;

    // Helper to extract JSON from a text response that might have markdown noise.
    const extractJson = (text: string): any => {
        // Find the first '{' or '[' to start the JSON string
        const jsonStart = text.indexOf('{');
        const arrayStart = text.indexOf('[');
        let start = -1;

        if (jsonStart === -1 && arrayStart === -1) {
            throw new Error("API响应中未找到JSON对象或数组。");
        }

        if (jsonStart === -1) start = arrayStart;
        else if (arrayStart === -1) start = jsonStart;
        else start = Math.min(jsonStart, arrayStart);
        
        // Find the last '}' or ']' to end the JSON string
        const jsonEnd = text.lastIndexOf('}');
        const arrayEnd = text.lastIndexOf(']');
        let end = Math.max(jsonEnd, arrayEnd);

        if (end === -1 || end < start) {
            throw new Error("API响应中的JSON对象或数组不完整。");
        }

        const jsonString = text.substring(start, end + 1);
        try {
            return JSON.parse(jsonString);
        } catch (e: any) {
            console.error("解析JSON失败:", jsonString);
            throw new Error(`从API响应解析JSON失败: ${e.message}`);
        }
    }

    // Some responses expect raw text, others expect JSON.
    // We will try to parse JSON, and if it fails, we assume it's a raw text response.
    // A better approach is to have the caller specify the expected type.
    // For now, let's make a simple determination.
    const isJsonExpected = prompt[1].content.includes("JSON");

    if (isJsonExpected) {
         try {
            return extractJson(rawText) as T;
        } catch(e) {
            // It was expecting JSON but failed. Throw the error.
            throw e;
        }
    }
    
    // It was expecting a text response.
    return { text: rawText } as T;
}


export const listModels = (options: { apiBaseUrl: string, apiKey: string }): Promise<string[]> => {
    // This is a mock implementation as we can't truly list models from a generic endpoint.
    // We return a set of common models. The user can type in others.
    return Promise.resolve(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemma-7b-it', 'llama3-70b-8192', 'claude-3-opus-20240229']);
}

export const performSearch = (storyCore: string, options: StoryOptions): Promise<{ text: string; citations: [] }> => {
    const prompt = prompts.search(storyCore);
    return postFetch(options, options.searchModel, prompt);
};

export const generateStoryOutline = (storyCore: string, options: StoryOptions): Promise<StoryOutline> => {
    const prompt = prompts.storyOutline(storyCore, options);
    return postFetch(options, options.planningModel, prompt);
};

export const generateChapterStream = (
    outline: StoryOutline,
    historyChapters: GeneratedChapter[],
    options: StoryOptions,
    detailedChapterOutline: DetailedOutlineAnalysis
) => {
    const prompt = prompts.generateChapter(outline, historyChapters, detailedChapterOutline, options);
    return streamFetch(options, options.writingModel, prompt);
};

export const generateChapterTitles = (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    options: StoryOptions
): Promise<{ titles: string[] }> => {
    const prompt = prompts.generateChapterTitles(outline, chapters, options);
    return postFetch(options, options.planningModel, prompt);
};

export const generateDetailedOutline = (
    outline: StoryOutline,
    chapters: GeneratedChapter[],
    chapterTitle: string,
    userInput: string,
    options: StoryOptions
): Promise<{ text: string }> => {
    const prompt = prompts.generateDetailedOutline(outline, chapters, chapterTitle, userInput);
     return postFetch(options, options.planningModel, prompt);
}

export const refineDetailedOutline = (
    previousOutlineJson: string,
    refinementRequest: string,
    chapterTitle: string,
    storyOutline: StoryOutline,
    options: StoryOptions
): Promise<{ text: string }> => {
    const prompt = prompts.refineDetailedOutline(previousOutlineJson, refinementRequest, chapterTitle, storyOutline);
     return postFetch(options, options.planningModel, prompt);
}

export const editChapterText = (
    originalText: string,
    instruction: string,
    options: StoryOptions
): Promise<{ text: string }> => {
    const prompt = prompts.editChapter(originalText, instruction, options);
    return postFetch(options, options.writingModel, prompt);
};

export const generateCharacterInteractionStream = (
    char1: CharacterProfile,
    char2: CharacterProfile,
    outline: StoryOutline,
    options: StoryOptions
) => {
    const prompt = prompts.generateCharacterInteraction(char1, char2, outline, options);
    return streamFetch(options, options.writingModel, prompt);
};

export const generateNewCharacterProfile = (
    storyOutline: StoryOutline,
    characterPrompt: string,
    options: StoryOptions
): Promise<CharacterProfile> => {
    const prompt = prompts.generateNewCharacter(storyOutline, characterPrompt, options);
    return postFetch(options, options.planningModel, prompt);
};

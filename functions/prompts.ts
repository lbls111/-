import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis, FinalDetailedOutline } from '../types';

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
4.  **JSON格式**: 当被要求提供JSON时，你必须生成一个严格符合语法、可被解析的JSON对象，并将其包裹在指定的开始和结束标签内。不要在JSON前后添加任何多余的文字或解释。
5.  **语言**: 你的所有输出都必须使用简体中文。`;

export const prompts = {
    search: (storyCore: string): string => `
# 任务：研究与分析
你是一个专业的市场分析师和网文研究员。请基于以下故事核心创意，利用你的知识库和搜索能力，生成一份简明扼要的研究报告。

# 故事核心
\`\`\`
${storyCore}
\`\`\`

# 报告要求
1.  **题材分析**: 分析这个创意所属的网文题材（例如：都市、玄幻、科幻），并列出该题材下最流行的3-5个核心“卖点”或“爽点”元素。
2.  **对标作品**: 找出2-3部与该创意相似的成功网络小说，并简要说明它们的成功之处以及可以借鉴的关键设定。
3.  **世界观构想**: 提出3个可以深化这个创意的世界观设定方向或独特的“金手指”概念。
4.  **总结**: 综合以上分析，为这个故事核心提供一个清晰、有市场潜力的发展方向建议。

报告需简洁、条理清晰，直接输出报告内容。`,

    storyOutline: (researchReport: string, options: StoryOptions): string => `
# 任务：生成完整创作计划
你是一个顶级的网文编辑和策划人。基于以下AI研究报告和用户设定，为故事创作一份详尽的创作计划。这份计划必须是一个完整的JSON对象，严格遵循指定的结构。

**你的输出必须且只能是一个被 \`[START_OUTLINE_JSON]\` 和 \`[END_OUTLINE_JSON]\` 包裹的JSON对象。**

# AI研究报告与用户设定
\`\`\`
${researchReport}
\`\`\`
- **故事类型**: ${options.style}
- **故事长度**: ${options.length}
- **仿写风格**: ${options.authorStyle}

# JSON结构要求
请严格按照下面的TypeScript类型定义来构建你的JSON输出：
\`\`\`typescript
interface StoryOutline {
  title: string; // 故事标题
  genreAnalysis: string; // 一句话总结：这是一个什么类型的故事，核心卖点是什么
  worldConcept: string; // 简要描述核心世界观或背景设定
  plotSynopsis: string; // 故事大纲，500-800字，清晰描述故事的起承转合
  characters: CharacterProfile[]; // 3-5个主要角色的档案
  writingMethodology: WritingMethodology; // 写作方法论
  antiPatternGuide: AntiPatternGuide; // “反模式”写作指南
  worldCategories: WorldCategory[]; // 世界观核心设定
}

interface CharacterProfile {
  role: '主角' | '女主角' | '重要配角' | '反派';
  name: string;
  coreConcept: string; // 一句话核心人设
  definingObject: string; // 一个代表角色的标志性物品
  physicalAppearance: string; // 外貌
  behavioralQuirks: string; // 行为怪癖
  speechPattern: string; // 语言模式
  originFragment: string; // 起源故事片段
  hiddenBurden: string; // 内心秘密或负担
  immediateGoal: string; // 故事开始时的即时目标
  longTermAmbition: string; // 长期野心
  whatTheyRisk: string; // 他/她赌上的是什么
  keyRelationship: string; // 与另一角色的关键关系
  mainAntagonist: string; // 主要对手是谁
  storyFunction: string; // 在故事中的功能/作用
  potentialChange: string; // 角色可能的成长或堕落
}

interface WritingMethodology {
    icebergNarrative: { description: string; application: string; }; // 冰山叙事
    roughLanguage: { description:string; application:string; }; // 糙话美学
    actionDrivenPlot: { description: string; application: string; }; // 动作驱动
    functionalEnvironment: { description: string; application: string; }; // 功能性环境
    meaningfulAction?: { description: string; application: string; }; // 有意义的动作
    cinematicTransitions: { description: string; application: string; }; // 电影化转场
}

interface AntiPatternGuide {
    noInnerMonologue: { description: string; instruction: string; }; // 禁止内心独白
    noExposition: { description:string; instruction: string; }; // 禁止解释说明
    noMetaphors: { description: string; instruction: string; }; // 禁止文学性比喻
    noCliches: { description: string; instruction: string; }; // 禁用陈词滥调
}

interface WorldCategory {
  name: string; // e.g., "核心设定", "修炼体系", "组织势力"
  entries: WorldEntry[];
}

interface WorldEntry {
  key: string;
  value: string;
}
\`\`\`

# 执行指令
现在，请深度模仿 **${options.authorStyle}** 的风格，生成上述结构的JSON对象。确保所有字段都被填充，内容详实且引人入र्प。
[START_OUTLINE_JSON]
{
  // ... 在这里生成完整的JSON对象 ...
}
[END_OUTLINE_JSON]
`,

    generateChapter: (outline: StoryOutline, history: GeneratedChapter[], detailedOutline: DetailedOutlineAnalysis, options: StoryOptions): string => `
# 任务：撰写小说章节
你是一位模仿大师，现在你的灵魂是 **${options.authorStyle}**。你的任务是基于故事大纲、章节历史、以及本章的详细分镜，撰写新的章节。

## 核心写作指令
- **风格模仿**: 你的每一个字、每一个标点，都必须深度模仿 **${options.authorStyle}** 的风格。
- **电影化叙事**: 严格遵循“电影导演”人格，只写角色能看到、听到、做到的事。通过动作、对话和环境互动来推动剧情。
- **禁止内心独白**: 绝对禁止直接描写角色的内心想法、心理活动或情绪。
- **禁止旁白解释**: 绝对禁止任何形式的背景介绍、设定解释或旁白。
- **违禁词**: 绝对禁止使用以下词汇: ${formatForbiddenWords(options.forbiddenWords)}

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
你必须严格按照下面的分镜来撰写本章内容。
\`\`\`json
${JSON.stringify(detailedOutline, null, 2)}
\`\`\`

## 输出格式
你的输出必须严格遵循以下格式，分为“思考过程”和“章节正文”两部分。
1.  **思考过程**: 在 \`[START_THOUGHT_PROCESS]\` 标签后，简要阐述你将如何运用 **${options.authorStyle}** 的标志性手法来表现本章的核心冲突和情绪转折。
2.  **章节正文**: 在 \`[START_CHAPTER_CONTENT]\` 标签后，直接开始撰写章节正文。如果合适，可以在正文开头加上章节标题，格式为 \`章节标题：...\`。

\`\`\`
[START_THOUGHT_PROCESS]
(在这里写下你的创作思路...)
[START_CHAPTER_CONTENT]
(在这里开始写章节正文...)
\`\`\`

现在，化身为 **${options.authorStyle}**，开始你的创作。`,
    
    generateChapterTitles: (outline: StoryOutline, chapters: GeneratedChapter[], options: StoryOptions): string => `
# 任务：生成后续章节标题
你是一个经验丰富的网文编辑，擅长构思吸引人的章节标题。基于以下故事信息，生成10个符合故事风格和节奏的后续章节标题。

## 故事信息
- **标题**: ${outline.title}
- **大纲**: ${outline.plotSynopsis}
- **已完成章节数**: ${chapters.length}
- **最新章节标题**: ${chapters.length > 0 ? chapters[chapters.length - 1].title : '无'}
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

请直接输出JSON对象。`,

    generateDetailedOutline: (outline: StoryOutline, chapters: GeneratedChapter[], chapterTitle: string, userInput: string, options: StoryOptions): string => `
# 任务：生成章节细纲并进行迭代优化 (V1)
你是一个由顶级网文作家、资深编辑和数据分析师组成的AI写作委员会。你的任务是为指定章节生成一个极其详尽、可执行的“细纲分析”，并立即对其进行第一轮的“自我批判与优化”。

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
// The new top-level type for the final detailed outline, which includes the history
interface FinalDetailedOutline extends DetailedOutlineAnalysis {
  finalVersion: number; // 最终版本号，对于初次生成，此值为 1
  optimizationHistory: OptimizationHistoryEntry[]; // 优化历史记录
}

// An entry for one round of optimization
interface OptimizationHistoryEntry {
  version: number; // 版本号，对于初次生成，此值为 1
  critique: OutlineCritique; // 对当前版本大纲的评估
  outline: DetailedOutlineAnalysis; // 当前版本的大纲本身
}

// Types for the new structured detailed outline
interface DetailedOutlineAnalysis {
  plotPoints: PlotPointAnalysis[]; // 将本章剧情拆分为3-5个关键剧情点
  nextChapterPreview: NextChapterPreview; // 对下一章的规划
}

interface PlotPointAnalysis {
  summary: string; // 剧情点摘要
  emotionalCurve: string; // 本剧情点要实现的情绪曲线任务 (例如：从紧张到释放)
  maslowsNeeds: string; // 驱动角色行动的马斯洛需求层次 (安全、归属、尊重、自我实现等)
  webNovelElements: string; // 本剧情点包含的核心网文元素 (爽点、钩子、悬念、反转等)
  conflictSource: string; // 冲突来源 (人与人, 人与环境, 人与内心)
  showDontTell: string; // “展示而非讲述”的具体实现建议
  dialogueAndSubtext: string; // 关键对话和潜台词设计
  logicSolidification: string; // 逻辑夯实，如何让剧情更合理
  emotionAndInteraction: string; // 情绪与互动强化，如何让角色互动更有张力
  pacingControl: string; // 节奏控制，是加速还是放缓
}

interface NextChapterPreview {
  nextOutlineIdea: string; // 对下一章剧情的初步构想
  characterNeeds: string; // 登场角色在下一章的需求和目标
}

// New types for the iterative critique framework
interface OutlineCritique {
  overallScore: number; // 综合评分 (0.0 - 10.0)
  scoringBreakdown: ScoringDimension[]; // 各维度评分
  improvementSuggestions: ImprovementSuggestion[]; // 改进建议
}

interface ScoringDimension {
  dimension: string; // 维度 (例如: "节奏与爽点", "角色弧光", "逻辑性", "情绪张力", "创新性")
  score: number; // 分数 (0-10)
  reason: string; // 评分理由
}

interface ImprovementSuggestion {
  area: string; // 改进领域
  suggestion: string; // 具体建议
}
\`\`\`

## 执行流程 (原子操作)
1.  **生成V1细纲**: 首先，基于所有上下文，创作一个符合 \`DetailedOutlineAnalysis\` 结构的细纲初稿 (我们称之为V1)。
2.  **批判V1**: 接着，你将扮演一个极其挑剔的评论家，对你刚刚生成的V1细纲进行评估，产出一个符合 \`OutlineCritique\` 结构体的评估报告。评分标准参考业界顶尖作品（如《庆余年》、《诡秘之主》、《大奉打更人》）。
3.  **组装最终JSON**: 最后，将V1细纲和对V1的批判报告组装成一个符合 \`FinalDetailedOutline\` 结构的最终JSON对象。此时 \`finalVersion\` 为1，\`optimizationHistory\` 数组中只包含一个V1的 \`OptimizationHistoryEntry\`。

现在，开始工作。请直接输出最终的JSON对象。
[START_DETAILED_OUTLINE_JSON]
{
  // ... 在这里生成完整的JSON对象 ...
}
[END_DETAILED_OUTLINE_JSON]
`,

    refineDetailedOutline: (previousOutlineJson: string, refinementRequest: string, chapterTitle: string, storyOutline: StoryOutline, options: StoryOptions): string => `
# 任务：迭代优化章节细纲
你是一个由顶级网文作家、资深编辑和数据分析师组成的AI写作委员会。你收到了一个已有的章节细纲版本和新的优化指令，需要在此基础上生成一个更优的新版本。

## 上下文
- **故事大纲**: ${storyOutline.plotSynopsis}
- **章节标题**: "${chapterTitle}"
- **仿写风格**: ${options.authorStyle}
- **用户本轮优化指令**: ${refinementRequest || '无，请根据上一轮的自我评估报告进行优化。'}

## 上一版细纲数据
\`\`\`json
${previousOutlineJson}
\`\`\`

## 输出格式
你的输出必须是一个被 \`[START_DETAILED_OUTLINE_JSON]\` 和 \`[END_DETAILED_OUTLINE_JSON]\` 包裹的、严格符合之前定义的 \`FinalDetailedOutline\` TypeScript接口的JSON对象。

## 执行流程 (原子操作)
1.  **解析旧数据**: 首先，解析“上一版细纲数据”中的JSON。注意其 \`finalVersion\` 和 \`optimizationHistory\`。
2.  **生成新版细纲 (Vx+1)**: 基于旧版细纲、其历史评估报告以及用户本轮的优化指令，创作一个全新的、更强的、符合 \`DetailedOutlineAnalysis\` 结构的新版细纲。
3.  **批判新版**: 扮演挑剔的评论家，对你刚刚生成的新版细纲进行评估，产出一个符合 \`OutlineCritique\` 结构的评估报告。
4.  **组装最终JSON**: 将新版细纲和对其的批判报告组合成一个新的 \`OptimizationHistoryEntry\`。将其添加到 \`optimizationHistory\` 数组中。更新 \`finalVersion\` 为新版本号。将所有内容组装成一个符合 \`FinalDetailedOutline\` 结构的最终JSON对象。

现在，开始工作。请直接输出最终的JSON对象。
[START_DETAILED_OUTLINE_JSON]
{
  // ... 在这里生成完整的、更新后的JSON对象 ...
}
[END_DETAILED_OUTLINE_JSON]
`,

    editChapter: (originalText: string, instruction: string, options: StoryOptions): string => `
# 任务：文本微调
你是一位精通模仿 **${options.authorStyle}** 风格的文字编辑。你的任务是根据用户的指令，对提供的文本进行精确、局部的修改，同时保持其余部分的风格和内容不变。

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

现在，请开始修改并输出完整文本。`,

    generateCharacterInteraction: (char1: CharacterProfile, char2: CharacterProfile, outline: StoryOutline, options: StoryOptions): string => `
# 任务：生成角色互动场景
你是一位模仿大师，现在你的灵魂是 **${options.authorStyle}**。你的任务是基于两个角色档案和故事背景，创作一个500字左右的短场景，展现他们之间的互动。

## 核心写作指令
- **风格模仿**: 你的每一个字、每一个标点，都必须深度模仿 **${options.authorStyle}** 的风格。
- **电影化叙事**: 严格遵循“电影导演”人格，只写角色能看到、听到、做到的事。通过动作、对话和环境互动来推动剧情。
- **禁止内心独白与旁白解释**: 绝对禁止。

## 角色1: ${char1.name}
- **核心概念**: ${char1.coreConcept}
- **语言模式**: ${char1.speechPattern}
- **当前目标**: ${char1.immediateGoal}

## 角色2: ${char2.name}
- **核心概念**: ${char2.coreConcept}
- **语言模式**: ${char2.speechPattern}
- **当前目标**: ${char2.immediateGoal}

## 故事背景
${outline.plotSynopsis}

## 场景要求
创作一个能体现两人性格、关系和潜在冲突的场景。场景需要有明确的开始、发展和结束。

现在，化身为 **${options.authorStyle}**，开始你的创作。`,
    
    generateNewCharacter: (storyOutline: StoryOutline, characterPrompt: string, options: StoryOptions): string => `
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
  role: '主角' | '女主角' | '重要配角' | '反派';
  name: string;
  coreConcept: string;
  definingObject: string;
  physicalAppearance: string;
  behavioralQuirks: string;
  speechPattern: string;
  originFragment: string;
  hiddenBurden: string;
  immediateGoal: string;
  longTermAmbition: string;
  whatTheyRisk: string;
  keyRelationship: string;
  mainAntagonist: string;
  storyFunction: string;
  potentialChange: string;
}
\`\`\`

请立即生成JSON对象。`
};

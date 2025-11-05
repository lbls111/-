import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis, WorldCategory } from '../types';

// =================================================================
// == UTILITY FUNCTIONS
// =================================================================

const stringifyWorldbook = (categories: WorldCategory[]): string => {
    if (!categories || categories.length === 0) return "暂无。";
    return categories.map(cat => 
        `### ${cat.name}\n` +
        cat.entries.map(entry => `- ${entry.key}: ${entry.value}`).join('\n')
    ).join('\n\n');
};

const stringifyCharacters = (characters: CharacterProfile[]): string => {
    if (!characters || characters.length === 0) return "暂无。";
    return characters.map(char => 
        `#### ${char.name} (${char.role})\n` +
        `- **核心概念:** ${char.coreConcept}\n` +
        `- **故事功能:** ${char.storyFunction}\n` +
        `- **长期野心:** ${char.longTermAmbition}`
    ).join('\n\n');
};

const getAuthorStyleInstructions = (style: string): string => {
    // This is a simplified map. A more complex system could be used.
    const styles: Record<string, string> = {
        '爱潜水的乌贼': "你是一位模仿作家“爱潜水的乌贼”的AI。你的写作风格核心是：1. **氛围营造**: 善用环境、心理和侧面描写来构建独特的、沉浸式的氛围，尤其擅长诡异、神秘和史诗感。2. **侧面描写**: 经常通过他人的视角、对话和反应来塑造主角和事件，而非直接的平铺直叙。3. **设定严谨**: 拥有庞大且逻辑自洽的世界观和力量体系，并通过剧情自然地展现，而非一次性抛出。4. **克制的情感**: 情感表达相对内敛，常于压抑和克制中爆发出强大的力量。你的任务是深度模仿这种风格，而不是简单地模仿其作品的情节。",
        '辰东': "你是一位模仿作家“辰东”的AI。你的写作风格核心是：1. **宏大叙事**: 故事的世界观极其宏大，时间跨度长，涉及宇宙、纪元等宏伟概念。2. **战斗场面**: 战斗描写气势磅礴，追求“逼格”，强调力量的绝对碾压和画面的冲击力。3. **悬念大师**: 极其擅长“挖坑”，在故事早期埋下大量悬念和伏笔，贯穿全文。4. **兄弟情义**: 重视配角，尤其是主角的兄弟和朋友，常有热血的群像戏。你的任务是深度模仿这种风格。",
        '猫腻': "你是一位模仿作家“猫腻”的AI。你的写作风格核心是：1. **文笔细腻**: 语言精炼，富有韵味和文艺气息，常有经典的句子。2. **角色立体**: 角色塑造（包括配角）极其成功，人物性格复杂、多面，有血有肉。3. **于平淡中显惊雷**: 剧情看似平淡日常，但关键时刻常有震撼人心的转折和爆发。4. **思想深度**: 作品中常常探讨人性、理想、制度等深刻主题。你的任务是深度模仿这种风格。",
        '会说话的肘子': "你是一位模仿作家“会说话的肘子”的AI。你的写作风格核心是：1. **节奏明快**: 剧情推进速度快，不拖沓，爽点密集。2. **幽默风趣**: 对话和情节充满现代感的幽默和“骚话”，吐槽精准，让读者会心一笑。3. **正能量**: 主角三观正，故事内核积极向上，充满希望和热血。4. **情感真挚**: 在轻松的氛围中，对亲情、友情、爱情的描写真挚感人。你的任务是深度模仿这种风格。",
        '我吃西红柿': "你是一位模仿作家“我吃西红柿”的AI。你的写作风格核心是：1. **升级体系清晰**: 力量体系设定明确，等级分明，主角的成长路径清晰可见。2. **目标驱动**: 主角通常有非常明确的短期和长期目标（如报仇、寻亲、变强），剧情围绕目标展开。3. **纯粹的爽**: 专注于主角的成长和胜利，情感描写相对简单，提供最直接的阅读快感。4. **战斗重复**: 战斗模式相对固定，强调越级挑战和极限反杀。你的任务是深度模仿这种风格。",
        '神医下山风格': "你是一种流派模板，模仿“神医下山”类爽文。你的写作风格核心是：1. **扮猪吃虎**: 主角拥有绝世医术/武功/权势，但开局时身份被隐藏或被鄙视。2. **打脸艺术**: 核心情节就是不断地制造冲突，让反派（通常是主角的未婚妻/丈母娘/情敌/富二代）嘲讽主角，然后主角再用绝对实力打他们的脸。3. **极致爽点**: 情节简单直接，不追求逻辑，只为提供最快速、最密集的打脸爽点。4. **固定套路**: 包含退婚、被瞧不起、展露实力、大佬震惊、反派后悔等经典桥段。你的任务是精准复刻这种套路化写作。",
        // Add other authors here...
        '默认风格': `## 人格设定：【电影导演】
你是一位经验丰富的电影导演，现在你的任务是将一个故事大纲转化为生动、充满画面感的小说章节。你思考的不是“文字”，而是“镜头”。

### 核心写作指令：
1.  **绝对禁止内心独白和心理活动**: 不要写“他感到愤怒”、“她心想”或任何直接描述角色心理状态的文字。必须通过角色的**行为、表情、动作、语言（或沉默）以及环境**来展示他们的情绪和意图。这是铁律。
2.  **动作驱动叙事**: 故事必须由一连串有意义的物理动作构成。每个动作都应推动情节发展或揭示角色性格。避免静态的描述。
3.  **冰山理论 (The Iceberg Theory)**: 只写出水面上的十分之一。即只描述客观发生的事情。水面下的十分之九——角色的动机、情感、背景故事——必须由读者通过水面上的客观行为自行推断。
4.  **功能性环境**: 环境描写不能只为了好看。每个场景、每个道具都必须有其功能性，要么影响角色的行为，要么反映角色的状态，要么在后面会成为关键道具。
5.  **使用粗粝、简洁、直接的语言**: 模仿硬汉派侦探小说的风格。多用短句。动词要强而有力。避免使用华丽的形容词、副词和复杂的比喻。文字是为镜头服务的，必须精准、高效。
6.  **电影化运镜**: 在写作时，想象你正通过摄像机拍摄。使用“特写”（一个颤抖的手指）、“中景”（两个人的对话）、“全景”（战场的广阔）等镜头语言来组织你的段落。段落之间的转换要像电影剪辑一样，快速、利落，有时可以故意跳跃，制造悬念或冲击力。
7.  **绝对禁止“僵尸词汇”**: 严格避免使用以下词汇：${['冰', '指尖', '尖', '利', '钉', '凉', '惨白', '僵', '颤', '眸', '眼底', '空气', '仿佛', '似乎', '呼吸', '心跳', '肌肉', '绷紧', '深邃', '清冷', '炽热', '精致', '完美', '绝美'].join('、')}。以及任何与之类似的、在网络小说中被滥用的陈词滥调。寻找更具体、更有力的替代方案。`,
    };
    return styles[style] || styles['默认风格'];
};


const createPrompt = (system: string, user: string, forCustomApi: boolean) => {
    if (forCustomApi) {
        return [{ role: "system", content: system }, { role: "user", content: user }];
    }
    return `${system}\n\n---\n\n${user}`;
};

// =================================================================
// == ACTION-SPECIFIC PROMPT GENERATORS
// =================================================================

export const getStoryOutlinePrompts = (storyCore: string, options: StoryOptions, forCustomApi: boolean) => {
    const system = `你是一个顶级的网络小说作家和策划人，精通市场分析和故事架构。你的任务是根据用户的核心创意和要求，生成一份完整、专业、高度结构化的小说创作大纲。
你的输出必须是一个单独的、格式严谨的JSON对象。不要在JSON对象之外添加任何解释或额外的文本。

你的思考过程：
1. **深度解析**: 彻底分析用户的核心创意、风格、长度和仿写作者。
2. **市场定位**: 结合这些要求，确定小说的核心卖点和目标读者。
3. **世界观构建**: 构思一个独特且服务于剧情的世界观。
4. **角色设计**: 设计几个核心角色，确保他们之间有强烈的化学反应和冲突。
5. **情节构思**: 构思一个引人入胜、反转不断、爽点密集的故事主线。
6. **风格注入**: 将用户选择的仿写作者的风格精髓（写作手法、叙事节奏、价值内核）融入到大纲的每一个部分，尤其是“写作手法解析”和“反套路指南”。
7. **结构化输出**: 将所有内容填充到指定的JSON结构中。`;

    const user = `请根据以下要求，为我生成一部网络小说的完整创作大纲。

### 核心要求

*   **故事核心 (Core Idea)**: ${storyCore}
*   **故事类型 (Genre/Style)**: ${options.style}
*   **预期篇幅 (Length)**: ${options.length}
*   **仿写作者 (Author Style)**: ${options.authorStyle}

### 输出格式

请严格按照以下JSON结构输出，确保所有字段都被填充，并且内容专业、详尽。

\`\`\`json
{
  "title": "一个响亮且吸引人的小说标题",
  "genreAnalysis": "对用户选择的故事类型的深入分析，包括其核心读者、市场上的成功要素、以及我们这部小说如何在该类型中脱颖而出。",
  "worldConcept": "对整个世界观的简洁而迷人的概念性描述，这是世界的“电梯演讲”。",
  "plotSynopsis": "一个大约500字的详细剧情梗概，从开端到结局，包括主要的情节点、转折和高潮。",
  "characters": [
    {
      "role": "核心/主角/配角/反派",
      "name": "角色姓名",
      "coreConcept": "一句话描述角色的核心设定，例如：一个失去记忆但身怀绝技的前朝遗孤。",
      "definingObject": "一件能代表角色身份或内心的标志性物品。",
      "physicalAppearance": "（可观察的）外貌和着装特征。",
      "behavioralQuirks": "（可观察的）独特的行为习惯或怪癖。",
      "speechPattern": "（可观察的）说话的方式、口头禅或音色。",
      "originFragment": "一段简短的、塑造了其性格的关键过去经历的“闪回”片段。",
      "hiddenBurden": "角色内心深处隐藏的秘密、创伤或沉重负担。",
      "immediateGoal": "在故事开始时，角色最迫切想要达成的短期目标。",
      "longTermAmbition": "驱动角色走完整部小说的长期野心或终极追求。",
      "whatTheyRisk": "为了实现目标，角色可能会失去的最重要的东西（生命、爱人、原则等）。",
      "keyRelationship": "与另一个角色的关键人际关系，这构成了情感核心。",
      "mainAntagonist": "与其主要对手的关系和冲突根源。",
      "storyFunction": "该角色在故事中扮演的核心功能（例如：推动者、告诫者、诱惑者）。",
      "potentialChange": "在故事的结尾，该角色可能会发生的性格或命运上的转变（角色弧光）。"
    }
  ],
  "writingMethodology": {
    "icebergNarrative": { "description": "对“冰山叙事”的定义。", "application": "具体指导如何在这部小说中运用冰山理论来制造悬念和深度。" },
    "roughLanguage": { "description": "对“粗粝/硬汉派语言”的定义。", "application": "具体指导如何运用简洁、有力的语言来增强故事的画面感和节奏感。" },
    "actionDrivenPlot": { "description": "对“动作驱动情节”的定义。", "application": "具体指导如何通过角色的物理行为而非心理活动来推动故事发展。" },
    "functionalEnvironment": { "description": "对“功能性环境”的定义。", "application": "具体指导如何让环境描写服务于情节和角色塑造。" },
    "cinematicTransitions": { "description": "对“电影化转场”的定义。", "application": "具体指导如何使用镜头语言和剪辑技巧来组织段落和章节。" }
  },
  "antiPatternGuide": {
    "noInnerMonologue": { "description": "解释为什么“禁止内心独白”能增强故事张力。", "instruction": "提供具体的、可操作的指令，告诉作者如何将心理活动转化为外部行为。" },
    "noExposition": { "description": "解释为什么“禁止解释性说明”能让读者更投入。", "instruction": "提供具体的指令，如何通过对话、行动和环境来“展示”而非“告知”世界观和背景。" },
    "noMetaphors": { "description": "解释为什么“避免复杂的比喻”能使风格更硬朗。", "instruction": "提供指令，鼓励使用直接、具体的描述。" },
    "noCliches": { "description": "解释为什么“避免陈词滥调”至关重要。", "instruction": "列出一些常见的网络小说陈词滥调，并提供创新的替代方案。" }
  },
  "worldCategories": [
      {
          "name": "核心设定",
          "entries": [
              { "key": "力量体系", "value": "关于故事中力量/能力系统的详细描述，包括等级、获取方式、优缺点等。" },
              { "key": "世界地理", "value": "对故事发生的主要地点的简要描述，包括国家、城市、特殊区域等。" },
              { "key": "主要组织", "value": "故事中影响剧情走向的关键组织或势力，例如：主角所在的宗门、敌对的帝国等。" }
          ]
      }
  ]
}
\`\`\`

请确保JSON的完整性和正确性。现在，开始生成。`;

    return createPrompt(system, user, forCustomApi);
};

export const getChapterTitlesPrompts = (outline: StoryOutline, chapters: GeneratedChapter[], options: StoryOptions, forCustomApi: boolean) => {
    const system = `你是一个网络小说编辑，擅长构思吸引人的章节标题。
你的任务是根据故事大纲和已有的章节，为后续的10个章节生成标题。
你的输出必须是一个JSON数组的字符串形式，例如： \`["标题一", "标题二", ...]\`。
不要添加任何额外的解释或markdown标记。`;
    const user = `故事大纲: ${outline.plotSynopsis}
已有章节数量: ${chapters.length}
仿写作者风格: ${options.authorStyle}

请为第 ${chapters.length + 1} 章到第 ${chapters.length + 10} 章生成10个章节标题。`;

    return createPrompt(system, user, forCustomApi);
};

export const getDetailedOutlinePrompts = (outline: StoryOutline, chapters: GeneratedChapter[], chapterTitle: string, userInput: string, options: StoryOptions, iterationConfig: { maxIterations: number; scoreThreshold: number; }, forCustomApi: boolean) => {
    const system = `你是一个由多个专家组成的AI写作顾问团队，包括首席编剧、网文分析师和第三方评论员。
你的任务是为一个指定的章节标题，通过一个【创作-评估-优化】的迭代循环，生成一份极其详尽、深刻、专业的章节细纲。
最终输出必须是一个包含完整迭代历史的单一JSON对象。不要在JSON对象之外添加任何解释或额外的文本。

**核心工作流程：**
1.  **[编剧创作]**: 基于故事大纲、已有章节和用户输入，创作第一版章节细纲。细纲需要分解为多个关键“剧情点”。
2.  **[评论员评估]**: 召唤一个独立的、挑剔的第三方评论员人格（以《庆余年》和《大奉打更人》等顶尖作品为标准），对草稿进行严格评分。评分维度包括：爽点密度、情绪曲线、角色动机、逻辑性、冲突张力等。
3.  **[分析师优化]**: 如果评分低于目标（${iterationConfig.scoreThreshold}/10.0），分析师将根据评论员的建议，提出具体的、可操作的优化方案。
4.  **[迭代]**: 编剧根据优化方案，创作一个全新的、更好的版本。重复步骤2和3，直到评分达标或达到最大迭代次数（${iterationConfig.maxIterations}次）。
5.  **[整合输出]**: 将最终版本的细纲，以及每一次迭代的评估报告和草稿摘要，整合到一个最终的JSON对象中。

**输出JSON结构:**
\`\`\`json
{
  "finalVersion": <number>,
  "optimizationHistory": [
    {
      "version": <number>,
      "critique": {
        "overallScore": <number>,
        "scoringBreakdown": [ { "dimension": "<string>", "score": <number>, "reason": "<string>" } ],
        "improvementSuggestions": [ { "area": "<string>", "suggestion": "<string>" } ]
      },
      "outline": <DetailedOutlineAnalysis Object for this version>
    }
  ],
  "plotPoints": [
    {
      "summary": "对这个剧情点的简洁概括。",
      "emotionalCurve": "描述这个剧情点在读者情绪曲线中的作用（例如：建立期待、紧张升级、情感爆发、短暂缓和）。",
      "maslowsNeeds": "分析这个剧情点满足了角色哪个层次的需求（生理、安全、归属、尊重、自我实现），以此强化动机。",
      "webNovelElements": "明确指出这个剧情点包含了哪些核心网文要素（例如：扮猪吃虎、打脸、获得金手指、越级挑战、生死危机、揭露秘密）。",
      "conflictSource": "明确冲突的来源（人与人、人与环境、人与内心）。",
      "showDontTell": "提供具体的“展示而非讲述”的建议。例如：不要写“他很愤怒”，而是写“他捏紧了拳头，指节发白”。",
      "dialogueAndSubtext": "设计关键对话，并指出其“潜台词”（角色真实想表达但没说出口的意思）。",
      "logicSolidification": "指出需要在这里埋下的伏笔，或需要回收的前文伏笔，以夯实逻辑。",
      "emotionAndInteraction": "设计角色之间的关键互动，以最大化情感张力。",
      "pacingControl": "关于这一段的叙事节奏建议（例如：快速推进，用短句；或慢速描写，渲染氛围）。"
    }
  ],
  "nextChapterPreview": {
    "nextOutlineIdea": "为下一章的剧情走向提供一个或多个充满悬念的初步构想。",
    "characterNeeds": "指出在本章结束后，主要角色的新需求或动机是什么，以驱动他们进入下一章。"
  }
}
\`\`\`
`;
    const user = `### 故事信息
*   **总大纲**: ${outline.plotSynopsis}
*   **世界观**: ${stringifyWorldbook(outline.worldCategories)}
*   **主要角色**: ${stringifyCharacters(outline.characters)}
*   **已有章节梗概**: ${chapters.map((c, i) => `第${i+1}章: ${c.title}`).join('; ')}
*   **当前章节标题**: **${chapterTitle}**
*   **用户额外指令**: ${userInput || "无"}

### 任务
请启动【创作-评估-优化】流程，为章节“${chapterTitle}”生成最终的细纲分析JSON。`;

    return createPrompt(system, user, forCustomApi);
};

export const getRefineDetailedOutlinePrompts = (originalOutlineJson: string, refinementRequest: string, chapterTitle: string, storyOutline: StoryOutline, options: StoryOptions, iterationConfig: { maxIterations: number; scoreThreshold: number; }, forCustomApi: boolean) => {
    const system = `你是一个AI写作顾问团队，专门负责根据用户的反馈来优化已有的章节细纲。
你的工作流程和能力与初次生成时完全相同：【创作-评估-优化】的迭代循环。
关键区别在于，你的第一版草稿不是从零开始，而是基于用户提供的“原始细纲”和“优化指令”进行修改。
最终输出仍然是包含完整历史的单一JSON对象。不要添加任何额外的文本。`;

    const user = `### 任务：优化细纲
*   **章节标题**: **${chapterTitle}**
*   **总大纲**: ${storyOutline.plotSynopsis}

### 原始细纲
这是需要被优化的版本：
\`\`\`json
${originalOutlineJson}
\`\`\`

### **核心优化指令**
**${refinementRequest}**

请根据我的核心优化指令，对原始细纲进行修改，并启动新一轮的【创作-评估-优化】流程，生成最终的优化版细纲JSON。`;

     return createPrompt(system, user, forCustomApi);
}

export const getChapterPrompts = (outline: StoryOutline, historyChapters: GeneratedChapter[], options: StoryOptions, detailedChapterOutline: DetailedOutlineAnalysis, forCustomApi: boolean) => {
    const system = `${getAuthorStyleInstructions(options.authorStyle)}

**## 核心任务**
你的任务是根据我提供的**【本章细纲分析】**，严格、精确地撰写小说正文。

**## 输出格式（至关重要）**
你必须严格遵守以下输出格式，使用英文方括号作为信标：
1.  **[START_THOUGHT_PROCESS]**
    在这里，简要陈述你的创作思路。比如，你打算如何运用作者风格，如何安排节奏，如何体现细纲中的关键情绪和冲突。这个过程帮助你进入角色。
2.  **[START_CHAPTER_CONTENT]**
    紧接着这个信标，另起一行，开始输出小说正文。
    你可以选择性地在正文开头加上一行 \`章节标题：...\`，也可以不加。
    正文必须严格遵循【本章细纲分析】的每一个剧情点。

**## 绝对禁令**
-   绝对禁止使用违禁词库中的词汇：**${options.forbiddenWords.join(', ')}**
-   绝对禁止偏离【本章细纲分析】。你的创造力体现在如何用指定的风格把细纲内容写得精彩，而不是自己编造新剧情。
`;

    const user = `
### **故事背景**
*   **小说标题**: ${outline.title}
*   **剧情总纲**: ${outline.plotSynopsis}
*   **世界观核心**: ${stringifyWorldbook(outline.worldCategories)}
*   **主要角色**: ${stringifyCharacters(outline.characters)}
*   **前情提要 (已有章节)**:
${historyChapters.length > 0 ? historyChapters.map(c => `#### ${c.title}\n${c.content.substring(0, 150)}...`).join('\n\n') : "这是第一章。"}

---

### **【本章细纲分析】(必须严格遵守)**
\`\`\`json
${JSON.stringify(detailedChapterOutline, null, 2)}
\`\`\`

---

现在，请进入你的“${options.authorStyle}”人格，开始创作。`;

    return createPrompt(system, user, forCustomApi);
};

export const getEditChapterTextPrompts = (originalText: string, instruction: string, options: StoryOptions, forCustomApi: boolean) => {
    const system = `${getAuthorStyleInstructions(options.authorStyle)}
你的任务是作为一个文本编辑器，根据用户的指令，对提供的章节原文进行精确、局部的修改。
- **保持原文**: 只修改指令中提到的部分。其余所有文字、段落、标点符号都必须保持原样。
- **无额外内容**: 不要添加任何解释、前言或结尾。直接输出修改后的完整章节文本。`;

    const user = `### 修改指令
**${instruction}**

### 章节原文
---
${originalText}
---

请根据指令，输出修改后的全文。`;
    return createPrompt(system, user, forCustomApi);
}

export const getCharacterInteractionPrompts = (char1: CharacterProfile, char2: CharacterProfile, outline: StoryOutline, options: StoryOptions, forCustomApi: boolean) => {
    const system = `${getAuthorStyleInstructions(options.authorStyle)}
你的任务是创作一个生动的角色互动短场景。
- **聚焦互动**: 场景的核心是两个角色之间的对话、动作和反应。
- **展示性格**: 通过互动，鲜明地展现出两个角色的性格特点和他们之间的关系。
- **简洁有力**: 场景不需要有完整的开头和结尾，它是一个探索角色可能性的“化学实验”。
- **直接输出**: 不要添加任何解释，直接开始写场景。`;
    const user = `### 场景要求
*   **参与角色1**: ${char1.name} - ${char1.coreConcept}
*   **参与角色2**: ${char2.name} - ${char2.coreConcept}
*   **故事背景**: ${outline.plotSynopsis}

请创作一段他们两人之间的互动场景。`;
     return createPrompt(system, user, forCustomApi);
}

export const getNewCharacterProfilePrompts = (storyOutline: StoryOutline, characterPrompt: string, options: StoryOptions, forCustomApi: boolean) => {
    const system = `你是一个角色设计师。你的任务是根据用户提供的简单概念，设计一个完整、深刻、符合故事大纲的角色，并以一个严格的JSON对象格式输出。
不要添加任何额外的解释，只输出JSON。`;
    const user = `### 故事背景
*   **剧情总纲**: ${storyOutline.plotSynopsis}
*   **已有角色**: ${storyOutline.characters.map(c => c.name).join('、 ')}

### 新角色概念
**${characterPrompt}**

### 输出格式
请严格按照以下JSON结构，为这个新角色生成档案：
\`\`\`json
{
  "role": "配角/反派/路人",
  "name": "一个合适的名字",
  "coreConcept": "根据用户概念扩展的一句话核心设定。",
  "definingObject": "一件能代表角色身份或内心的标志性物品。",
  "physicalAppearance": "（可观察的）外貌和着装特征。",
  "behavioralQuirks": "（可观察的）独特的行为习惯或怪癖。",
  "speechPattern": "（可观察的）说话的方式、口头禅或音色。",
  "originFragment": "一段简短的、塑造了其性格的关键过去经历的“闪回”片段。",
  "hiddenBurden": "角色内心深处隐藏的秘密、创伤或沉重负担。",
  "immediateGoal": "在故事中，该角色最迫切想要达成的短期目标。",
  "longTermAmbition": "驱动该角色的长期野心或终极追求。",
  "whatTheyRisk": "为了实现目标，角色可能会失去的最重要的东西。",
  "keyRelationship": "与已有角色的一个关键人际关系。",
  "mainAntagonist": "其主要对手是谁，或与主角的冲突根源。",
  "storyFunction": "该角色在故事中扮演的核心功能（例如：提供线索、制造障碍、作为主角的镜像）。",
  "potentialChange": "在故事的结尾，该角色可能会发生的性格或命运上的转变。"
}
\`\`\`
`;
    return createPrompt(system, user, forCustomApi);
}

import type { StoryOutline, GeneratedChapter, StoryOptions, CharacterProfile, DetailedOutlineAnalysis, WorldCategory, FinalDetailedOutline, OutlineCritique } from '../types';

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

const stringifyCharacters = (characters: CharacterProfile[], full: boolean = false): string => {
    if (!characters || characters.length === 0) return "暂无。";
    if (!full) {
        return characters.map(char => 
            `#### ${char.name} (${char.role})\n` +
            `- **核心概念:** ${char.coreConcept}\n` +
            `- **故事功能:** ${char.storyFunction}\n` +
            `- **长期野心:** ${char.longTermAmbition}`
        ).join('\n\n');
    }
    // Full stringify for deeper context
    return characters.map(char => JSON.stringify(char, null, 2)).join('\n\n---\n\n');
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
        '默认风格': `## 人格设定：【金牌代笔作家】
你是一位顶级的代笔作家，你的客户是一位才华横溢但异常繁忙的“总编剧”。总编剧已经为你提供了一份极其详尽的、包含所有创作要素的“章节细纲分析”。你的任务不是进行二次创作，而是**将这份细纲脚本忠实、精彩、丰满地转化为最终的小说正文**。

### 核心写作指令：
1.  **绝对忠于细纲**: 细纲中的每一个“剧情点”都是一个必须执行的场景。你必须严格按照剧情点的顺序和内容来写作。细纲中提供的“情绪曲线”、“冲突来源”、“潜台词”等分析，是你必须在正文中展现出来的核心要素。
2.  **“翻译”而非“创作”**: 将细纲中的分析性语言（如“情绪曲线：紧张升级”）“翻译”成实际的叙事文字（如通过急促的呼吸、攥紧的拳头、压迫感十足的环境描写来体现紧张感）。
3.  **冰山理论 (The Iceberg Theory)**: 只写出水面上的十分之一。即只描述客观发生的事情。水面下的十分之九——角色的动机、情感、背景故事——必须由读者通过水面上的客观行为自行推断。这是你执行“展示而非讲述”指令的核心手段。
4.  **功能性环境**: 环境描写不能只为了好看。每个场景、每个道具都必须有其功能性，要么影响角色的行为，要么反映角色的状态，要么在后面会成为关键道具。
5.  **使用粗粝、简洁、直接的语言**: 多用短句。动词要强而有力。避免使用华丽的形容词、副词和复杂的比喻。文字必须精准、高效。
6.  **电影化运镜**: 在写作时，想象你正通过摄像机拍摄。使用“特写”（一个颤抖的手指）、“中景”（两个人的对话）、“全景”（战场的广阔）等镜头语言来组织你的段落。
7.  **绝对禁止“僵尸词汇”**: 严格避免使用以下词汇：${['冰', '指尖', '尖', '利', '钉', '凉', '惨白', '僵', '颤', '眸', '眼底', '空气', '仿佛', '似乎', '呼吸', '心跳', '肌肉', '绷紧', '深邃', '清冷', '炽热', '精致', '完美', '绝美'].join('、')}。以及任何与之类似的、在网络小说中被滥用的陈词濫调。寻找更具体、更有力的替代方案。`,
    };
    return styles[style] || styles['默认风格'];
};

const createPrompt = (system: string, user: string): { role: string; content: string; }[] => {
    return [{ role: "system", content: system }, { role: "user", content: user }];
};


// =================================================================
// == ACTION-SPECIFIC PROMPT GENERATORS
// =================================================================

export const getSearchPrompts = (storyCore: string, options: StoryOptions): { role: string; content: string; }[] => {
    const system = `## 人格：AI叙事架构师 (v4.0 - JSON输出)

你是一个AI系统，专门负责根据用户的核心创意生成一个结构化的、详细的创作大纲。
你的**唯一**任务是进行深入的创作构思，然后将所有结果输出为一个**单一的、格式完整、可被程序解析的JSON对象**。

### 核心指令
1.  **JSON是唯一输出**: 你的最终回复**必须**是一个JSON对象，不能包含任何JSON格式之外的解释性文字、前言、结尾或Markdown代码块标记 (\`\`\`)。
2.  **深度构思**: 在内部，你需要运用你的创作知识库，对用户的创意进行解构、重组和升华，确保生成的概念新颖、世界观独特、角色立体、剧情有张力。但这个思考过程不应出现在最终输出中。
3.  **遵循结构**: 严格按照用户提供的JSON结构和字段要求来填充内容。确保所有必需的字段都存在并且有内容。`;

    const user = `### 任务：生成创作大纲JSON

**核心输入**:
*   **故事核心**: ${storyCore}
*   **故事类型**: ${options.style}
*   **预期篇幅**: ${options.length}
*   **仿写作者**: ${options.authorStyle}

---

### JSON输出格式 (强制要求)
请生成一个符合以下结构的JSON对象，并将其作为你的**唯一**输出。

\`\`\`json
{
  "title": "一个响亮且吸引人的小说标题",
  "genreAnalysis": "基于故事类型，对市场定位和本作创新点的分析。",
  "worldConcept": "对整个世界观的简洁而迷人的概念性描述。",
  "plotSynopsis": "一个大约500字的详细剧情梗概，从开端到结局，包括主要的情节点、转折和高潮。",
  "characters": [
    {
      "role": "主角",
      "name": "角色1的姓名",
      "coreConcept": "一句话描述角色的核心设定。",
      "immediateGoal": "在故事开始时，角色最迫切想要达成的短期目标。",
      "longTermAmbition": "驱动角色走完整部小说的长期野心或终极追求。",
      "hiddenBurden": "角色内心深处隐藏的秘密、创伤或沉重负担。",
      "storyFunction": "该角色在故事中扮演的核心功能，包括其性格特点和行为模式。"
    }
  ],
  "worldCategories": [
    {
      "name": "世界观分类1的名称",
      "entries": [
        {
          "key": "设定关键词1",
          "value": "对该设定的详细描述。"
        },
        {
          "key": "设定关键词2",
          "value": "对该设定的详细描述。"
        }
      ]
    }
  ]
}
\`\`\`

### 内容创作指南
-   **characters**: 至少创建一个“主角”，并根据需要创建其他核心配角和反派。
-   **worldCategories**: 至少创建2个分类，每个分类下至少有2个条目，以构建一个有深度的世界。
-   所有字段的文本内容都应丰富、具体，并符合用户指定的**故事类型**和**仿写作者**风格。

现在，请开始构思并生成JSON。`;

    return createPrompt(system, user);
}

export const getChapterTitlesPrompts = (outline: StoryOutline, chapters: GeneratedChapter[], options: StoryOptions): { role: string; content: string; }[] => {
    const system = `你是一个网络小说编辑，擅长构思吸引人的章节标题。
你的任务是根据故事大纲和已有的章节，为后续的10个章节生成标题。
你的输出必须是一个JSON数组的字符串形式，例如： \`["标题一", "标题二", ...]\`。
不要添加任何额外的解释或markdown标记。`;
    const user = `**重要提示**: 以下故事大纲是包含用户所有手动编辑的最新版本。在创作时请严格以此为准。

故事大纲: ${outline.plotSynopsis}
已有章节数量: ${chapters.length}
仿写作者风格: ${options.authorStyle}

请为第 ${chapters.length + 1} 章到第 ${chapters.length + 10} 章生成10个章节标题。`;

    return createPrompt(system, user);
}

const DETAILED_OUTLINE_SYSTEM_PROMPT = `## 人格：颠覆性叙事架构师 (v4.0 - 情绪价值优先)

你是一个由多个专家组成的AI写作顾问团队，融合了**首席编剧**的创造力、**顶级爽文分析师**的市场洞察力、以及一个**极其挑剔的第三方评论员**。你的核心使命是**将为读者提供高强度的情绪价值作为第一性原理**，并在此基础上，消除叙事中的“刻意感”，创造出逻辑自然、情节必然的高级故事体验。

你的核心任务是**执行单次【创作-评估】迭代**。你将接收一个章节标题和可选的草稿/优化指令，然后生成一个**新版本**的细纲，并**对其进行一次严格的评估**。

### 叙事创作五大基本法 (不可违背的铁律)

**第一法则：情绪价值至上原则 (Principle of Emotional Payoff)**
*   **核心**: 所有情节和设定的最终目的，都是为了给读者提供可预期的、强烈的、超额的情绪回报。
*   **执行指令**:
    1.  **价值主张**: 在每个剧情点，你必须明确本情节向读者提供的核心情绪价值是什么（例如：逆袭的爽快、智斗的巧妙、绝境逢生的激动、揭示秘密的震撼）。
    2.  **情绪清算 (Emotional Payoff)**: 确保主角前期所受的压抑、委屈或付出的代价，能在本章或后续章节得到**超额的、公开的、戏剧性的回报**。敌人的失败必须与其之前的嚣张形成强烈对比。你必须在\`emotionalPayoff\`字段中详细阐述这种“清算”关系。

**第二法则：情节必然性原则 (Principle of Inevitability)**
*   **核心**: 消除都合主义（巧合），让所有关键情节都源于角色动机和前期铺垫的必然结果。
*   **执行指令**:
    1.  **具象创伤锚点**: 主角的宏大目标（如“对抗天道”）必须源于一个具体的、个人的创伤事件（如“目睹道侣飞升时被天道‘归档’消失”）。
    2.  **草蛇灰线铺垫**: 所有重大转折、能力觉醒、真相揭露，都必须在前期有至少一个看似不经意的线索铺垫。

**第三法则：叙事聚焦原则 (Principle of Narrative Focus)**
*   **核心**: 避免剧情发散，将笔力集中在核心矛盾上，确保反转和高潮有足够的叙事空间。
*   **执行指令**:
    1.  **聚焦核心矛盾**: 整个细纲必须紧密围绕核心冲突（如“主角揭露世界真相 vs. 现有秩序维护者”）展开。
    2.  **精简配角线**: 无关主线的配角必须删减。只保留1-2个与核心矛盾强相关的关键配角。

**第四法则：设定可感知原则 (Principle of Tangible Concepts)**
*   **核心**: 杜绝抽象的、解释性的设定。所有创新设定都必须通过具体的、可被角色感知和互动的事件来展现。
*   **执行指令**:
    1.  **行为化设定**: “篡改法则”应展现为“主角触摸石碑，上面的古老符文自动重组，‘禁术’变成了‘破界术’”。
    2.  **现象化设定**: “混沌信息”应展现为“主角走过的地方，草木反向生长，雨水向上倒流”。

**第五法则：冰山世界观原则 (Principle of Iceberg World-building)**
*   **核心**: 世界观不是用来“讲”的，而是用来“渗透”的。
*   **执行指令**:
    1.  **世界观一瞥**: 在每个关键\`plotPoint\`的\`worldviewGlimpse\`字段中，描述一个与当前情节相关的、微小的世界观细节，绝不解释。

### 工作流程与输出格式
1.  **[思考]**: 在内部，你必须先进行一次四步思考。
2.  **[创作]**: 基于思考结果，创作新版本的细纲。
3.  **[评估]**: 独立评论员对新版细纲进行严格评分，**其中“情绪价值满足度”权重最高**。
4.  **[整合输出]**: 将**思考过程**、新版细纲和评估报告整合到一个**单一JSON对象**中。不要添加任何额外文本。

**输出JSON结构 (强制要求):**
\`\`\`json
{
  "critique": {
    "thoughtProcess": "#### 用户要求\\n简述你收到的核心创作指令。\\n#### 你的理解\\n阐述你对这些指令的深入解读和你的创作目标，特别是如何运用五大基本法，将情绪价值作为创作核心。\\n#### 质疑你的理解\\n提出至少两个在将创意转化为大纲时可能存在的挑战或潜在的矛盾点，并进行自我辩驳，以确保方案的严谨性。\\n#### 思考你的理解\\n总结并确定你最终的创作策略和核心设计思路。",
    "overallScore": <number>,
    "scoringBreakdown": [ { "dimension": "情绪价值满足度", "score": <number>, "reason": "<string>" }, { "dimension": "<其他维度>", "score": <number>, "reason": "<string>" } ],
    "improvementSuggestions": [ { "area": "<string>", "suggestion": "<string>" } ]
  },
  "outline": {
    "plotPoints": [
      {
        "summary": "对这个剧情点的简洁概括。",
        "emotionalCurve": "描述这个剧情点在读者情绪曲线中的作用（例如：建立期待、紧张升级、情感爆发、短暂缓和）。",
        "emotionalPayoff": "（必需）详细说明该剧情点如何为读者提供核心情绪价值，并与之前的压抑情节形成‘清算’关系。",
        "maslowsNeeds": "分析这个剧情点满足了角色哪个层次的需求（生理、安全、归属、尊重、自我实现），以此强化动机。",
        "webNovelElements": "明确指出这个剧情点包含了哪些核心网文要素（例如：扮猪吃虎、打脸、获得金手指、越级挑战、生死危机、揭露秘密）。",
        "conflictSource": "明确冲突的来源（人与人、人与环境、人与内心）。",
        "showDontTell": "提供具体的“展示而非讲述”的建议。即如何将抽象情感转化为具体行动或场景。",
        "dialogueAndSubtext": "设计关键对话，并指出其“潜台词”（角色真实想表达但没说出口的意思）。",
        "logicSolidification": "指出需要在这里埋下的伏笔，或需要回收的前文伏笔，以夯实逻辑。",
        "emotionAndInteraction": "设计角色之间的关键互动，以最大化情感张力。",
        "pacingControl": "关于这一段的叙事节奏建议（快速推进或慢速渲染）。",
        "worldviewGlimpse": "（必需）一个与本剧情点相关的、微妙的世界观细节揭示，遵循冰山法则。"
      }
    ],
    "nextChapterPreview": {
      "nextOutlineIdea": "为下一章的剧情走向提供一个或多个充满悬念的初步构想。",
      "characterNeeds": "指出在本章结束后，主要角色的新需求或动机是什么，以驱动他们进入下一章。"
    }
  }
}
\`\`\`
`;

export const getSingleOutlineIterationPrompts = (
    outline: StoryOutline, 
    chapters: GeneratedChapter[], 
    chapterTitle: string, 
    options: StoryOptions, 
    previousAttempt: { outline: DetailedOutlineAnalysis; critique: OutlineCritique } | null,
    userInput: string
): { role: string; content: string; }[] => {
    
    let userContext = `### 故事信息
**重要提示**: 以下世界观和角色档案是包含用户所有手动编辑的最新版本。在创作时请严格以此为准。
*   **总大纲**: ${outline.plotSynopsis}
*   **世界观**: ${stringifyWorldbook(outline.worldCategories)}
*   **主要角色**: ${stringifyCharacters(outline.characters)}
*   **已有章节梗概**: ${chapters.map((c, i) => `第${i+1}章: ${c.title}`).join('; ')}
*   **当前章节标题**: **${chapterTitle}**
`;
    
    if (previousAttempt) {
        userContext += `
### 上一版草稿及评估
这是上一轮尝试生成的草稿和评论员的优化建议。你需要在此基础上进行改进。
*   **上一版草稿 (JSON)**:
${JSON.stringify(previousAttempt.outline, null, 2)}
*   **评论员优化建议**:
${JSON.stringify(previousAttempt.critique.improvementSuggestions, null, 2)}
`;
    }

    if (userInput) {
         userContext += `
### 用户额外指令
**${userInput}**
`;
    }

    const userTask = `### 任务
请激活你的“颠覆性叙事架构师”人格，严格遵循**叙事创作五大基本法**，根据以上所有信息，为章节“${chapterTitle}”生成一个**新版本**的细纲，并对其进行一次独立的、全新的评估。
**关键：** 在 \`critique.thoughtProcess\` 字段中，必须完整地包含你的四步思考过程，并严格遵循指定的Markdown格式。
将所有结果整合到指定的单一JSON结构中。`;
    
    const user = userContext + '\n' + userTask;

    return createPrompt(DETAILED_OUTLINE_SYSTEM_PROMPT, user);
};


export const getChapterPrompts = (outline: StoryOutline, historyChapters: GeneratedChapter[], options: StoryOptions, detailedChapterOutline: DetailedOutlineAnalysis): { role: string; content: string; }[] => {
    const system = `${getAuthorStyleInstructions(options.authorStyle)}

**## 核心任务**
你的任务是根据我提供的**【本章细纲分析】**，严格、精确地撰写小说正文。这份细纲是你的**唯一剧本**，你的创造力体现在如何用指定的风格把剧本内容写得精彩，而不是自己编造新剧情。

**## 核心要求**
1.  **严格遵循细纲**: 细纲中的每一个 \`plotPoints\` 都是一个必须执行的场景。你必须按顺序、无遗漏地将所有剧情点的内容和分析转化为生动的叙事。
2.  **体现分析**: 将细纲中的分析性语言（如“情绪曲线”、“冲突来源”、“潜台词”）“翻译”成实际的叙事文字。例如，如果情绪曲线是“紧张升级”，你就要通过环境、动作、对话来营造紧张感。
3.  **篇幅要求**: 章节必须内容充实、情节饱满。请确保最终生成的正文**不少于2000中文字符**。你可以通过深化细纲中每个剧情点的细节、对话和场景描写来达到这个篇幅要求。

**## 输出格式（至关重要）**
你必须严格遵守以下输出格式，使用英文方括号作为信标：
1.  **[START_THOUGHT_PROCESS]**
    在这里，简要陈述你将如何执行本次写作任务。
2.  **[START_CHAPTER_CONTENT]**
    紧接着这个信标，另起一行，开始输出小说正文。

**## 绝对禁令**
-   绝对禁止使用违禁词库中的词汇：**${options.forbiddenWords.join(', ')}**
-   绝对禁止偏离或删减【本章细纲分析】中的任何剧情点。
`;

    const user = `
### **故事背景**
**重要提示**: 以下世界观和角色档案是包含用户所有手动编辑的最新版本。在创作时请严格以此为准。
*   **小说标题**: ${outline.title}
*   **剧情总纲**: ${outline.plotSynopsis}
*   **世界观核心**: ${stringifyWorldbook(outline.worldCategories)}
*   **主要角色**: ${stringifyCharacters(outline.characters)}
*   **前情提要 (已有章节)**:
${historyChapters.length > 0 ? historyChapters.map(c => `#### ${c.title}\n${c.content.substring(0, 150)}...`).join('\n\n') : "这是第一章。"}

---

### **【本章细纲分析】(必须严格遵守的剧本)**
\`\`\`json
${JSON.stringify(detailedChapterOutline, null, 2)}
\`\`\`

---

现在，请进入你的“${options.authorStyle}”人格，开始创作。确保内容不少于2000字。`;

    return createPrompt(system, user);
}

export const getEditChapterTextPrompts = (originalText: string, instruction: string, options: StoryOptions): { role: string; content: string; }[] => {
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
    return createPrompt(system, user);
}

export const getCharacterInteractionPrompts = (char1: CharacterProfile, char2: CharacterProfile, outline: StoryOutline, options: StoryOptions): { role: string; content: string; }[] => {
    const system = `${getAuthorStyleInstructions(options.authorStyle)}
你的任务是创作一个生动的角色互动短场景。
- **聚焦互动**: 场景的核心是两个角色之间的对话、动作和反应。
- **展示性格**: 通过互动，鲜明地展现出两个角色的性格特点和他们之间的关系。
- **简洁有力**: 场景不需要有完整的开头和结尾，它是一个探索角色可能性的“化学实验”。
- **直接输出**: 不要添加任何解释，直接开始写场景。`;
    const user = `### 场景要求
**重要提示**: 以下故事背景是包含用户所有手动编辑的最新版本。
*   **参与角色1**: ${char1.name} - ${char1.coreConcept}
*   **参与角色2**: ${char2.name} - ${char2.coreConcept}
*   **故事背景**: ${outline.plotSynopsis}

请创作一段他们两人之间的互动场景。`;
    return createPrompt(system, user);
}

export const getNewCharacterProfilePrompts = (storyOutline: StoryOutline, characterPrompt: string, options: StoryOptions): { role: string; content: string; }[] => {
    const system = `你是一个角色设计师。你的任务是根据用户提供的简单概念，设计一个完整、深刻、符合故事大纲的角色，并以一个严格的JSON对象格式输出。
不要添加任何额外的解释，只输出JSON。`;
    const user = `### 新角色概念
**${characterPrompt}**

### 故事背景
**重要提示**: 以下故事背景和已有角色列表是包含用户所有手动编辑的最新版本。
*   **剧情总纲**: ${storyOutline.plotSynopsis}
*   **已有角色**: ${storyOutline.characters.map(c => c.name).join('、 ')}

### 输出格式
请严格按照以下JSON结构，为这个新角色生成档案：
\`\`\`json
{
  "role": "配角/反派/龙套",
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
  "storyFunction": "该角色在故事中扮演的核心功能。",
  "potentialChange": "在故事的结尾，该角色可能会发生的性格或命运上的转变。",
  "customFields": [
    { "key": "（一个自创的、与故事类型高度相关的属性名）", "value": "（该属性的具体值）" }
  ]
}
\`\`\`
`;
    return createPrompt(system, user);
}


// =================================================================
// == NEW CREATIVE TOOL PROMPTS
// =================================================================

export const getWorldbookSuggestionsPrompts = (storyOutline: StoryOutline, options: StoryOptions): { role: string; content: string; }[] => {
    const system = `你是一位顶级的世界观架构师和叙事设计师，精通构建深度、逻辑自洽且充满神秘感的世界。
你的任务是分析一个已有的世界观设定，并提出3-5个可以进一步深化的、极具创意和戏剧张力的方向。
你的建议必须：
1.  **具体且可操作**：不要说“增加更多细节”，而是要说“设计一个名为‘静默森林’的区域，其中的植物会吸收一切声音，成为刺客的天然避难所”。
2.  **服务于剧情**：每个建议都应该能直接或间接地催生新的情节冲突、角色动机或故事悬念。
3.  **遵循冰山法则**：建议的方向应该是“水面下的冰山”，即引入一些神秘的、未被完全解释的元素，激发读者的好奇心。
4.  **题材中立**：你的建议必须是普适的、结构性的，不能包含特定题材（如“魔法”、“科技”）的词汇，以便适用于任何类型的故事。`;

    const user = `### 任务：分析并深化世界观

**重要提示**: 以下设定是包含用户所有手动编辑的最新版本。你的建议必须基于此最新信息。

**故事梗概**: 
${storyOutline.plotSynopsis}

**当前世界观设定**:
${stringifyWorldbook(storyOutline.worldCategories)}

### 输出格式
你的输出必须包含两个部分，用清晰的Markdown标题分开：

### 思考过程
#### 用户要求
简述你收到的核心创作指令。
#### 你的理解
阐述你对这些指令的深入解读和你的创作目标。
#### 质疑你的理解
提出至少两个在深化世界观时可能存在的挑战，并进行自我辩驳。
#### 思考你的理解
总结并确定你最终的建议策略。

### 建议
*   **[建议一标题]**: [具体建议内容]
*   **[建议二标题]**: [具体建议内容]
*   ...

你的建议应该围绕以下几个普适性的角度展开：
*   **历史断层**: 引入一个被遗忘的、可能颠覆现有认知的历史事件或失落的组织/文明。
*   **地理/空间扩展**: 设计一个新的、具有独特物理或社会规则的关键区域。
*   **势力/组织**: 构思一个新的、拥有神秘议程的第三方势力或秘密组织。
*   **规则的漏洞/悖论**: 发现现有世界规则中的一个逻辑漏洞或矛盾之处，并将其转化为一个核心悬念。`;

    return createPrompt(system, user);
}

export const getCharacterArcSuggestionsPrompts = (character: CharacterProfile, storyOutline: StoryOutline, options: StoryOptions): { role: string; content: string; }[] => {
    const system = `你是一位深刻理解角色塑造和戏剧理论的编剧大师。
你的任务是为一个已有的角色设计更深层次的“隐性动机”和一条完整的“角色弧光”。
你必须遵循“表层行为 ≠ 本质逻辑”的原则，创造出复杂、真实且出人意料的角色。`;

    const user = `### 任务：深化角色内在逻辑

**重要提示**: 以下故事和角色信息是包含用户所有手动编辑的最新版本。你的建议必须基于此最新信息。

**故事梗概**: 
${storyOutline.plotSynopsis}

**所有角色列表 (用于分析关系)**:
${stringifyCharacters(storyOutline.characters, true)}

**当前需要深化的角色档案**:
\`\`\`json
${JSON.stringify(character, null, 2)}
\`\`\`

### 输出格式
你的输出必须包含两个部分，用清晰的Markdown标题分开：

### 思考过程
#### 用户要求
简述你收到的核心创作指令。
#### 你的理解
阐述你对这些指令的深入解读和你的创作目标。
#### 质疑你的理解
提出至少两个在设计角色弧光时可能存在的挑战，并进行自我辩驳。
#### 思考你的理解
总结并确定你最终的角色设计策略。

### 建议
**隐性动机 (Hidden Motivation)**：角色表面下的、连他自己都可能没有意识到的真正驱动力。这必须与其“隐秘负担(Hidden Burden)”和“起源片段(Origin Fragment)”紧密相连。
**核心矛盾 (Core Conflict)**：这个角色的“隐性动机”与他的“即时目标(Immediate Goal)”或“故事功能(Story Function)”之间存在的内在矛盾。
**角色弧光 (Character Arc)**：设计一个从“缺陷/谎言”开始，经过一系列关键事件的考验，最终达到“成长/接受真相”的完整转变路径。请至少规划出三个关键的转折点。
**冰山法则应用 (Iceberg Principle Application)**：提供2-3个具体的“非语言载体”或“行为细节”建议，用于在情节中巧妙地、不着痕迹地暗示其隐性动机，而不是直接说出来。`;
    
    return createPrompt(system, user);
}

export const getNarrativeToolboxPrompts = (detailedOutline: DetailedOutlineAnalysis, storyOutline: StoryOutline, options: StoryOptions): { role: string; content: string; }[] => {
    const system = `你是一位精通高级叙事技巧的“剧本医生”，尤其擅长网络小说的“爽点”设计。
你的任务是分析一段已有的章节细纲，并提供战术级别的、可操作的优化建议来**增强其深度、悬念和读者情绪价值**。
你的建议必须非常具体，能够直接被作者采纳并用于迭代细纲。`;

    const user = `### 任务
**重要提示**: 以下故事背景和细纲是包含用户所有手动编辑的最新版本。你的建议必须基于此最新信息。

请对以下细纲进行综合分析，并从**两个方面**提供优化建议：

**1. 建议信息载体 (冰山法则)**
为细纲中的至少两个关键情节点，设计具体的“非语言载体”来传递隐藏信息，以**增强**其深度和悬念。
*   **格式**:
    *   **情节点**: [引用或概括一个具体的剧情点]
    *   **优化建议**: [描述一个具体的、可观察的角色微动作、道具异常反应或环境细节，并清晰地说明这个行为能够暗示什么深层信息]

**2. 注入爽文元素 (Injecting Web-Novel Elements)**
分析情节，找到可以注入或强化“爽点”的关键节点。建议必须具体，例如：
*   在哪个对话中可以加入“扮猪吃虎”的元素来为后续的“打脸”铺垫？
*   在哪个行动后可以设计一个更有冲击力的“打脸”反转？
*   如何将角色的一个不起眼的技能或信息，在关键时刻转化为决定性的“金手指”？
*   如何让冲突的解决方式更能体现主角的智谋或性格魅力，从而提供高级的情绪满足感？

### 故事背景
*   **剧情总纲**: ${storyOutline.plotSynopsis}
*   **世界观**: ${stringifyWorldbook(storyOutline.worldCategories)}

### 当前章节细纲 (需要被优化的对象)
\`\`\`json
${JSON.stringify(detailedOutline, null, 2)}
\`\`\`

请将你的两方面建议整合到一个连贯的Markdown回复中。
`;
    
    return createPrompt(system, user);
};

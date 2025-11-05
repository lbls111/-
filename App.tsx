import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GameState } from './types';
import type { StoryOutline, GeneratedChapter, StoryOptions, ThoughtStep, StoryLength, StoryModel, Citation, CharacterProfile, WritingMethodology, AntiPatternGuide, AuthorStyle, ActiveTab, WorldEntry, DetailedOutlineAnalysis, FinalDetailedOutline } from './types';
import { generateStoryOutlineStream, generateChapterStream, editChapterText, generateChapterTitlesStream } from './services/geminiService';

import SparklesIcon from './components/icons/SparklesIcon';
import LoadingSpinner from './components/icons/LoadingSpinner';
import SettingsIcon from './components/icons/SettingsIcon';
import SettingsModal from './components/SettingsModal';
import BookOpenIcon from './components/icons/BookOpenIcon';
import UsersIcon from './components/icons/UsersIcon';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import BrainCircuitIcon from './components/icons/BrainCircuitIcon';
import FilePenIcon from './components/icons/FilePenIcon';
import SearchIcon from './components/icons/SearchIcon';
import MagicWandIcon from './components/icons/MagicWandIcon';
import CharacterArchive from './components/CharacterArchive';
import RefreshCwIcon from './components/icons/RefreshCwIcon';
import DownloadIcon from './components/icons/DownloadIcon';
import OutlineGenerator from './components/OutlineGenerator';
import NotebookTextIcon from './components/icons/NotebookTextIcon';
import WorldbookEditor from './components/WorldbookEditor';
import UploadIcon from './components/icons/UploadIcon';


const storyStyles = {
    "爽文短篇 (Web Novel)": ["爽文 (重生复仇打脸)", "爽文 (都市兵王回归)", "爽文 (系统流金手指)", "爽文 (赘婿逆袭)", "爽文 (神医下山)"],
    "玄幻奇幻 (Fantasy/Xuanhuan)": ["玄幻 (修仙升级)", "玄幻 (异界穿越)", "玄幻 (上古神话)", "奇幻 (西式魔幻)", "奇幻 (东方仙侠)"],
    "科幻未来 (Sci-Fi)": ["科幻 (星际歌剧)", "科幻 (赛博朋克)", "科幻 (末日废土)", "科幻 (基因进化)", "科幻 (虚拟现实)"],
    "都市言情 (Urban Romance)": ["言情 (霸道总裁)", "言情 (青春校园)", "言情 (破镜重圆)", "言情 (职场恋爱)", "写实 (家庭伦理)"],
    "悬疑推理 (Mystery/Thriller)": ["悬疑 (刑侦探案)", "悬疑 (心理惊悚)", "悬疑 (恐怖灵异)", "推理 (本格推理)", "推理 (社会派)"],
    "日常故事 (Slice of Life)": ["日常 (趣味吐槽)", "日常 (温馨治愈)", "日常 (都市生活)"],
    "历史军事 (History/Military)": ["历史 (架空穿越)", "历史 (王朝争霸)", "军事 (现代战争)", "军事 (谍战特工)"],
};

const authorStyles: { name: AuthorStyle, description: string }[] = [
    { name: '默认风格', description: '采用通用的“电影导演”人格，注重画面感和节奏。' },
    { name: '爱潜水的乌贼', description: '代表作《诡秘之主》。氛围营造，侧面描写，设定严谨。' },
    { name: '辰东', description: '代表作《遮天》。宏大叙事，战斗场面壮阔，悬念（挖坑）大师。' },
    { name: '猫腻', description: '代表作《庆余年》。文笔细腻，角色立体，于平淡中显惊雷。' },
    { name: '会说话的肘子', description: '代表作《第一序列》。节奏明快，幽默风趣，爽点密集。' },
    { name: '我吃西红柿', description: '代表作《盘龙》。升级体系清晰，目标驱动，纯粹的爽文。' },
    { name: '方想', description: '代表作《师士传说》。设定新颖，战斗体系化，热血团队流。' },
    { name: '孑与2', description: '代表作《唐砖》。于嬉笑怒骂间描绘真实的历史画卷，注重逻辑和细节。' },
    { name: '卖报小郎君', description: '代表作《大奉打更人》。现代文风，对话风趣，擅长将悬疑与日常结合。' },
    { name: '宅猪', description: '代表作《牧神记》。世界观宏大，重构神话，古典热血。' },
    { name: '神医下山风格', description: '一种流派模板。精通“扮猪吃虎”与“打脸”的艺术，提供极致爽点。' },
    { name: '老鹰吃小鸡', description: '代表作《全球高武》。快节奏战斗，杀伐果断，力量体系数值化。' },
    { name: '言归正传', description: '代表作《我师兄实在太稳健了》。现代都市背景，轻松吐槽，风趣幽默。' },
    { name: '远瞳', description: '代表作《异常生物见闻录》。宏大世界观，日常与异常的交织，史诗感。' },
    { name: '方千金', description: '代表作《天才医生》。专业领域碾压，生理反应描写，快节奏打脸。' },
];

const DEFAULT_FORBIDDEN_WORDS = ['冰', '指尖', '尖', '利', '钉', '凉', '惨白', '僵', '颤', '眸', '眼底', '空气', '仿佛', '似乎', '呼吸', '心跳', '肌肉', '绷紧', '深邃', '清冷', '炽热', '精致', '完美', '绝美'];
const DEFAULT_WRITING_METHODOLOGY: WritingMethodology = {
    icebergNarrative: { description: '', application: '' },
    roughLanguage: { description: '', application: '' },
    actionDrivenPlot: { description: '', application: '' },
    functionalEnvironment: { description: '', application: '' },
    meaningfulAction: { description: '', application: '' },
    cinematicTransitions: { description: '', application: '' },
};
const DEFAULT_ANTI_PATTERN_GUIDE: AntiPatternGuide = {
    noInnerMonologue: { description: '', instruction: '' },
    noExposition: { description: '', instruction: '' },
    noMetaphors: { description: '', instruction: '' },
    noCliches: { description: '', instruction: '' },
};
const DEFAULT_STORY_OPTIONS: StoryOptions = {
    writingModel: 'gemini-2.5-pro',
    style: '爽文 (重生复仇打脸)',
    length: '短篇(15-30章)',
    authorStyle: '默认风格',
    temperature: 1.2,
    diversity: 2.0,
    topK: 512,
    forbiddenWords: DEFAULT_FORBIDDEN_WORDS,
};


const getInitialState = () => {
    try {
      const savedSession = localStorage.getItem('saved_story_session');
      if (savedSession) {
        const { storyOutline, chapters, storyOptions, storyCore, generatedTitles, outlineHistory } = JSON.parse(savedSession);
        
        // Data Migration: Handle old worldEntries format
        if (storyOutline && storyOutline.worldEntries && !storyOutline.worldCategories) {
            storyOutline.worldCategories = [{ name: "核心设定", entries: storyOutline.worldEntries }];
            delete storyOutline.worldEntries; // Remove old key
        }

        // If there's an outline but no chapters, we're likely in the outlining phase
        if (storyOutline && (!chapters || chapters.length === 0)) {
            return {
                initialGameState: GameState.PLANNING_COMPLETE,
                initialActiveTab: 'outline' as ActiveTab,
                initialStoryCore: storyCore || '',
                initialStoryOutline: storyOutline,
                initialChapters: [],
                initialStoryOptions: storyOptions || DEFAULT_STORY_OPTIONS,
                initialGeneratedTitles: generatedTitles || [],
                initialOutlineHistory: outlineHistory || {},
            };
        }
        
        // If there are chapters, we're in the writing phase
        if (chapters && chapters.length > 0 && storyOutline) {
          return {
            initialGameState: GameState.CHAPTER_COMPLETE,
            initialActiveTab: 'writing' as ActiveTab,
            initialStoryCore: storyCore || '',
            initialStoryOutline: storyOutline,
            initialChapters: chapters,
            initialStoryOptions: storyOptions || DEFAULT_STORY_OPTIONS,
            initialGeneratedTitles: generatedTitles || [],
            initialOutlineHistory: outlineHistory || {},
          };
        }
      }
    } catch (e) {
      console.error("加载已保存的会话失败:", e);
      localStorage.removeItem('saved_story_session'); // Clear corrupted data
    }
    // Default state
    return {
      initialGameState: GameState.INITIAL,
      initialActiveTab: 'agent' as ActiveTab,
      initialStoryCore: '',
      initialStoryOutline: null,
      initialChapters: [],
      initialStoryOptions: DEFAULT_STORY_OPTIONS,
      initialGeneratedTitles: [],
      initialOutlineHistory: {},
    };
};

const extractAndParseJson = <T,>(
    text: string,
    startTag: string,
    endTag: string,
    stepNameForError: string
): T => {
    if (typeof text !== 'string') {
        throw new Error(`在"${stepNameForError}"步骤中，用于解析的输入文本无效 (预期为字符串，但接收到 ${typeof text})。`);
    }

    const regex = new RegExp(`${startTag}([\\s\\S]*?)${endTag}`);
    const match = text.match(regex);
    
    let jsonString;

    if (match && match[1]) {
       jsonString = match[1].trim();
    } else {
        // If we can't find both start and end tags, we consider the data incomplete or malformed.
        // This will be caught by the caller. For intermittent checks during streaming,
        // this is expected and should not be treated as a fatal error.
        throw new Error(`在"${stepNameForError}"的输出中未能找到完整的数据块 (缺少起始或结束信标)。`);
    }
    
    // Clean potential markdown code blocks
    jsonString = jsonString.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

    try {
        return JSON.parse(jsonString) as T;
    } catch (e: any) {
        // This catch block now only triggers if the content BETWEEN valid start/end tags is malformed JSON.
        // This is a less common and more severe error, so logging it is appropriate.
        console.error(`从步骤 "${stepNameForError}" 解析JSON失败:`, jsonString);
        throw new Error(`解析来自"${stepNameForError}"的JSON数据时失败: ${e.message}`);
    }
};


const App: React.FC = () => {
    const { 
        initialGameState, 
        initialActiveTab,
        initialStoryCore,
        initialStoryOutline, 
        initialChapters, 
        initialStoryOptions,
        initialGeneratedTitles,
        initialOutlineHistory
    } = useMemo(() => getInitialState(), []);

    const [gameState, setGameState] = useState<GameState>(initialGameState);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [storyCore, setStoryCore] = useState<string>(initialStoryCore);
    const [storyOptions, setStoryOptions] = useState<StoryOptions>(initialStoryOptions);
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialActiveTab);

    const [storyOutline, setStoryOutline] = useState<StoryOutline | null>(initialStoryOutline);
    const [chapters, setChapters] = useState<GeneratedChapter[]>(initialChapters);
    const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    const [editInput, setEditInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // New state for outline generator
    const [generatedTitles, setGeneratedTitles] = useState<string[]>(initialGeneratedTitles);
    const [outlineHistory, setOutlineHistory] = useState<Record<string, string>>(initialOutlineHistory);
    
    // New state for plan refinement
    const [planRefinementInput, setPlanRefinementInput] = useState('');

    const workspaceRef = useRef<HTMLDivElement>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

    // Auto-saving logic
    useEffect(() => {
        if (gameState !== GameState.INITIAL && gameState !== GameState.PLANNING) {
            const sessionToSave = {
                storyOutline,
                chapters,
                storyOptions,
                storyCore,
                generatedTitles,
                outlineHistory
            };
            localStorage.setItem('saved_story_session', JSON.stringify(sessionToSave));
        }
    }, [storyOutline, chapters, storyOptions, gameState, storyCore, generatedTitles, outlineHistory]);


    const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
        setTimeout(() => {
            if (ref.current) {
                ref.current.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    };
     
    useEffect(() => {
        if(activeTab === 'writing') {
            scrollToBottom(workspaceRef);
        }
    }, [activeTab, chapters]);

    const updateStoryOutline = (updates: Partial<StoryOutline>) => {
        setStoryOutline(prev => {
            if (prev) {
                return { ...prev, ...updates };
            }
            return null;
        });
    };


    const handleError = (message: string, stepId?: number) => {
        setError(message);
        setGameState(GameState.ERROR);
        if (stepId !== undefined) {
            setThoughtSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'error' } : s));
        }
    };

    const handlePlanningSuccess = async (finalOutline: StoryOutline) => {
        setStoryOutline(finalOutline);
        setGameState(GameState.PLANNING_COMPLETE);
        setActiveTab('outline');
        
        try {
            const stream = await generateChapterTitlesStream(finalOutline, []);
            let fullText = '';
            for await (const chunk of stream) {
                fullText += chunk.text;
            }
            const titles = JSON.parse(fullText);
            setGeneratedTitles(titles);
        } catch(e: any) {
            handleError("自动生成初始章节标题失败: " + e.message, undefined);
        }
    };
    
    const startAgent = async (coreOverride?: string) => {
        const coreToUse = coreOverride || storyCore;
        if (!coreToUse.trim()) {
            setError("请输入故事核心。");
            return;
        }
        // If an override is used (from import or refinement), update the main state
        if (coreOverride && coreOverride !== storyCore) {
            setStoryCore(coreToUse);
        }
        
        setError(null);
        setChapters([]);
        setStoryOutline(null);
        setActiveTab('agent'); // This ensures the user sees the planning process
        setGeneratedTitles([]);
        setOutlineHistory({});
        
        const isRefinement = !!coreOverride && coreOverride !== storyCore;

        const initialSteps: ThoughtStep[] = [
            { 
                id: 0, 
                title: isRefinement ? "优化创作计划" : "第一步：生成完整创作计划",
                model: 'gemini-2.5-flash', 
                content: null, 
                status: 'pending', 
                citations: [] 
            },
        ];
        setThoughtSteps(initialSteps);
        setGameState(GameState.PLANNING); // This switches to the workspace view
        
        setTimeout(() => scrollToBottom(workspaceRef), 100);

        try {
            setThoughtSteps(prev => prev.map(s => s.id === 0 ? { ...s, status: 'running', content: '' } : s));
            const stream = await generateStoryOutlineStream(coreToUse, storyOptions);
            
            let thoughtText = "";
            const citationsMap = new Map<string, Citation>();
            
            for await (const chunk of stream) {
                thoughtText += chunk.text;
                const newCitations = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(c => c.web).filter(Boolean) as Citation[] | undefined;
                if(newCitations) {
                    newCitations.forEach(c => {
                        if (c.uri && !citationsMap.has(c.uri)) {
                            citationsMap.set(c.uri, c);
                        }
                    });
                }
                const citations = Array.from(citationsMap.values());
                setThoughtSteps(prev => prev.map(s => s.id === 0 ? { ...s, content: thoughtText, citations } : s));
            }
            
            setThoughtSteps(prev => prev.map(s => s.id === 0 ? { ...s, status: 'complete' } : s));
            
            try {
                const finalOutline = extractAndParseJson<StoryOutline>(
                    thoughtText, 
                    '\\[START_OUTLINE_JSON\\]', 
                    '\\[END_OUTLINE_JSON\\]', 
                    initialSteps[0].title
                );
                await handlePlanningSuccess(finalOutline);

            } catch (assemblyError: any) {
                 console.error("组装创作计划时出错:", assemblyError);
                 handleError(`组装创作计划失败: ${assemblyError.message}`, 0);
            }
        } catch (e: any) {
            console.error("AI代理规划流程失败。", e);
            if (e instanceof Error) handleError(e.message, 0);
        }
    };
    
    const handleRefinePlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!planRefinementInput.trim() || !storyCore) return;
        const newCore = `${storyCore}\n\n---\n**优化指令:**\n${planRefinementInput}`;
        setPlanRefinementInput('');
        startAgent(newCore);
    };

    const writeChapter = async (
        chapterTitle: string,
        detailedOutlineJson: string,
        explicitHistory?: GeneratedChapter[]
    ) => {
        if (!storyOutline) {
            handleError("无法写入章节，缺少创作计划。请返回重试。");
            return;
        }
        
        let detailedOutlineForChapter: DetailedOutlineAnalysis;
        try {
            const finalOutline = extractAndParseJson<FinalDetailedOutline>(
                detailedOutlineJson,
                '\\[START_DETAILED_OUTLINE_JSON\\]',
                '\\[END_DETAILED_OUTLINE_JSON\\]',
                'chapter writing'
            );
            // We only need the top-level analysis from the final version, not the history
            detailedOutlineForChapter = {
                plotPoints: finalOutline.plotPoints,
                nextChapterPreview: finalOutline.nextChapterPreview,
            };
        } catch (e) {
            handleError(`无法写入章节，细纲数据无效。请重新生成细纲。`);
            return;
        }

        const historyChapters = explicitHistory || chapters;
        
        setActiveTab('writing');
        setGameState(GameState.WRITING);
        setError(null);
        
        const newChapterId = (historyChapters[historyChapters.length - 1]?.id || 0) + 1;
        const newChapter: GeneratedChapter = {
            id: newChapterId,
            title: chapterTitle,
            content: '',
            preWritingThought: '',
            status: 'streaming',
        };
        setChapters([...historyChapters, newChapter]);
        scrollToBottom(workspaceRef);

        try {
            const stream = await generateChapterStream(storyOutline, historyChapters, storyOptions, detailedOutlineForChapter);
            let fullText = "";
            const thoughtStartMarker = '[START_THOUGHT_PROCESS]';
            const contentStartMarker = '[START_CHAPTER_CONTENT]';

            for await (const chunk of stream) {
                if (typeof chunk.text !== 'string') continue;
                fullText += chunk.text;

                let currentThought = "";
                let currentContent = "";
                
                const contentStartIndex = fullText.indexOf(contentStartMarker);
                
                if (contentStartIndex !== -1) {
                    // Content has started streaming
                    const thoughtEndIndex = contentStartIndex;
                    const thoughtStartIndex = fullText.indexOf(thoughtStartMarker);
                    currentThought = thoughtStartIndex !== -1 
                        ? fullText.substring(thoughtStartIndex + thoughtStartMarker.length, thoughtEndIndex).trim()
                        : '';
                    currentContent = fullText.substring(contentStartIndex + contentStartMarker.length).trimStart();
                } else {
                    // Still in thought process
                    const thoughtStartIndex = fullText.indexOf(thoughtStartMarker);
                     if (thoughtStartIndex !== -1) {
                        currentThought = fullText.substring(thoughtStartIndex + thoughtStartMarker.length).trim();
                    }
                }
                
                setChapters(prev => prev.map(c => 
                    c.id === newChapterId 
                        ? { ...c, content: currentContent, preWritingThought: currentThought } 
                        : c
                ));
            }
            
            // Final processing after stream ends
            let finalThought = "";
            let finalContent = "";
            let finalTitle = newChapter.title;

            const contentStartIndex = fullText.indexOf(contentStartMarker);
            const thoughtStartIndex = fullText.indexOf(thoughtStartMarker);
            
            if (contentStartIndex !== -1) {
                finalThought = thoughtStartIndex !== -1 
                    ? fullText.substring(thoughtStartIndex + thoughtStartMarker.length, contentStartIndex).trim()
                    : '';
                
                const contentAndTitleRaw = fullText.substring(contentStartIndex + contentStartMarker.length).trimStart();
                const titleRegex = /(?:章节标题：|Chapter Title:)\s*(.*)/;
                const titleMatch = contentAndTitleRaw.match(titleRegex);

                if (titleMatch) {
                    finalTitle = titleMatch[1] ? titleMatch[1].trim() : finalTitle;
                    finalContent = contentAndTitleRaw.substring(titleMatch.index! + titleMatch[0].length).trimStart();
                } else {
                    finalContent = contentAndTitleRaw; // Fallback if title prefix is missing
                }

                if (finalContent.trim() === "" && finalThought.trim() !== "") {
                     setError("错误: AI在完成思考过程后停止了，未能生成正文。请尝试【重新生成】。");
                     finalContent = ""; // Keep content empty on this specific error
                }

            } else if (thoughtStartIndex !== -1) {
                // Only thought process was generated
                finalThought = fullText.substring(thoughtStartIndex + thoughtStartMarker.length).trim();
                setError("错误: AI在完成思考过程后停止了，未能生成正文。请尝试【重新生成】。");
                finalContent = "";
            } else {
                // No markers found, treat the whole thing as content (should not happen with new prompt)
                finalContent = fullText;
            }


            setChapters(prev => prev.map(c => 
                c.id === newChapterId 
                    ? { ...c, title: finalTitle, content: finalContent, preWritingThought: finalThought, status: 'complete' } 
                    : c
            ));
            setGameState(GameState.CHAPTER_COMPLETE);

        } catch (e:any) {
            handleError(e.message || "章节生成过程中发生未知错误。", undefined);
            setChapters(historyChapters); // Revert to pre-writing state on error
        }
    };
    
    const regenerateLastChapter = () => {
        if(chapters.length === 0 || !storyOutline) return;
        
        const lastChapterIndex = chapters.length - 1;
        const targetTitle = generatedTitles[lastChapterIndex];
        const targetOutline = outlineHistory[targetTitle];

        if (!targetOutline) {
             handleError(`无法重新生成第 ${lastChapterIndex + 1} 章，缺少对应的细纲。请先在“细纲”模块中生成。`);
             return;
        }

        const historyChapters = chapters.slice(0, -1);
        writeChapter(targetTitle, targetOutline, historyChapters);
    }
    
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editInput.trim() || isEditing || chapters.length === 0) return;

        const lastChapter = chapters[chapters.length - 1];
        if(!lastChapter || lastChapter.status !== 'complete') return;
        
        setIsEditing(true);

        try {
            const response = await editChapterText(lastChapter.content, editInput, storyOptions);
            const newContent = response.text;
            setChapters(prev => prev.map(c => 
                c.id === lastChapter.id ? { ...c, content: newContent } : c
            ));
            setEditInput('');
        } catch (e: any) {
           setError(`文本修改失败: ${e.message}`);
        } finally {
            setIsEditing(false);
        }
    };

    const highlightText = (text: string) => {
        const parts = text.split(/(\【.*?】|\[START_OUTLINE_JSON\][\s\S]*?\[END_OUTLINE_JSON\])/g);
        return parts.map((part, index) => {
            if (part.startsWith('【') && part.endsWith('】')) {
                return <strong key={index} className="text-teal-400 block mt-3 mb-1">{part}</strong>;
            }
             if (part.startsWith('[START_')) {
                return <pre key={index} className="text-xs bg-slate-950/50 p-2 rounded-md mt-2 border border-slate-700 text-purple-300 overflow-x-auto"><code>{part}</code></pre>;
            }
            return part;
        });
    };
    
    const handleResetPlan = () => {
        if (window.confirm("确定要重置计划吗？这将清除当前生成的所有内容（大纲、角色、章节），但保留您的核心创意和设置。")) {
            // Only clear generated content
            setStoryOutline(null);
            setChapters([]);
            setGeneratedTitles([]);
            setOutlineHistory({});
            setThoughtSteps([]);
            setError(null);
            setGameState(GameState.PLANNING_COMPLETE);
            setActiveTab('agent');
            // Keep storyCore and storyOptions
            // Trigger a re-plan
            startAgent();
        }
    };

    const handleNewProject = () => {
        if (window.confirm("确定要开始一个新项目吗？所有未导出的内容都将丢失。")) {
            localStorage.removeItem('saved_story_session');
            setGameState(GameState.INITIAL); 
            setError(null);
            setStoryOutline(null);
            setChapters([]);
            setGeneratedTitles([]);
            setOutlineHistory({});
            setThoughtSteps([]);
            setStoryCore('');
            setStoryOptions(DEFAULT_STORY_OPTIONS);
        }
    };

    const handleExport = async () => {
        if (gameState === GameState.INITIAL && !storyCore && !storyOutline) {
            setError("没有可导出的内容。请输入核心创意或生成计划后再试。");
            return;
        }

        const exportData = {
            storyOutline,
            chapters,
            storyOptions,
            storyCore,
            generatedTitles,
            outlineHistory,
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const safeTitle = (storyOutline?.title || 'story-export').replace(/[^a-z0-9-_\u4E00-\u9FA5]/gi, '_');
        const fileName = `${safeTitle}.json`;

        // Use the modern File System Access API if available for a better user experience
        if ('showSaveFilePicker' in window) {
            try {
                // `window.showSaveFilePicker` is not in the default TS DOM lib yet
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'JSON Story File',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                return; // Early return on success
            } catch (err: any) {
                // AbortError is expected if the user cancels the save dialog.
                if (err.name !== 'AbortError') {
                    console.error("文件系统访问API错误:", err);
                    // Fall through to legacy method on other errors
                } else {
                    return; // User cancelled, do nothing.
                }
            }
        }

        // Fallback for browsers that don't support the API
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("文件读取失败。");
                
                const data = JSON.parse(text);
                if (typeof data !== 'object' || data === null) throw new Error("文件内容不是有效的JSON对象。");

                let storyOutlineToLoad: StoryOutline | null = null;
                let chaptersToLoad: GeneratedChapter[] = [];
                let optionsToLoad: StoryOptions = { ...DEFAULT_STORY_OPTIONS, ...(data.storyOptions || {}) };
                let coreToLoad: string = data.storyCore || '';
                let titlesToLoad: string[] = data.generatedTitles || [];
                let historyToLoad: Record<string, string> = data.outlineHistory || {};
                
                // Case 1: Full project file with storyOutline
                if (data.storyOutline && typeof data.storyOutline === 'object') {
                    storyOutlineToLoad = {
                         // Provide defaults for all fields to ensure type safety
                        title: '无标题',
                        genreAnalysis: '',
                        worldConcept: '',
                        plotSynopsis: '',
                        characters: [],
                        writingMethodology: DEFAULT_WRITING_METHODOLOGY,
                        antiPatternGuide: DEFAULT_ANTI_PATTERN_GUIDE,
                        worldCategories: [],
                        ...data.storyOutline
                    };
                    chaptersToLoad = data.chapters || [];
                    if (!coreToLoad) {
                       coreToLoad = storyOutlineToLoad?.plotSynopsis || '';
                    }
                } 
                // Case 2: Arbitrary JSON as creative seed
                else {
                    const creativeSeed = JSON.stringify(data, null, 2);
                    coreToLoad = creativeSeed;
                    // We start a new project based on this seed
                    storyOutlineToLoad = null; 
                    chaptersToLoad = [];
                    titlesToLoad = [];
                    historyToLoad = {};
                }

                setStoryOutline(storyOutlineToLoad);
                setChapters(chaptersToLoad);
                setStoryOptions(optionsToLoad);
                setStoryCore(coreToLoad);
                setGeneratedTitles(titlesToLoad);
                setOutlineHistory(historyToLoad);
                setError(null);

                if (storyOutlineToLoad) {
                    // If we have a full outline, go to the workspace
                    if (chaptersToLoad.length > 0) {
                        setGameState(GameState.CHAPTER_COMPLETE);
                        setActiveTab('writing');
                    } else {
                        setGameState(GameState.PLANNING_COMPLETE);
                        setActiveTab('outline');
                    }
                } else {
                    // If it was a creative seed, start the agent automatically
                    setGameState(GameState.INITIAL); // Go to initial to show loading state on button
                    startAgent(coreToLoad);
                }


            } catch (err: any) {
                handleError(`导入失败: ${err.message}`);
                setGameState(GameState.INITIAL);
            }
        };
        reader.onerror = () => {
            handleError("读取文件时出错。");
            setGameState(GameState.INITIAL);
        };
        reader.readAsText(file);
        
        if (event.target) {
            event.target.value = '';
        }
    };
    
    const renderInitialView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <div className="absolute top-4 right-4 flex gap-x-2">
                 <button onClick={handleImportClick} className="p-2 rounded-full glass-card glass-interactive transition-all duration-300" title="导入故事">
                    <UploadIcon className="w-6 h-6 text-slate-300"/>
                 </button>
                 <button onClick={handleExport} className="p-2 rounded-full glass-card glass-interactive transition-all duration-300" title="导出故事">
                    <DownloadIcon className="w-6 h-6 text-slate-300"/>
                 </button>
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full glass-card glass-interactive transition-all duration-300" title="设置">
                    <SettingsIcon className="w-6 h-6 text-slate-300"/>
                 </button>
             </div>
             <div className="w-full max-w-3xl p-8 glass-card rounded-2xl shadow-2xl">
                <BrainCircuitIcon className="w-16 h-16 mx-auto text-teal-400 mb-4" />
                <h1 className="text-4xl font-bold text-slate-100 mb-2">AI小说创作代理</h1>
                <p className="text-slate-400 mb-8">输入核心创意。AI将自主研究、构思、决策并创作一部属于你的小说。</p>
                <textarea
                    className="w-full h-28 p-4 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="例如：一个底层程序员意外发现，他写的代码注释能够影响现实世界..."
                    value={storyCore}
                    onChange={(e) => setStoryCore(e.target.value)}
                    aria-label="Story Core Idea"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <select value={storyOptions.style} onChange={e => setStoryOptions(o => ({...o, style: e.target.value}))} className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500">
                        {Object.entries(storyStyles).map(([group, options]) => (
                            <optgroup label={group} key={group}>
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </optgroup>
                        ))}
                    </select>
                     <select value={storyOptions.length} onChange={e => setStoryOptions(o => ({...o, length: e.target.value as StoryLength}))} className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500">
                         <option value="超短篇(5-10章)">超短篇(5-10章)</option>
                         <option value="短篇(15-30章)">短篇(15-30章)</option>
                         <option value="中篇(30-100章)">中篇(30-100章)</option>
                         <option value="长篇(100章以上)">长篇(100章以上)</option>
                    </select>
                    <select title={authorStyles.find(a => a.name === storyOptions.authorStyle)?.description} value={storyOptions.authorStyle} onChange={e => setStoryOptions(o => ({...o, authorStyle: e.target.value as AuthorStyle}))} className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500">
                         {authorStyles.map(author => (
                            <option key={author.name} value={author.name} title={author.description}>{author.name}</option>
                         ))}
                    </select>
                </div>
                <button
                    className="mt-6 w-full flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                    onClick={() => startAgent()}
                    disabled={!storyCore.trim() || gameState === GameState.PLANNING}
                >
                   {gameState === GameState.PLANNING ? <LoadingSpinner className="w-6 h-6 mr-2"/> : <SparklesIcon className="w-6 h-6 mr-2" />}
                   {gameState === GameState.PLANNING ? '正在运行...' : '启动AI代理'}
                </button>
                {error && <p className="mt-4 text-red-400">{error}</p>}
            </div>
        </div>
    );
    
    const renderAgentWorkspace = () => {
        const nextChapterIndex = chapters.length;
        const nextChapterTitle = generatedTitles[nextChapterIndex];

        const isNextChapterOutlined = nextChapterTitle && outlineHistory[nextChapterTitle] && (() => {
            try {
                extractAndParseJson<FinalDetailedOutline>(
                    outlineHistory[nextChapterTitle],
                    '\\[START_DETAILED_OUTLINE_JSON\\]',
                    '\\[END_DETAILED_OUTLINE_JSON\\]',
                    'outline button check'
                );
                return true;
            } catch {
                // Any parsing failure (including missing tags during stream) means it's not ready.
                return false;
            }
        })();
        
        const isWriteButtonDisabled = gameState === GameState.WRITING || !isNextChapterOutlined;
        let writeButtonTooltip = isWriteButtonDisabled ? `请先在“细纲”模块为第 ${nextChapterIndex + 1} 章生成细纲分析。` : '';
        if (gameState === GameState.WRITING) writeButtonTooltip = "正在创作中...";

        const TabButton: React.FC<{targetTab: ActiveTab; icon: React.ReactNode; label: string;}> = ({ targetTab, icon, label }) => (
             <button
                onClick={() => setActiveTab(targetTab)}
                disabled={!storyOutline}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-semibold border-b-2 transition-all duration-200 disabled:cursor-not-allowed disabled:text-slate-600 ${
                activeTab === targetTab
                    ? 'border-teal-400 text-teal-300'
                    : 'border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
            >
                {icon}
                <span>{label}</span>
            </button>
        );

        return (
            <div className="h-screen flex flex-col">
                <header className="flex-shrink-0 bg-slate-900/50 backdrop-blur-lg border-b border-white/10 z-20 p-2 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <button 
                                onClick={handleNewProject}
                                className="px-4 py-2 rounded-md font-semibold transition bg-slate-700 text-white hover:bg-slate-600 text-sm"
                            >
                                新项目
                        </button>
                        <h1 className="text-lg font-bold text-slate-200 truncate" title={storyOutline?.title || "AI小说创作代理"}>
                            {storyOutline?.title || "AI小说创作代理"}
                        </h1>
                     </div>
                     <div className="flex items-center space-x-2">
                        <button 
                            onClick={handleResetPlan}
                            className="px-4 py-2 rounded-md font-semibold transition bg-amber-600 text-white hover:bg-amber-500 text-sm"
                        >
                            重置计划
                        </button>
                         <button onClick={handleImportClick} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors" title="导入故事">
                            <UploadIcon className="w-6 h-6 text-slate-300"/>
                         </button>
                         <button onClick={handleExport} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors" title="导出故事">
                            <DownloadIcon className="w-6 h-6 text-slate-300"/>
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors" title="设置">
                            <SettingsIcon className="w-6 h-6 text-slate-300"/>
                        </button>
                     </div>
                </header>

                <div className="flex-shrink-0 border-b border-white/10 bg-slate-950/70 z-10">
                    <nav className="flex space-x-1 px-2">
                        <TabButton targetTab="agent" icon={<BrainCircuitIcon className="w-4 h-4"/>} label="AI思考过程"/>
                        <TabButton targetTab="worldbook" icon={<BookOpenIcon className="w-4 h-4"/>} label="世界书"/>
                        <TabButton targetTab="characters" icon={<UsersIcon className="w-4 h-4"/>} label="角色档案"/>
                        <TabButton targetTab="outline" icon={<NotebookTextIcon className="w-4 h-4"/>} label="细纲"/>
                        <TabButton targetTab="writing" icon={<FilePenIcon className="w-4 h-4"/>} label="创作正文"/>
                    </nav>
                </div>

                <main ref={workspaceRef} className="flex-grow overflow-y-auto bg-slate-900/30">
                    <div className="p-4 md:p-6">
                        {activeTab === 'agent' && (
                             <div className="space-y-4">
                                {thoughtSteps.map(step => (
                                    <details key={step.id} data-step-id={step.id} className="glass-card rounded-lg" open={step.status === 'running' || step.status === 'error' || step.status === 'complete'}>
                                        <summary className="p-3 cursor-pointer flex items-center justify-between font-semibold text-slate-200">
                                            <div className="flex items-center">
                                                {step.status === 'running' && <LoadingSpinner className="w-5 h-5 mr-3 text-teal-400" />}
                                                {step.status === 'complete' && <CheckCircleIcon className="w-5 h-5 mr-3 text-green-400" />}
                                                {step.status === 'error' && <CheckCircleIcon className="w-5 h-5 mr-3 text-red-400" />}
                                                {step.status === 'pending' && <div className="w-5 h-5 mr-3 flex items-center justify-center"><div className="w-2.5 h-2.5 border-2 border-slate-600 rounded-full"/></div>}
                                                {step.title}
                                            </div>
                                            <span className="text-xs font-mono bg-slate-700/50 text-sky-300 px-2 py-1 rounded">{step.model}</span>
                                        </summary>
                                        {step.content !== null && (
                                            <div className="p-4 border-t border-white/10 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                                {highlightText(step.content)}
                                                {step.status === 'running' && <span className="inline-block w-2 h-4 bg-slate-300 animate-pulse ml-1" />}
                                                {step.citations && step.citations.length > 0 && (
                                                    <div className="mt-4 pt-3 border-t border-white/10">
                                                        <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center"><SearchIcon className="w-4 h-4 mr-2"/>参考文献</h4>
                                                        <ul className="space-y-1.5">{step.citations.map((c, i) => <li key={i}><a href={c.uri} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline text-xs">{c.title || c.uri}</a></li>)}</ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </details>
                                ))}
                                {gameState >= GameState.PLANNING_COMPLETE && storyOutline && (
                                    <div className="mt-6 pt-6 border-t border-white/10">
                                        <div className="glass-card p-4 rounded-lg">
                                            <h3 className="text-lg font-semibold text-slate-200 mb-3">优化创作计划</h3>
                                            <form onSubmit={handleRefinePlan} className="space-y-3">
                                                <textarea
                                                    value={planRefinementInput}
                                                    onChange={e => setPlanRefinementInput(e.target.value)}
                                                    placeholder="输入优化指令，例如：让世界观更黑暗，增加一个敌对组织..."
                                                    rows={4}
                                                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 transition resize-y"
                                                    disabled={gameState === GameState.PLANNING}
                                                />
                                                <button type="submit" className="w-full flex items-center justify-center px-8 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed" disabled={gameState === GameState.PLANNING || !planRefinementInput.trim()}>
                                                    {gameState === GameState.PLANNING ? <LoadingSpinner className="w-6 h-6 mr-2"/> : <RefreshCwIcon className="w-6 h-6 mr-2" />}
                                                    {gameState === GameState.PLANNING ? '正在运行...' : '重新生成计划'}
                                                </button>
                                            </form>
                                            <p className="text-xs text-slate-500 mt-2">
                                                AI将基于你最初的核心创意和新的优化指令，重新生成一份完整的创作计划。
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'worldbook' && storyOutline && (
                           <WorldbookEditor 
                                storyOutline={storyOutline}
                                onUpdate={updateStoryOutline}
                           />
                        )}
                        {activeTab === 'characters' && storyOutline && (
                            <CharacterArchive 
                                storyOutline={storyOutline}
                                onUpdate={updateStoryOutline}
                                storyOptions={storyOptions}
                             />
                        )}
                        {activeTab === 'outline' && storyOutline && (
                             <OutlineGenerator
                                storyOutline={storyOutline}
                                chapters={chapters}
                                generatedTitles={generatedTitles}
                                setGeneratedTitles={setGeneratedTitles}
                                outlineHistory={outlineHistory}
                                setOutlineHistory={setOutlineHistory}
                                storyOptions={storyOptions}
                             />
                        )}
                        {activeTab === 'writing' && (
                             <div className="space-y-6">
                                {chapters.length > 0 ? (
                                    <div className="glass-card p-6 rounded-lg space-y-6">
                                        <h2 className="text-xl font-bold text-slate-100 flex items-center justify-between">
                                            <span className="flex items-center"><FilePenIcon className="w-5 h-5 mr-2" />创作正文</span>
                                            <div className='flex items-center gap-x-2'>
                                                <span className="text-xs font-mono bg-slate-700/50 text-purple-300 px-2 py-1 rounded">{storyOptions.authorStyle}</span>
                                                <span className="text-xs font-mono bg-slate-700/50 text-amber-300 px-2 py-1 rounded">{storyOptions.writingModel}</span>
                                            </div>
                                        </h2>
                                        {chapters.map(chapter => (
                                            <div key={chapter.id} className="border-t border-white/10 pt-6">
                                                <h3 className="text-xl font-bold text-teal-300 mb-4 flex items-center">
                                                    {chapter.title}
                                                </h3>

                                                {chapter.preWritingThought && (
                                                    <details className="mb-4 group" open={chapter.status !== 'complete'}>
                                                        <summary className="cursor-pointer list-none flex items-center text-sm font-bold text-indigo-300 p-2 rounded-lg hover:bg-indigo-950/40 transition-colors">
                                                            <BrainCircuitIcon className="w-4 h-4 mr-2" />
                                                            创作前整合思考
                                                            <span className="ml-2 text-indigo-400/70 transform transition-transform group-open:rotate-90">&#9654;</span>
                                                        </summary>
                                                        <div className="mt-2 pl-6">
                                                            <div className="p-4 border border-indigo-500/30 bg-indigo-950/20 rounded-lg">
                                                                <div className="text-sm text-slate-400 whitespace-pre-wrap prose prose-invert prose-sm prose-p:my-1">
                                                                {chapter.preWritingThought}
                                                                {chapter.status === 'streaming' && !chapter.content && <span className="inline-block w-2 h-3 bg-slate-300 animate-pulse ml-1" />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </details>
                                                )}

                                                <div className="text-slate-300 whitespace-pre-wrap font-serif leading-relaxed text-base prose prose-invert prose-p:mb-4">
                                                    {chapter.content || (chapter.status !== 'complete' && '...')}
                                                    {chapter.status === 'streaming' && chapter.content && <span className="inline-block w-2 h-4 bg-slate-300 animate-pulse ml-1" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-slate-500">
                                        <p>请先在“细纲”模块为第一章生成细纲分析，然后回到此处开始写作。</p>
                                    </div>
                                )}
                                
                                {gameState !== GameState.WRITING && gameState !== GameState.PLANNING && (
                                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                                        {chapters.length > 0 && (
                                            <button 
                                                onClick={regenerateLastChapter} 
                                                className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-transform transform hover:scale-105 shadow-lg"
                                                disabled={gameState === GameState.WRITING}
                                            >
                                                <RefreshCwIcon className="w-6 h-6 mr-2" />重新生成
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => writeChapter(nextChapterTitle, outlineHistory[nextChapterTitle])} 
                                            disabled={isWriteButtonDisabled}
                                            title={writeButtonTooltip}
                                            className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            <SparklesIcon className="w-6 h-6 mr-2" />
                                            {chapters.length > 0 ? `撰写第 ${chapters.length + 1} 章` : '撰写第一章'}
                                        </button>
                                    </div>
                                )}

                                {gameState === GameState.WRITING && (
                                    <div className="text-center p-4 text-slate-400 flex items-center justify-center">
                                        <LoadingSpinner className="mr-2"/>
                                        {chapters.length > 0 && !chapters[chapters.length-1].content 
                                            ? "正在整合思考创作计划..."
                                            : "正在创作中..."
                                        }
                                    </div>
                                )}

                                {chapters.length > 0 && chapters[chapters.length-1].status === 'complete' && (
                                    <div className="mt-6 glass-card p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-slate-200 mb-3">文本微调 (局部改写)</h3>
                                        <form onSubmit={handleEditSubmit} className="flex items-center gap-2">
                                            <input 
                                                type="text"
                                                value={editInput}
                                                onChange={e => setEditInput(e.target.value)}
                                                placeholder="输入修改指令，例如：优化第一段那个比喻..."
                                                className="flex-grow p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 transition"
                                                disabled={isEditing}
                                            />
                                            <button type="submit" className="p-3 rounded-lg bg-sky-600 hover:bg-sky-500 transition disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center" disabled={isEditing || !editInput.trim()}>
                                                {isEditing ? <LoadingSpinner className="w-6 h-6 text-white" /> : <MagicWandIcon className="w-6 h-6 text-white"/>}
                                            </button>
                                        </form>
                                         <p className="text-xs text-slate-500 mt-2">
                                            对最新章节的文本进行精确修改。AI将只重写您指定的部分，并保持其余内容不变。
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-400 font-semibold">发生错误</p>

                                <p className="text-red-400 text-sm mt-1">{error}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }


    return (
        <div className="w-full h-screen bg-slate-950">
            <input 
                type="file" 
                ref={importFileRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImport}
            />
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                options={storyOptions}
                setOptions={setStoryOptions}
            />
            {gameState === GameState.INITIAL || (gameState === GameState.ERROR && !storyOutline) ? renderInitialView() : renderAgentWorkspace()}
        </div>
    );
};

export default App;
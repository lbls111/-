import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { GameState } from './types';
import type { StoryOutline, GeneratedChapter, StoryOptions, ThoughtStep, NextPlotChoice, StoryLength, StoryModel, Citation, CharacterProfile, WritingMethodology, AntiPatternGuide, AuthorStyle, ActiveTab } from './types';
import { runThinkingStepStream, generateNextPlotChoices, generateChapterStream, editChapterText } from './services/geminiService';

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


const storyStyles = {
    "爽文短篇 (Web Novel)": ["爽文 (重生复仇打脸)", "爽文 (都市兵王回归)", "爽文 (系统流金手指)", "爽文 (赘婿逆袭)", "爽文 (神医下山)"],
    "玄幻奇幻 (Fantasy/Xuanhuan)": ["玄幻 (修仙升级)", "玄幻 (异界穿越)", "玄幻 (上古神话)", "奇幻 (西式魔幻)", "奇幻 (东方仙侠)"],
    "科幻未来 (Sci-Fi)": ["科幻 (星际歌剧)", "科幻 (赛博朋克)", "科幻 (末日废土)", "科幻 (基因进化)", "科幻 (虚拟现实)"],
    "都市言情 (Urban Romance)": ["言情 (霸道总裁)", "言情 (青春校园)", "言情 (破镜重圆)", "言情 (职场恋爱)", "写实 (家庭伦理)"],
    "悬疑推理 (Mystery/Thriller)": ["悬疑 (刑侦探案)", "悬疑 (心理惊悚)", "悬疑 (恐怖灵异)", "推理 (本格推理)", "推理 (社会派)"],
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
];

const DEFAULT_FORBIDDEN_WORDS = ['冰', '指尖', '尖', '利', '钉', '凉', '惨白', '僵', '颤', '眸', '眼底', '空气', '仿佛', '似乎', '呼吸', '心跳', '肌肉', '绷紧', '深邃', '清冷', '炽热', '精致', '完美', '绝美'];
const DEFAULT_STORY_OPTIONS: StoryOptions = {
    writingModel: 'gemini-2.5-pro',
    style: '爽文 (重生复仇打脸)',
    length: '短篇(约5-10章)',
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
        const { storyOutline, chapters, storyOptions, lastPlotChoice, storyCore } = JSON.parse(savedSession);
        if (chapters && chapters.length > 0 && storyOutline) {
          return {
            initialGameState: GameState.CHAPTER_COMPLETE,
            initialActiveTab: 'writing' as ActiveTab,
            initialStoryCore: storyCore || '',
            initialStoryOutline: storyOutline,
            initialChapters: chapters,
            initialStoryOptions: storyOptions || DEFAULT_STORY_OPTIONS,
            initialLastPlotChoice: lastPlotChoice,
          };
        }
      }
    } catch (e) {
      console.error("Failed to load saved session:", e);
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
      initialLastPlotChoice: undefined,
    };
};


const extractAndParseJson = <T,>(
    text: string, 
    startTag: string, 
    endTag: string, 
    stepNameForError: string
): T => {
    const regex = new RegExp(`${startTag}([\\s\\S]*?)${endTag}`);
    const match = text.match(regex);

    if (!match || !match[1]) {
        throw new Error(`在"${stepNameForError}"的输出中，未能找到预期的数据块 (${startTag})。`);
    }

    let jsonString = match[1].trim();
    
    jsonString = jsonString.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

    try {
        return JSON.parse(jsonString) as T;
    } catch (e: any) {
        console.error(`Failed to parse JSON from step "${stepNameForError}":`, jsonString);
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
        initialLastPlotChoice 
    } = useMemo(() => getInitialState(), []);

    const [gameState, setGameState] = useState<GameState>(initialGameState);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [storyCore, setStoryCore] = useState<string>(initialStoryCore);
    const [storyOptions, setStoryOptions] = useState<StoryOptions>(initialStoryOptions);
    const [activeTab, setActiveTab] = useState<ActiveTab>(initialActiveTab);

    const [storyOutline, setStoryOutline] = useState<StoryOutline | null>(initialStoryOutline);
    const [chapters, setChapters] = useState<GeneratedChapter[]>(initialChapters);
    const [thoughtSteps, setThoughtSteps] = useState<ThoughtStep[]>([]);
    const [nextPlotChoices, setNextPlotChoices] = useState<NextPlotChoice[] | null>(null);
    const [lastPlotChoice, setLastPlotChoice] = useState<NextPlotChoice | undefined>(initialLastPlotChoice);
    const [error, setError] = useState<string | null>(null);
    
    const [editInput, setEditInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    
    const workspaceRef = useRef<HTMLDivElement>(null);

    // Auto-saving logic
    useEffect(() => {
        // Don't save during initial states before planning is complete
        if (gameState !== GameState.INITIAL && gameState !== GameState.PLANNING && storyOutline) {
            const sessionToSave = {
                storyOutline,
                chapters,
                storyOptions,
                lastPlotChoice,
                storyCore
            };
            localStorage.setItem('saved_story_session', JSON.stringify(sessionToSave));
        }
    }, [storyOutline, chapters, storyOptions, lastPlotChoice, gameState, storyCore]);


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


    const handleError = (message: string, stepId?: number) => {
        setError(message);
        setGameState(GameState.ERROR);
        if (stepId !== undefined) {
            setThoughtSteps(prev => prev.map(s => s.id === stepId ? { ...s, status: 'error' } : s));
        }
    };
    
    const startAgent = async () => {
        if (!storyCore.trim()) {
            setError("请输入故事核心。");
            return;
        }
        setError(null);
        setChapters([]);
        setStoryOutline(null);
        setNextPlotChoices(null);
        setActiveTab('agent');
        setLastPlotChoice(undefined);
        
        const initialSteps: ThoughtStep[] = [
            { id: 0, title: "第一步：题材分析", model: 'gemini-2.5-flash', content: null, status: 'pending', citations: [] },
            { id: 1, title: "第二步：角色蓝图构建", model: 'gemini-2.5-flash', content: null, status: 'pending', citations: [] },
            { id: 2, title: "第三步：情节与钩子设计", model: 'gemini-2.5-flash', content: null, status: 'pending', citations: [] },
            { id: 3, title: "第四步：AI痕跡与写作风格研究", model: 'gemini-2.5-flash', content: null, status: 'pending', citations: [] },
        ];
        setThoughtSteps(initialSteps);
        setGameState(GameState.PLANNING);
        
        setTimeout(() => scrollToBottom(workspaceRef), 100);

        const thinkingPrompts = [
            { key: 'genreAnalysis', prompt: `分析 "${storyOptions.style}" 题材在当前中文网络小说市场的流行元素、核心爽点、读者期待和常见雷区。` },
            { key: 'characterDesign', prompt: `根据“冰山法则”设计主要角色。为每个角色构建具体的、可观察的“行为蓝图”，而不是抽象的心理简介。` },
            { key: 'plotConstruction', prompt: `设计一个由【行动】驱动、包含【功能性环境】和强力【章节钩子】的情节大纲。` },
            { key: 'antiAIFlavor', prompt: `研究并确立一套严格的写作禁忌，以彻底消除文本中的“AI味”，重点解决细节堆砌、机械化背景交代、定性描述和生硬衔接等问题。` }
        ];
        
        try {
            const thoughtResults = await Promise.all(
                thinkingPrompts.map(async ({ key, prompt }, i) => {
                    setThoughtSteps(prev => prev.map(s => s.id === i ? { ...s, status: 'running', content: '' } : s));
                    const stream = await runThinkingStepStream(key, prompt, storyCore, storyOptions);
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
                        setThoughtSteps(prev => prev.map(s => s.id === i ? { ...s, content: thoughtText, citations } : s));
                    }
                    setThoughtSteps(prev => prev.map(s => s.id === i ? { ...s, status: 'complete' } : s));
                    return { key, text: thoughtText };
                })
            );
            
            const thoughts = thoughtResults.reduce((acc, result) => {
                acc[result.key] = result.text;
                return acc;
            }, {} as { [key: string]: string });
            
            try {
                const characters = extractAndParseJson<CharacterProfile[]>(thoughts.characterDesign, '\\[START_CHAR_JSON\\]', '\\[END_CHAR_JSON\\]', initialSteps[1].title);
                const { title, plotSynopsis } = extractAndParseJson<{ title: string; plotSynopsis: string }>(thoughts.plotConstruction, '\\[START_PLOT_JSON\\]', '\\[END_PLOT_JSON\\]', initialSteps[2].title);
                const { writingMethodology, antiPatternGuide } = extractAndParseJson<{ writingMethodology: WritingMethodology, antiPatternGuide: AntiPatternGuide }>(thoughts.antiAIFlavor, '\\[START_METHOD_JSON\\]', '\\[END_METHOD_JSON\\]', initialSteps[3].title);
                const finalOutline: StoryOutline = { title, plotSynopsis, genreAnalysis: thoughts.genreAnalysis, worldConcept: thoughts.plotConstruction, characters, writingMethodology, antiPatternGuide };
                setStoryOutline(finalOutline);
                setGameState(GameState.PLANNING_COMPLETE);
                scrollToBottom(workspaceRef);
                writeChapter(undefined, finalOutline);
            } catch (assemblyError: any) {
                 console.error("Assembly Error:", assemblyError);
                 handleError(`组装创作计划失败: ${assemblyError.message}`);
            }
        } catch (e: any) {
            console.error("AI agent planning failed due to one or more steps failing.", e);
            if (e instanceof Error) handleError(e.message);
        }
    };

    const writeChapter = async (
        plotChoice?: NextPlotChoice,
        outlineForFirstChapter?: StoryOutline,
        explicitHistory?: GeneratedChapter[]
    ) => {
        const currentOutline = outlineForFirstChapter || storyOutline;
        if (!currentOutline) {
            handleError("无法写入章节，缺少创作计划。请返回重试。");
            return;
        }

        const historyChapters = explicitHistory !== undefined
            ? explicitHistory
            : (plotChoice ? chapters : (outlineForFirstChapter ? [] : chapters));
        
        if (plotChoice) {
            setLastPlotChoice(plotChoice);
        }

        setActiveTab('writing');
        setGameState(GameState.WRITING);
        setNextPlotChoices(null);
        setError(null);
        
        const newChapterId = (historyChapters[historyChapters.length-1]?.id || 0) + 1;
        const newChapter: GeneratedChapter = {
            id: newChapterId,
            title: `第 ${String(newChapterId).padStart(2, '0')} 章 (正在生成...)`,
            content: '',
            status: 'streaming',
        };
        setChapters([...historyChapters, newChapter]);
        scrollToBottom(workspaceRef);

        try {
            const stream = await generateChapterStream(currentOutline, historyChapters, storyOptions, plotChoice?.summary);
            let rawTitle = newChapter.title;
            let rawContent = "";
            let isTitleSet = false;
            for await (const chunk of stream) {
                let textChunk = chunk.text;
                if (!isTitleSet) {
                    const titleMatch = textChunk.match(/^(?:章节标题：|Chapter Title:)(.*)\n/);
                    if (titleMatch) {
                        rawTitle = titleMatch[1].trim();
                        textChunk = textChunk.substring(titleMatch[0].length);
                        isTitleSet = true;
                    }
                }
                rawContent += textChunk;
                setChapters(prev => prev.map(c => c.id === newChapterId ? {...c, title: rawTitle, content: rawContent} : c));
            }
            const finalContent = rawContent.replace(/^(?:章节标题：|Chapter Title:)(.*)\n/, '').trim();
            const finalChapter = { ...newChapter, title: rawTitle, content: finalContent, status: 'complete' as const };
            setChapters(prev => prev.map(c => c.id === newChapterId ? finalChapter : c));
            setGameState(GameState.CHAPTER_COMPLETE);
        } catch (e:any) {
            handleError(e.message || "章节生成过程中发生未知错误。", undefined);
            setChapters(historyChapters);
        }
    };
    
    const regenerateLastChapter = () => {
        if(chapters.length === 0) return;
        const historyChapters = chapters.slice(0, -1);
        writeChapter(lastPlotChoice, undefined, historyChapters);
    }

    const prepareNextChapter = async () => {
        if (!storyOutline) return;
        setGameState(GameState.GENERATING_CHOICES);
        setError(null);
        try {
            const response = await generateNextPlotChoices(storyOutline, chapters, storyOptions);
            const choices = JSON.parse(response.text) as NextPlotChoice[];
            setNextPlotChoices(choices);
            setGameState(GameState.CHOOSING_PLOT);
        } catch (e: any) {
            handleError(e.message, undefined);
        }
    };
    
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
        const parts = text.split(/(\【.*?】|\[START_CHAR_JSON\][\s\S]*?\[END_CHAR_JSON\]|\[START_PLOT_JSON\][\s\S]*?\[END_PLOT_JSON\]|\[START_METHOD_JSON\][\s\S]*?\[END_METHOD_JSON\])/g);
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
    
    const handleReset = () => {
        localStorage.removeItem('saved_story_session');
        setGameState(GameState.INITIAL); 
        setError(null);
        setStoryCore('');
        setStoryOutline(null);
        setChapters([]);
        setLastPlotChoice(undefined);
        setStoryOptions(DEFAULT_STORY_OPTIONS);
    };

    const renderInitialView = () => (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
             <div className="absolute top-4 right-4">
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full glass-card glass-interactive transition-all duration-300">
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
                         <option value="短篇(约5-10章)">短篇(约5-10章)</option>
                         <option value="中篇(约11-30章)">中篇(约11-30章)</option>
                         <option value="长篇(30章以上)">长篇(30章以上)</option>
                    </select>
                    <select title={authorStyles.find(a => a.name === storyOptions.authorStyle)?.description} value={storyOptions.authorStyle} onChange={e => setStoryOptions(o => ({...o, authorStyle: e.target.value as AuthorStyle}))} className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500">
                         {authorStyles.map(author => (
                            <option key={author.name} value={author.name} title={author.description}>{author.name}</option>
                         ))}
                    </select>
                </div>
                <button
                    className="mt-6 w-full flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                    onClick={startAgent}
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
                     <h1 className="text-lg font-bold text-slate-200 truncate" title={storyOutline?.title || "AI小说创作代理"}>
                        {storyOutline?.title || "AI小说创作代理"}
                     </h1>
                     <div>
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 mr-2 rounded-md font-semibold transition bg-slate-600 text-white hover:bg-slate-500"
                        >
                            返回
                        </button>
                        <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-slate-700/50 transition-colors">
                            <SettingsIcon className="w-6 h-6 text-slate-300"/>
                        </button>
                     </div>
                </header>

                <div className="flex-shrink-0 border-b border-white/10 bg-slate-950/70 z-10">
                    <nav className="flex space-x-1 px-2">
                        <TabButton targetTab="agent" icon={<BrainCircuitIcon className="w-4 h-4"/>} label="AI思考过程"/>
                        <TabButton targetTab="worldbook" icon={<BookOpenIcon className="w-4 h-4"/>} label="世界书"/>
                        <TabButton targetTab="characters" icon={<UsersIcon className="w-4 h-4"/>} label="角色档案"/>
                        <TabButton targetTab="writing" icon={<FilePenIcon className="w-4 h-4"/>} label="创作正文"/>
                    </nav>
                </div>

                <main ref={workspaceRef} className="flex-grow overflow-y-auto bg-slate-900/30">
                    <div className="p-4 md:p-6">
                        {activeTab === 'agent' && (
                             <div className="space-y-4">
                                {thoughtSteps.map(step => (
                                    <details key={step.id} data-step-id={step.id} className="glass-card rounded-lg" open={step.status === 'running' || step.status === 'error'}>
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
                            </div>
                        )}
                        {activeTab === 'worldbook' && storyOutline && (
                           <div className="glass-card p-6 rounded-lg space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100">{storyOutline.title}</h2>
                                    <p className="text-slate-400 mt-2">{storyOutline.plotSynopsis}</p>
                                </div>
                                <div className="border-t border-white/10 pt-4">
                                     <h3 className="text-lg font-semibold text-teal-300 mb-2">写作方法论</h3>
                                     <div className="space-y-3 text-sm">
                                        {Object.entries(storyOutline.writingMethodology).map(([key, value]) =>(
                                            value && (<div key={key}>
                                                <p className="font-bold text-slate-200">{value.description}</p>
                                                <p className="text-slate-400">{value.application}</p>
                                            </div>)
                                        ))}
                                     </div>
                                </div>
                                <div className="border-t border-white/10 pt-4">
                                     <h3 className="text-lg font-semibold text-red-400/80 mb-2">写作禁忌</h3>
                                     <div className="space-y-3 text-sm">
                                         {Object.entries(storyOutline.antiPatternGuide).map(([key, value]) =>(
                                            <div key={key}>
                                                <p className="font-bold text-slate-200">{value.description}</p>
                                                <p className="text-slate-400">{value.instruction}</p>
                                            </div>
                                        ))}
                                     </div>
                                </div>
                                {chapters && chapters.length > 0 && (
                                <div className="border-t border-white/10 pt-4">
                                     <h3 className="text-lg font-semibold text-purple-300 mb-4">创作历史 (章节回顾)</h3>
                                     <div className="space-y-2">
                                        {chapters.map(chapter => (
                                            <details key={chapter.id} className="bg-slate-900/50 rounded-md">
                                                <summary className='p-3 cursor-pointer font-semibold text-slate-300 hover:text-white'>{chapter.title}</summary>
                                                <div className="p-4 border-t border-white/10 text-slate-300 whitespace-pre-wrap font-serif leading-relaxed text-base prose prose-invert prose-p:mb-4">
                                                   {chapter.content}
                                                </div>
                                            </details>
                                        ))}
                                     </div>
                                </div>
                                )}
                           </div>
                        )}
                        {activeTab === 'characters' && storyOutline && (
                            <CharacterArchive characters={storyOutline.characters} />
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
                                                <div className="text-slate-300 whitespace-pre-wrap font-serif leading-relaxed text-base prose prose-invert prose-p:mb-4">
                                                    {chapter.content || (chapter.status !== 'complete' && '正在生成...')}
                                                    {chapter.status === 'streaming' && <span className="inline-block w-2 h-4 bg-slate-300 animate-pulse ml-1" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 text-slate-500">
                                        <p>正在生成第一章...</p>
                                    </div>
                                )}

                                {gameState === GameState.CHAPTER_COMPLETE && (
                                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                                        <button onClick={regenerateLastChapter} className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-500 transition-transform transform hover:scale-105 shadow-lg">
                                            <RefreshCwIcon className="w-6 h-6 mr-2" />重新生成
                                        </button>
                                        <button onClick={prepareNextChapter} className="w-full md:w-auto flex items-center justify-center px-8 py-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-transform transform hover:scale-105 shadow-lg">
                                            <SparklesIcon className="w-6 h-6 mr-2" />生成下一章情节
                                        </button>
                                    </div>
                                )}
                                {gameState === GameState.GENERATING_CHOICES && (
                                    <div className="text-center p-4 text-slate-400 flex items-center justify-center"><LoadingSpinner className="mr-2"/>正在构思后续情节...</div>
                                )}
                                {gameState === GameState.CHOOSING_PLOT && nextPlotChoices && (
                                    <div className="glass-card p-6 rounded-lg">
                                        <h2 className="text-xl font-bold text-slate-100 mb-4">选择下一章剧情走向</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {nextPlotChoices.map((choice, index) => (
                                                <div key={index} className="bg-slate-900/60 p-4 rounded-lg border border-transparent hover:border-teal-500 cursor-pointer flex flex-col transition-all duration-200" onClick={() => writeChapter(choice)}>
                                                    <p className="font-bold text-sky-400 flex-grow">{choice.summary}</p>
                                                    <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-white/10">【理由】 {choice.justification}</p>
                                                </div>
                                            ))}
                                        </div>
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
import React, { useState, useMemo } from 'react';
import type { StoryOutline, GeneratedChapter, StoryOptions, FinalDetailedOutline, PlotPointAnalysis, OutlineCritique, ScoringDimension, ImprovementSuggestion, OptimizationHistoryEntry, DetailedOutlineAnalysis } from '../types';
import { generateChapterTitles, generateDetailedOutline, refineDetailedOutline } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import LoadingSpinner from './icons/LoadingSpinner';
import SendIcon from './icons/SendIcon';
import CopyIcon from './icons/CopyIcon';
import RefreshCwIcon from './icons/RefreshCwIcon';

interface OutlineGeneratorProps {
    storyOutline: StoryOutline;
    chapters: GeneratedChapter[];
    generatedTitles: string[];
    setGeneratedTitles: React.Dispatch<React.SetStateAction<string[]>>;
    outlineHistory: Record<string, string>;
    setOutlineHistory: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    storyOptions: StoryOptions;
    activeOutlineTitle: string | null;
    setActiveOutlineTitle: React.Dispatch<React.SetStateAction<string | null>>;
}

const AnalysisField: React.FC<{ label: string; value: any; color: string }> = ({ label, value, color }) => {
    const displayValue = (typeof value === 'object' && value !== null) 
        ? JSON.stringify(value, null, 2) 
        : (value !== null && value !== undefined ? String(value) : '');

    return (
        <div>
            <h5 className={`text-xs font-bold ${color} uppercase tracking-wider`}>{label}</h5>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{displayValue}</p>
        </div>
    );
};

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
    const percentage = score * 10;
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;

    const getColor = (s: number) => {
        if (s >= 9) return 'text-green-400';
        if (s >= 7.5) return 'text-sky-400';
        if (s >= 6) return 'text-amber-400';
        return 'text-red-400';
    };

    const getTrackColor = (s: number) => {
        if (s >= 9) return 'stroke-green-400/20';
        if (s >= 7.5) return 'stroke-sky-400/20';
        if (s >= 6) return 'stroke-amber-400/20';
        return 'stroke-red-400/20';
    };

    const getStrokeColor = (s: number) => {
        if (s >= 9) return 'stroke-green-400';
        if (s >= 7.5) return 'stroke-sky-400';
        if (s >= 6) return 'stroke-amber-400';
        return 'stroke-red-400';
    }


    return (
        <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    className={getTrackColor(score)}
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                />
                {/* Progress circle */}
                <circle
                    className={`${getStrokeColor(score)} transition-all duration-1000 ease-out`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%'
                    }}
                />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${getColor(score)}`}>
                <span className="text-4xl font-bold">{score.toFixed(1)}</span>
                <span className="text-xs uppercase font-semibold tracking-wider">综合评分</span>
            </div>
        </div>
    );
};

const CritiqueDisplay: React.FC<{ critique: OutlineCritique }> = ({ critique }) => (
    <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-700/50 space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
                <ScoreCircle score={critique.overallScore} />
            </div>
            <div className="w-full">
                <h4 className="text-lg font-bold text-slate-100 mb-3">第三方评估报告</h4>
                <div className="space-y-2 text-sm">
                {critique.scoringBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-md">
                        <span className="text-slate-300">{item.dimension}</span>
                        <span className={`font-bold ${item.score >= 9 ? 'text-green-400' : item.score >= 7.5 ? 'text-sky-400' : item.score >= 6 ? 'text-amber-400' : 'text-red-400'}`}>{item.score.toFixed(1)}</span>
                    </div>
                ))}
                </div>
            </div>
        </div>
        <div>
            <h5 className="text-base font-bold text-amber-300 mb-3">优化建议 (对标《庆余年》《大奉打更人》)</h5>
            <ul className="space-y-3">
                {critique.improvementSuggestions.map((item, index) => (
                    <li key={index} className="p-3 bg-slate-800/40 rounded-lg border-l-4 border-amber-400/50">
                        <p className="font-semibold text-slate-200 text-sm">{item.area}</p>
                        <p className="text-slate-400 text-sm mt-1">{item.suggestion}</p>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const OptimizationHistoryDisplay: React.FC<{ history: OptimizationHistoryEntry[] }> = ({ history }) => {
    if (!history || history.length === 0) return null;

    // Show latest critique first, which corresponds to the final version minus one.
    const reversedHistory = [...history].reverse();

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-bold text-slate-100">优化历史记录</h4>
            {reversedHistory.map(entry => (
                <details key={entry.version} className="bg-slate-950/40 rounded-lg border border-slate-700/50">
                    <summary className="p-3 cursor-pointer font-semibold text-slate-200 flex justify-between items-center">
                        <span>v{entry.version} - 综合评分: <span className="font-bold text-amber-300">{entry.critique.overallScore.toFixed(1)}</span></span>
                         <span className="text-xs text-slate-500 group-open:hidden">点击展开</span>
                    </summary>
                    <div className="p-4 border-t border-slate-700/50">
                         <CritiqueDisplay critique={entry.critique} />
                         <div className="mt-4">
                             <h5 className="text-base font-bold text-slate-300 mb-2">v{entry.version} 稿件摘要</h5>
                             <div className="p-3 bg-slate-800/30 rounded-lg space-y-2 text-sm max-h-60 overflow-y-auto">
                                {entry.outline.plotPoints.map((pp, idx) => (
                                    <p key={idx} className="text-slate-400 border-b border-slate-700/50 pb-1 last:border-b-0">
                                        <span className="font-semibold text-slate-300">剧情点 {idx + 1}: </span>{pp.summary}
                                    </p>
                                ))}
                             </div>
                         </div>
                    </div>
                </details>
            ))}
        </div>
    );
};


const OutlineGenerator: React.FC<OutlineGeneratorProps> = ({ 
    storyOutline, 
    chapters, 
    generatedTitles, 
    setGeneratedTitles, 
    outlineHistory, 
    setOutlineHistory,
    storyOptions,
    activeOutlineTitle,
    setActiveOutlineTitle
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingTitles, setIsLoadingTitles] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [refinementRequest, setRefinementRequest] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const extractAndParseJson = <T,>(text: string): T | null => {
        const startTag = '\\[START_DETAILED_OUTLINE_JSON\\]';
        const endTag = '\\[END_DETAILED_OUTLINE_JSON\\]';
        const regex = new RegExp(`${startTag}([\\s\\S]*?)${endTag}`);
        const match = text.match(regex);
        if (!match || !match[1]) return null;
        let jsonString = match[1].trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        try {
            return JSON.parse(jsonString) as T;
        } catch (e) {
            console.warn("Parsing incomplete detailed outline JSON.", e);
            return null;
        }
    };

    const handleGenerateTitles = async () => {
        setIsLoadingTitles(true);
        setError(null);
        setActiveOutlineTitle(null);
        try {
            // FIX: The `generateChapterTitles` function returns an object with a `titles` property.
            const response = await generateChapterTitles(storyOutline, chapters, storyOptions);
            setGeneratedTitles(prev => [...prev, ...response.titles]);
        } catch (e: any) {
            setError(e.message || "生成章节标题时发生未知错误。");
        } finally {
            setIsLoadingTitles(false);
        }
    };

    const handleGenerateOutline = async () => {
        if (!activeOutlineTitle) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await generateDetailedOutline(storyOutline, chapters, activeOutlineTitle, userInput, storyOptions);
            setOutlineHistory(prev => ({...prev, [activeOutlineTitle as string]: response.text}));
        } catch (e: any) {
            setError(e.message || "生成细纲时发生未知错误。");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNextIteration = async () => {
        if (!activeOutlineTitle || !outlineHistory[activeOutlineTitle]) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await refineDetailedOutline(outlineHistory[activeOutlineTitle], refinementRequest, activeOutlineTitle, storyOutline, storyOptions);
            setOutlineHistory(prev => ({...prev, [activeOutlineTitle as string]: response.text}));
            setRefinementRequest(''); // Clear input after successful refinement
        } catch (e: any) {
            setError(e.message || "优化细纲时发生未知错误。");
        } finally {
            setIsLoading(false);
        }
    }


    const parsedOutline = useMemo<FinalDetailedOutline | null>(() => {
        if (!activeOutlineTitle || !outlineHistory[activeOutlineTitle]) return null;
        return extractAndParseJson<FinalDetailedOutline>(outlineHistory[activeOutlineTitle]);
    }, [activeOutlineTitle, outlineHistory]);
    
    const handleCopy = () => {
        if (!parsedOutline) return;
        const textToCopy = outlineHistory[activeOutlineTitle as string];
        navigator.clipboard.writeText(textToCopy).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            setError("复制失败: " + err.message);
        });
    };

    const nextChapterStart = chapters.length + 1;

    return (
        <div className="glass-card p-6 rounded-lg space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-100">章节细纲分析器</h2>
                <p className="text-slate-400 mt-1 text-sm">此模块采用【手动迭代】模式。AI将生成初稿并进行评估，然后由您决定是否根据评估建议或您的新指令，启动新一轮的优化。</p>
            </div>
            
            <div className="border-t border-white/10 pt-4">
                <button
                    onClick={handleGenerateTitles}
                    disabled={isLoading || isLoadingTitles}
                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoadingTitles ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                    {isLoadingTitles ? '正在生成...' : `生成 ${generatedTitles.length + nextChapterStart}-${generatedTitles.length + nextChapterStart + 9} 章标题`}
                </button>
            </div>

            {generatedTitles.length > 0 && (
                <div className="border-t border-white/10 pt-4 space-y-3">
                     <h3 className="text-lg font-semibold text-slate-200">已生成标题列表 (点击选择)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {generatedTitles.map((title, index) => (
                            <button 
                                key={index} 
                                onClick={() => setActiveOutlineTitle(title)}
                                disabled={isLoading}
                                className={`p-3 text-left rounded-md text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${activeOutlineTitle === title ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                            >
                                <span className="font-mono text-xs opacity-70 mr-2">{chapters.length + index + 1}.</span> {title}
                            </button>
                        ))}
                     </div>
                </div>
            )}

            {activeOutlineTitle && (
                <div className="border-t border-white/10 pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-200">
                            {outlineHistory[activeOutlineTitle] !== undefined ? '细纲分析 / 优化' : '为'}<span className="text-teal-400 mx-1">“{activeOutlineTitle}”</span>生成细纲分析
                        </h3>
                        {parsedOutline && (
                             <div className="flex items-center gap-x-2">
                                <button
                                    onClick={() => { if(window.confirm("确定要重新生成吗？当前版本的细纲和历史记录都将被清除。")) handleGenerateOutline() }}
                                    className="flex items-center gap-x-2 px-3 py-1.5 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                    title="重新生成"
                                >
                                    <RefreshCwIcon className="w-3.5 h-3.5"/>
                                    <span>重新生成</span>
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-x-2 px-3 py-1.5 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors disabled:opacity-50"
                                    disabled={isCopied}
                                >
                                    <CopyIcon className="w-3.5 h-3.5"/>
                                    {isCopied ? '已复制!' : '复制分析'}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Generation UI */}
                    {outlineHistory[activeOutlineTitle] === undefined && (
                        <div className='p-4 rounded-lg bg-slate-900/50 space-y-4'>
                            <div>
                                <label htmlFor="outline-prompt" className="block text-xs font-medium text-slate-400 mb-1">
                                    优化或指导 (可选)
                                </label>
                                <input
                                    id="outline-prompt"
                                    type="text"
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    placeholder="输入优化或指导（可选）"
                                    className="w-full p-2 bg-slate-800/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-1 focus:ring-cyan-500 transition text-sm"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                onClick={handleGenerateOutline}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center px-4 py-2 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                {isLoading ? '正在生成...' : '生成本章细纲分析'}
                            </button>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded-md">{error}</p>}
                    
                    {/* Display & Refinement UI */}
                    {outlineHistory[activeOutlineTitle] !== undefined && (
                        <div className="space-y-4">
                             <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700 max-h-[60rem] overflow-y-auto space-y-6">
                                {parsedOutline ? (
                                    <>
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-700">
                                            <h4 className="text-xl font-bold text-slate-100">当前细纲 (v{parsedOutline.finalVersion})</h4>
                                            <span className="font-mono text-sm bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                                                最终评分: {parsedOutline.optimizationHistory[parsedOutline.optimizationHistory.length - 1]?.critique.overallScore.toFixed(1) || 'N/A'}
                                            </span>
                                        </div>
                                        
                                        {parsedOutline.plotPoints.map((point: PlotPointAnalysis, index: number) => (
                                            <div key={index} className="p-4 rounded-lg bg-slate-900/50 border border-slate-800/50 space-y-3">
                                                <h4 className="text-base font-bold text-teal-300">【剧情点 {index + 1}】 {point.summary}</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                                                    <AnalysisField label="情绪曲线任务" value={point.emotionalCurve} color="text-sky-400" />
                                                    <AnalysisField label="节奏控制" value={point.pacingControl} color="text-cyan-400" />
                                                    <AnalysisField label="角色动机 (马斯洛需求)" value={point.maslowsNeeds} color="text-amber-400" />
                                                    <AnalysisField label="爽点/钩子设计" value={point.webNovelElements} color="text-rose-400" />
                                                    <AnalysisField label="冲突来源" value={point.conflictSource} color="text-red-400" />
                                                    <div className="md:col-span-2">
                                                      <AnalysisField label="“展示而非讲述”建议" value={point.showDontTell} color="text-indigo-400" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <AnalysisField label="关键对话与潜台词 (冰山法则)" value={point.dialogueAndSubtext} color="text-purple-400" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <AnalysisField label="逻辑夯实 (合理性与铺垫)" value={point.logicSolidification} color="text-green-400" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <AnalysisField label="情绪与互动强化 (冲突张力)" value={point.emotionAndInteraction} color="text-pink-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        <div className="mt-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800/50">
                                            <h4 className="text-lg font-bold text-fuchsia-400 mb-3">下一章衔接规划</h4>
                                            <div className="space-y-3">
                                                <AnalysisField label="细纲设想" value={parsedOutline.nextChapterPreview.nextOutlineIdea} color="text-fuchsia-400" />
                                                <AnalysisField label="登场角色需求" value={parsedOutline.nextChapterPreview.characterNeeds} color="text-fuchsia-400" />
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-6 border-t border-slate-700">
                                            <OptimizationHistoryDisplay history={parsedOutline.optimizationHistory} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-slate-500">
                                        细纲生成失败或数据格式错误。请尝试重新生成。
                                    </div>
                                )}
                            </div>
                             {/* Refinement Chatbox */}
                             <div className="p-4 bg-slate-900/50 rounded-lg space-y-3">
                                <label htmlFor="refinement-request" className="block text-sm font-medium text-slate-300">优化指令 (可选)</label>
                                <textarea
                                    id="refinement-request"
                                    value={refinementRequest}
                                    onChange={e => setRefinementRequest(e.target.value)}
                                    placeholder="输入优化指令，或直接点击“优化下一轮”让AI根据评估报告自行改进..."
                                    rows={3}
                                    className="w-full p-2 bg-slate-800/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-1 focus:ring-sky-500 transition text-sm resize-y"
                                    disabled={isLoading}
                                />
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={handleNextIteration}
                                        disabled={isLoading}
                                        className="flex items-center justify-center px-4 py-2 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 transition-colors shadow-md disabled:bg-slate-600 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2"/> : <SendIcon className="w-5 h-5 mr-2"/>}
                                        {isLoading ? '优化中...' : `优化下一轮 (当前 v${parsedOutline?.finalVersion || 0})`}
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OutlineGenerator;

import React from 'react';
import type { OutlineGenerationProgress } from '../types';
import StopCircleIcon from './icons/StopCircleIcon';

interface GenerationProgressModalProps {
  isOpen: boolean;
  progress: OutlineGenerationProgress | null;
  onAbort: () => void;
}

const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({ isOpen, progress, onAbort }) => {
  if (!isOpen) return null;

  const getScoreColor = (s: number | undefined) => {
    if (s === undefined) return 'text-slate-400';
    if (s >= 9) return 'text-green-400';
    if (s >= 7.5) return 'text-sky-400';
    if (s >= 6) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getProgressBarColor = (s: number | undefined) => {
    if (s === undefined) return 'bg-slate-500';
    if (s >= 9) return 'bg-green-500';
    if (s >= 7.5) return 'bg-sky-500';
    if (s >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const score = progress?.score ?? 0;
  const version = progress?.version ?? 0;
  const maxVersions = progress?.maxVersions ?? 5; // Assuming a max of 5 for display
  const percentage = (version / maxVersions) * 100 * (score / 10);


  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] transition-opacity">
      <div className="glass-card w-full max-w-lg rounded-2xl p-8 shadow-2xl m-4 flex flex-col items-center text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">AI 正在深度思考...</h2>
        <p className="text-slate-400 mb-6 text-sm">{progress?.message || '正在初始化...'}</p>

        <div className="w-full bg-slate-700/50 rounded-full h-4 mb-2 border border-slate-600">
          <div
            className={`h-4 rounded-full transition-all duration-500 ease-out ${getProgressBarColor(score)}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="w-full flex justify-between text-xs font-mono text-slate-400 mb-6">
            <span>v{version} / v{maxVersions}</span>
            <span className={getScoreColor(score)}>当前评估分数: {score > 0 ? score.toFixed(1) : 'N/A'}</span>
        </div>
        
        <p className="text-xs text-slate-500 mb-8">
            此过程可能需要一些时间。AI正在进行多轮创作、评估与自我修正，以确保交付高质量的细纲。
        </p>

        <button 
            onClick={onAbort}
            className="flex items-center gap-x-2 px-6 py-2 rounded-md font-semibold transition bg-red-600 text-white hover:bg-red-500 text-sm"
            title="停止当前AI任务"
        >
            <StopCircleIcon className="w-5 h-5" />
            <span>停止生成</span>
        </button>
      </div>
    </div>
  );
};

export default GenerationProgressModal;
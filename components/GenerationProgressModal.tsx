import React from 'react';
import type { OutlineGenerationProgress } from '../types';
import LoadingSpinner from './icons/LoadingSpinner';

interface GenerationProgressModalProps {
  isOpen: boolean;
  progress: OutlineGenerationProgress | null;
}

const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({ isOpen, progress }) => {
  if (!isOpen || !progress) return null;

  const percentage = progress.maxVersions > 0 ? (progress.version / progress.maxVersions) * 100 : 0;
  
  const getStrokeColor = (s: number) => {
    if (s >= 9) return 'stroke-green-400';
    if (s >= 7.5) return 'stroke-sky-400';
    if (s >= 6) return 'stroke-amber-400';
    return 'stroke-red-400';
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center z-[100] transition-opacity">
      <div className="glass-card w-full max-w-lg rounded-2xl p-8 shadow-2xl m-4 text-center">
        <LoadingSpinner className="w-12 h-12 mx-auto text-teal-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-2">正在生成细纲...</h2>
        <p className="text-slate-400 mb-6">AI正在进行多轮优化，请稍候。此过程不可中断。</p>
        
        <div className="w-full bg-slate-700/50 rounded-full h-4 overflow-hidden border border-slate-600">
            <div 
                className="bg-teal-500 h-4 rounded-full transition-all duration-500" 
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-sm text-slate-300">
            <span>{progress.message}</span>
            <span className={`font-bold ${getStrokeColor(progress.score).replace('stroke-', 'text-')}`}>
                {progress.score > 0 ? `当前评分: ${progress.score.toFixed(1)}` : ''}
            </span>
        </div>
      </div>
    </div>
  );
};

export default GenerationProgressModal;

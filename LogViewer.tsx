import React from 'react';
import type { LogEntry } from '../types';
import TrashIcon from './icons/TrashIcon';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClear: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose, logs, onClear }) => {
  if (!isOpen) return null;

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'success': return 'text-green-400';
      case 'info': return 'text-sky-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
    >
      <div
        className="glass-card w-full max-w-3xl h-[80vh] rounded-2xl p-6 shadow-2xl m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-100">事件日志</h2>
          <div className="flex items-center gap-x-2">
            <button
              onClick={onClear}
              className="flex items-center gap-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
              aria-label="Clear logs"
            >
              <TrashIcon className="w-4 h-4"/>
              清除日志
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
              aria-label="Close logs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-grow bg-slate-950/50 rounded-lg p-3 overflow-y-auto border border-slate-700">
          {logs.length > 0 ? (
            <div className="space-y-2 text-sm font-mono">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-x-3">
                  <span className="text-slate-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <p className={`flex-grow whitespace-pre-wrap break-words ${getLogColor(log.type)}`}>
                    <span className="font-bold mr-2">{log.type.toUpperCase()}:</span>
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>暂无日志记录。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
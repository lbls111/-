// Fix: Provide full content for App.tsx to create the main application component and resolve module errors.
import React, { useState, useCallback, useContext } from 'react';
import type { StoryOptions, LogEntry, OutlineGenerationProgress, AuthorStyle } from './types';
import SettingsModal from './components/SettingsModal';
import LogViewer from './components/LogViewer';
import GenerationProgressModal from './components/GenerationProgressModal';
import SettingsIcon from './components/icons/SettingsIcon';
import ClipboardListIcon from './components/icons/ClipboardListIcon';
import { AITaskProvider, AITaskContext } from './contexts/AITaskContext';
import PlayIcon from './components/icons/PlayIcon';
import PauseIcon from './components/icons/PauseIcon';

export const DEFAULT_STORY_OPTIONS: StoryOptions = {
  apiBaseUrl: '',
  apiKey: '',
  availableModels: [],
  searchModel: '',
  planningModel: '',
  writingModel: '',
  authorStyle: '默认风格',
  temperature: 0.7,
  diversity: 1.0, // top_p
  topK: 40,
  forbiddenWords: [],
};

const Header = () => {
    const { isPaused, togglePause } = useContext(AITaskContext);

    return (
        <header className="fixed top-0 left-0 right-0 bg-slate-900/50 backdrop-blur-sm z-40 border-b border-white/10">
            <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white">AI Story Weaver</h1>
                <div className="flex items-center gap-x-2">
                    <button
                        onClick={togglePause}
                        className={`p-2 rounded-full transition-colors ${isPaused ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-slate-700/50 text-slate-300'}`}
                        aria-label={isPaused ? "Resume AI Tasks" : "Pause AI Tasks"}
                        title={isPaused ? "恢复AI任务 (允许新任务开始)" : "紧急暂停所有AI任务"}
                    >
                        {isPaused ? <PlayIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
                    </button>
                    <button
                        onClick={() => {/* setIsLogViewerOpen(true) - This will be passed as prop */}}
                        id="log-viewer-btn"
                        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                        aria-label="View Logs"
                    >
                        <ClipboardListIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => {/* setIsSettingsOpen(true) - This will be passed as prop */}}
                        id="settings-btn"
                        className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
                        aria-label="Open Settings"
                    >
                        <SettingsIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};


function AppContent() {
  const [options, setOptions] = useState<StoryOptions>(DEFAULT_STORY_OPTIONS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState<OutlineGenerationProgress | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(true); // Open by default to force setup
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = { timestamp: Date.now(), message, type };
    setLogs(prevLogs => [newLog, ...prevLogs].slice(0, 200)); // Keep last 200 logs
    console.log(`[${type}] ${message}`);
  }, []);

  const handleClearLogs = () => {
    setLogs([]);
  };

  // This is a bit of a hack to connect the buttons in the header to the state in this component
  React.useEffect(() => {
    const logBtn = document.getElementById('log-viewer-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const logBtnClickHandler = () => setIsLogViewerOpen(true);
    const settingsBtnClickHandler = () => setIsSettingsOpen(true);

    logBtn?.addEventListener('click', logBtnClickHandler);
    settingsBtn?.addEventListener('click', settingsBtnClickHandler);

    return () => {
      logBtn?.removeEventListener('click', logBtnClickHandler);
      settingsBtn?.removeEventListener('click', settingsBtnClickHandler);
    }
  }, []);

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-8">
        {/* The rest of the application UI will go here */}
        <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">欢迎!</h2>
          <p className="text-slate-400">
            请配置您的API设置以开始。主要的应用组件将在这里显示。
          </p>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        setOptions={setOptions}
        addLog={addLog}
      />
      <LogViewer
        isOpen={isLogViewerOpen}
        onClose={() => setIsLogViewerOpen(false)}
        logs={logs}
        onClear={handleClearLogs}
      />
      <GenerationProgressModal isOpen={!!progress} progress={progress} />
    </div>
  );
}

function App() {
    return (
        <AITaskProvider>
            <AppContent />
        </AITaskProvider>
    );
}

export default App;

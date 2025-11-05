import React, { FC, useState, useEffect } from 'react';
import type { StoryOptions, AuthorStyle } from '../types';
import { listModels } from '../services/geminiService';
import LoadingSpinner from './icons/LoadingSpinner';
import { DEFAULT_STORY_OPTIONS } from '../App';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: StoryOptions;
  setOptions: React.Dispatch<React.SetStateAction<StoryOptions>>;
}

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

const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose, options, setOptions }) => {
  const [localOptions, setLocalOptions] = useState<StoryOptions>(options);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  
  useEffect(() => {
    // Sync local state if parent options change while modal is open
    setLocalOptions(options);
  }, [options, isOpen]);
  
  if (!isOpen) return null;

  const handleLocalOptionChange = <K extends keyof StoryOptions>(key: K, value: StoryOptions[K]) => {
    setLocalOptions(prev => ({ ...prev, [key]: value }));
  };
  
  const handleForbiddenWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const words = e.target.value.split(/[,，\s]+/).map(w => w.trim()).filter(Boolean);
    handleLocalOptionChange('forbiddenWords', words);
  };

  const handleFetchModels = async () => {
    const isTryingCustom = localOptions.apiBaseUrl || localOptions.apiKey;
    const isCustomConfigValid = localOptions.apiBaseUrl && localOptions.apiKey;

    if (isTryingCustom && !isCustomConfigValid) {
        setModelError("请输入有效的API地址和密钥，或将两者都留空以使用默认设置。");
        return;
    }

    setIsLoadingModels(true);
    setModelError(null);
    setConnectionSuccess(false);

    try {
        const models = await listModels({
            apiBaseUrl: localOptions.apiBaseUrl,
            apiKey: localOptions.apiKey
        });

        // Filter for models that are likely for chat/completions
        const chatModels = models.filter(m => 
            !m.includes('embedding') && 
            !m.includes('vision') &&
            !m.includes('tts') &&
            !m.includes('image')
        );

        setLocalOptions(prev => ({ ...prev, availableModels: chatModels }));

        // Auto-select models if none are selected or if current selection is invalid
        if (chatModels.length > 0) {
            const currentSearchModelValid = chatModels.includes(localOptions.searchModel);
            const currentPlanningModelValid = chatModels.includes(localOptions.planningModel);
            const currentWritingModelValid = chatModels.includes(localOptions.writingModel);

            if (!currentSearchModelValid) {
                 const flashModel = chatModels.find(m => m.includes('flash'));
                 setLocalOptions(prev => ({...prev, searchModel: flashModel || chatModels[0]}));
            }
            if (!currentPlanningModelValid) {
                 const flashModel = chatModels.find(m => m.includes('flash'));
                 setLocalOptions(prev => ({...prev, planningModel: flashModel || chatModels[0]}));
            }
            if (!currentWritingModelValid) {
                const proModel = chatModels.find(m => m.includes('pro') || m.includes('opus') || m.includes('4'));
                setLocalOptions(prev => ({...prev, writingModel: proModel || chatModels[0]}));
            }
        }
        setConnectionSuccess(true);
        setTimeout(() => setConnectionSuccess(false), 3000);
    } catch(e: any) {
        setModelError(`连接失败: ${e.message}`);
    } finally {
        setIsLoadingModels(false);
    }
  }

  const handleSave = () => {
    setOptions(localOptions);
    onClose();
  };

  const handleResetToDefault = () => {
      // Restore not just API keys, but also the model selections to default.
      setLocalOptions(prev => ({
          ...prev,
          apiBaseUrl: DEFAULT_STORY_OPTIONS.apiBaseUrl,
          apiKey: DEFAULT_STORY_OPTIONS.apiKey,
          availableModels: DEFAULT_STORY_OPTIONS.availableModels,
          searchModel: DEFAULT_STORY_OPTIONS.searchModel,
          planningModel: DEFAULT_STORY_OPTIONS.planningModel,
          writingModel: DEFAULT_STORY_OPTIONS.writingModel,
      }));
      setModelError(null);
      setConnectionSuccess(false);
  };


  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        onClick={handleSave}
    >
      <div 
        className="glass-card w-full max-w-2xl rounded-2xl p-6 shadow-2xl m-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">系统设置</h2>
          <button 
            onClick={handleSave}
            className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="border-b border-white/10 pb-6">
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-teal-400">API 连接设置</h3>
                 <button onClick={handleResetToDefault} className="text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-md transition-colors">
                    恢复默认设置
                 </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                将下方留空可使用AI Studio内置的Gemini API。您也可以连接到任何与OpenAI兼容的第三方API。
              </p>
              <div className="space-y-4">
                  <div>
                      <label htmlFor="api-base-url" className="block text-sm font-medium text-slate-300 mb-2">
                          API 地址 (Base URL)
                      </label>
                      <input
                          id="api-base-url"
                          type="text"
                          value={localOptions.apiBaseUrl}
                          onChange={e => handleLocalOptionChange('apiBaseUrl', e.target.value)}
                          placeholder="留空以使用默认设置"
                          className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 transition"
                      />
                  </div>
                   <div>
                      <label htmlFor="api-key" className="block text-sm font-medium text-slate-300 mb-2">
                          API 密钥 (API Key)
                      </label>
                      <input
                          id="api-key"
                          type="password"
                          value={localOptions.apiKey}
                          onChange={e => handleLocalOptionChange('apiKey', e.target.value)}
                          placeholder="留空以使用默认设置"
                          className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 transition"
                      />
                  </div>
                  <div>
                      <button
                        onClick={handleFetchModels}
                        disabled={isLoadingModels}
                        className="w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-md disabled:bg-slate-600 disabled:cursor-not-allowed"
                      >
                        {isLoadingModels ? <LoadingSpinner className="w-5 h-5 mr-2" /> : null}
                        {isLoadingModels ? '连接中...' : '连接 & 获取可用模型'}
                      </button>
                      {modelError && <p className="text-xs text-red-400 mt-2">{modelError}</p>}
                      {connectionSuccess && <p className="text-xs text-green-400 mt-2">连接成功！已获取 {localOptions.availableModels.length} 个模型。</p>}
                  </div>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                 <label htmlFor="search-model" className="block text-sm font-medium text-slate-300 mb-2">
                    搜索模型
                </label>
                <select
                    id="search-model"
                    value={localOptions.searchModel}
                    onChange={e => handleLocalOptionChange('searchModel', e.target.value)}
                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 transition"
                    disabled={localOptions.apiBaseUrl !== '' && localOptions.availableModels.length === 0}
                >
                  {localOptions.apiBaseUrl === '' ? (
                    <>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (默认)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    </>
                  ) : (
                    localOptions.availableModels.length > 0 ? (
                       localOptions.availableModels.map(model => <option key={model} value={model}>{model}</option>)
                    ) : (
                       <option value="">请先获取模型</option>
                    )
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                    用于初始的研究与分析。建议选择速度最快的模型。
                </p>
            </div>
            <div>
                 <label htmlFor="planning-model" className="block text-sm font-medium text-slate-300 mb-2">
                    规划/细纲模型
                </label>
                <select
                    id="planning-model"
                    value={localOptions.planningModel}
                    onChange={e => handleLocalOptionChange('planningModel', e.target.value)}
                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 transition"
                    disabled={localOptions.apiBaseUrl !== '' && localOptions.availableModels.length === 0}
                >
                  {localOptions.apiBaseUrl === '' ? (
                    <>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (默认)</option>
                        <option value="gemini-2.5-pro">gemini-2.5-pro</option>
                    </>
                  ) : (
                    localOptions.availableModels.length > 0 ? (
                       localOptions.availableModels.map(model => <option key={model} value={model}>{model}</option>)
                    ) : (
                       <option value="">请先获取模型</option>
                    )
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                    用于世界书、角色和细纲创作。建议选择速度快的模型。
                </p>
            </div>
            
            <div>
                 <label htmlFor="writing-model" className="block text-sm font-medium text-slate-300 mb-2">
                    写作模型
                </label>
                 <select
                    id="writing-model"
                    value={localOptions.writingModel}
                    onChange={e => handleLocalOptionChange('writingModel', e.target.value)}
                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 transition"
                    disabled={localOptions.apiBaseUrl !== '' && localOptions.availableModels.length === 0}
                 >
                   {localOptions.apiBaseUrl === '' ? (
                    <>
                        <option value="gemini-2.5-pro">gemini-2.5-pro (默认)</option>
                        <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    </>
                  ) : (
                    localOptions.availableModels.length > 0 ? (
                       localOptions.availableModels.map(model => <option key={model} value={model}>{model}</option>)
                    ) : (
                       <option value="">请先获取模型</option>
                    )
                  )}
                </select>
                <p className="text-xs text-slate-500 mt-1">用于生成章节正文。建议选择质量高的模型。</p>
            </div>
          </div>

             <div>
                 <label htmlFor="author-style" className="block text-sm font-medium text-slate-300 mb-2">
                    仿写风格 (Author Style)
                </label>
                <select
                    id="author-style"
                    value={localOptions.authorStyle}
                    onChange={e => handleLocalOptionChange('authorStyle', e.target.value as AuthorStyle)}
                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-200 focus:ring-2 focus:ring-sky-500 transition"
                >
                   {authorStyles.map(author => (
                        <option key={author.name} value={author.name} title={author.description}>{author.name}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">选择一位作者，AI将在所有创作环节深度模仿其写作风格。</p>
            </div>
            
            <div className="border-t border-white/10 pt-6">
                 <h3 className="text-lg font-bold text-sky-400 mb-4">高级写作参数</h3>
                 <div className="space-y-6">
                    <div>
                        <label htmlFor="temperature" className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                           <span>创作自由度 (Temperature)</span>
                           <span className="font-bold text-sky-300">{localOptions.temperature.toFixed(1)}</span>
                        </label>
                         <input
                            id="temperature"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={localOptions.temperature}
                            onChange={e => handleLocalOptionChange('temperature', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">值越低，写作风格越稳定、保守；值越高，越可能出现意想不到的创意。</p>
                    </div>
                     <div>
                        <label htmlFor="diversity" className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                           <span>词汇多样性 (Top P)</span>
                           <span className="font-bold text-sky-300">{((localOptions.diversity - 0.1) / 2.0).toFixed(2)}</span>
                        </label>
                         <input
                            id="diversity"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={localOptions.diversity}
                            onChange={e => handleLocalOptionChange('diversity', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">控制词汇选择的随机性。值越高，用词越随机、多样。</p>
                    </div>
                    <div>
                        <label htmlFor="top-k" className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                           <span>词汇选择范围 (Top-K)</span>
                           <span className="font-bold text-sky-300">{localOptions.topK}</span>
                        </label>
                         <input
                            id="top-k"
                            type="range"
                            min="1"
                            max="512"
                            step="1"
                            value={localOptions.topK}
                            onChange={e => handleLocalOptionChange('topK', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">控制AI在生成每个词时考虑的候选词数量。值越高，选择范围越广，可能更具创意。 (注意: 并非所有模型都支持此参数)</p>
                    </div>
                    <div>
                        <label htmlFor="forbidden-words" className="block text-sm font-medium text-slate-300 mb-2">
                           违禁词库 (Forbidden Lexicon)
                        </label>
                        <textarea
                            id="forbidden-words"
                            value={localOptions.forbiddenWords.join(', ')}
                            onChange={handleForbiddenWordsChange}
                            className="w-full h-24 p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-sky-500 transition resize-none"
                            placeholder="输入不希望AI使用的词汇，用逗号或空格分隔..."
                        />
                        <p className="text-xs text-slate-500 mt-1">在这里添加AI滥用的“僵尸词汇”，AI在写作时将绝对避免使用它们。</p>
                    </div>
                 </div>
            </div>
        </div>

         <div className="mt-8 text-right">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-lg"
            >
              保存并关闭
            </button>
          </div>
      </div>
    </div>
  );
};

export default SettingsModal;
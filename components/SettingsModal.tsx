import React, { FC } from 'react';
import type { StoryOptions, StoryModel, AuthorStyle } from '../types';

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
  if (!isOpen) return null;

  const handleOptionChange = <K extends keyof StoryOptions>(key: K, value: StoryOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleForbiddenWordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const words = e.target.value.split(/[,，\s]+/).map(w => w.trim()).filter(Boolean);
    handleOptionChange('forbiddenWords', words);
  };

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
        onClick={onClose}
    >
      <div 
        className="glass-card w-full max-w-lg rounded-2xl p-6 shadow-2xl m-4 overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-100">系统设置</h2>
          <button 
            onClick={onClose}
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
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                    Agent思考/细纲模型
                </label>
                <div className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                    <p className="text-slate-200 font-semibold">gemini-2.5-flash</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    负责联网研究、构思、细纲的创作、评估与优化。此项固定为快速模型，以保证客观性和迭代效率。
                </p>
            </div>
            
            <div>
                 <label htmlFor="writing-model" className="block text-sm font-medium text-slate-300 mb-2">
                    写作模型 (章节正文生成)
                </label>
                 <div className="w-full p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
                    <p className="text-slate-200 font-semibold">gemini-2.5-pro (高质量)</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">为保证最佳创作效果，正文写作已固定使用高质量模型。</p>
            </div>
             <div>
                 <label htmlFor="author-style" className="block text-sm font-medium text-slate-300 mb-2">
                    仿写风格 (Author Style)
                </label>
                <select
                    id="author-style"
                    value={options.authorStyle}
                    onChange={e => handleOptionChange('authorStyle', e.target.value as AuthorStyle)}
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
                           <span className="font-bold text-sky-300">{options.temperature.toFixed(1)}</span>
                        </label>
                         <input
                            id="temperature"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={options.temperature}
                            onChange={e => handleOptionChange('temperature', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">值越低，写作风格越稳定、保守；值越高，越可能出现意想不到的创意。</p>
                    </div>
                     <div>
                        <label htmlFor="diversity" className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                           <span>词汇多样性 (Vocabulary Diversity)</span>
                           <span className="font-bold text-sky-300">{options.diversity.toFixed(1)}</span>
                        </label>
                         <input
                            id="diversity"
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={options.diversity}
                            onChange={e => handleOptionChange('diversity', parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">值越高，AI越会选择更多样、不常见的词汇；值越低，用词越稳定、保守。 (底层控制TopP)</p>
                    </div>
                    <div>
                        <label htmlFor="top-k" className="flex justify-between text-sm font-medium text-slate-300 mb-2">
                           <span>词汇选择范围 (Top-K)</span>
                           <span className="font-bold text-sky-300">{options.topK}</span>
                        </label>
                         <input
                            id="top-k"
                            type="range"
                            min="1"
                            max="512"
                            step="1"
                            value={options.topK}
                            onChange={e => handleOptionChange('topK', parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">控制AI在生成每个词时考虑的候选词数量。值越高，选择范围越广，可能更具创意。</p>
                    </div>
                    <div>
                        <label htmlFor="forbidden-words" className="block text-sm font-medium text-slate-300 mb-2">
                           违禁词库 (Forbidden Lexicon)
                        </label>
                        <textarea
                            id="forbidden-words"
                            value={options.forbiddenWords.join(', ')}
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
              onClick={onClose}
              className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-lg"
            >
              完成
            </button>
          </div>
      </div>
    </div>
  );
};

export default SettingsModal;
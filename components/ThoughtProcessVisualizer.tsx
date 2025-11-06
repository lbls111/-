import React from 'react';
import SendIcon from './icons/SendIcon';

interface ThoughtProcessVisualizerProps {
  text: string;
  refineCallback?: (textToRefine: string) => void;
}

interface ThoughtStepNode {
  title: string;
  content: string;
  color: string;
  icon: string;
}

const ThoughtProcessVisualizer: React.FC<ThoughtProcessVisualizerProps> = ({ text, refineCallback }) => {
  if (!text) return null;

  const sections = text.split(/####\s(.*?)\n/g).slice(1);
  const steps: ThoughtStepNode[] = [];
  for (let i = 0; i < sections.length; i += 2) {
    if (sections[i] && sections[i+1]) {
      const title = sections[i].trim();
      let color = 'text-slate-300 border-slate-600';
      let icon = '🤔';
      if (title.includes('用户要求')) { color = 'text-cyan-300 border-cyan-700'; icon = '📝'; }
      if (title.includes('你的理解')) { color = 'text-sky-300 border-sky-700'; icon = '💡'; }
      if (title.includes('质疑你的理解')) { color = 'text-amber-300 border-amber-700'; icon = '❓'; }
      if (title.includes('思考你的理解')) { color = 'text-green-300 border-green-700'; icon = '✅'; }
      steps.push({ title, content: sections[i+1].trim(), color, icon });
    }
  }

  if (steps.length === 0) {
     return <div className="p-3 bg-slate-800/30 rounded-lg text-sm text-slate-400 whitespace-pre-wrap">{text}</div>;
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={`p-4 rounded-lg bg-slate-900/40 border-l-4 ${step.color}`}>
            <h5 className={`font-semibold flex items-center text-base mb-2`}>
              <span className="text-xl mr-3">{step.icon}</span>
              {step.title}
            </h5>
            <p className="text-slate-300 whitespace-pre-wrap pl-8 text-sm leading-relaxed">{step.content}</p>
            {step.title.includes('质疑你的理解') && refineCallback && (
              <div className="pl-8 mt-3">
                <button 
                  onClick={() => refineCallback(step.content)}
                  className="flex items-center gap-x-2 px-3 py-1.5 text-xs rounded-md bg-amber-600/50 hover:bg-amber-600/80 text-amber-200 transition-colors"
                >
                  <SendIcon className="w-3.5 h-3.5"/>
                  <span>针对此疑点进行优化</span>
                </button>
              </div>
            )}
          </div>
          {index < steps.length - 1 && (
            <div className="flex justify-center">
              <div className="w-px h-6 bg-slate-700"></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ThoughtProcessVisualizer;
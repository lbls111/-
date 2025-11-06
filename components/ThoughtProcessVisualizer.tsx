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

  // This regex is designed to capture both the main stages and the sub-steps
  const sections = text.split(/(####\s.*?|^\*\s*\*\*.*?)\n/gm).filter(s => s.trim() !== '');
  const steps: any[] = [];
  
  let currentStage: any = null;

  for (let i = 0; i < sections.length; i++) {
    const line = sections[i].trim();
    if (line.startsWith('####')) { // Main stage
      if (currentStage) {
        steps.push(currentStage);
      }
      const title = line.replace('####', '').trim();
      let color = 'text-slate-300 border-slate-600';
      if (title.includes('潜力') || title.includes('定位')) color = 'text-cyan-300 border-cyan-700';
      if (title.includes('元素融合')) color = 'text-sky-300 border-sky-700';
      if (title.includes('世界观')) color = 'text-purple-300 border-purple-700';
      if (title.includes('剧情梗概')) color = 'text-amber-300 border-amber-700';
      if (title.includes('角色生态')) color = 'text-green-300 border-green-700';

      currentStage = { title, color, subSteps: [] };
    } else if (line.startsWith('* **')) { // Sub-step
       const titleMatch = line.match(/\*\s*\*\*(.*?)\*\*/);
       const title = titleMatch ? titleMatch[1] : '思考';
       const content = sections[i+1] ? sections[i+1].trim() : '';

       let icon = '🤔';
       if (title.includes('质疑')) { icon = '❓'; }
       else if (title.includes('反思') || title.includes('升华')) { icon = '💡'; }
       
       if(currentStage) {
            currentStage.subSteps.push({ title, content, icon });
       }
       i++; // Increment to skip the content part we just processed
    }
  }
  if (currentStage) {
    steps.push(currentStage);
  }


  if (steps.length === 0) {
     return <div className="p-3 bg-slate-800/30 rounded-lg text-sm text-slate-400 whitespace-pre-wrap">{text}</div>;
  }

  return (
    <div className="space-y-4">
      {steps.map((stage, index) => (
        <div key={index} className={`p-4 rounded-lg bg-slate-900/40 border-l-4 ${stage.color}`}>
          <h4 className={`font-bold text-lg mb-3 ${stage.color}`}>{stage.title}</h4>
          <div className="space-y-3 pl-4 border-l-2 border-slate-700/50">
             {stage.subSteps.map((step: any, subIndex: number) => (
                <div key={subIndex} className="relative pl-8">
                     <div className="absolute left-0 top-1 text-xl">{step.icon}</div>
                     <h5 className="font-semibold text-slate-200">{step.title}</h5>
                     <p className="text-slate-400 whitespace-pre-wrap text-sm leading-relaxed">{step.content}</p>
                     {step.title.includes('质疑') && refineCallback && (
                        <div className="mt-2">
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
             ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThoughtProcessVisualizer;

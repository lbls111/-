import React from 'react';
import SendIcon from './icons/SendIcon';

interface ThoughtProcessVisualizerProps {
  text: string;
  refineCallback?: (textToRefine: string) => void;
}

interface SubStep {
    title: string;
    content: string;
    icon: string;
}

interface Stage {
    title: string;
    color: string;
    subSteps: SubStep[];
}

const ThoughtProcessVisualizer: React.FC<ThoughtProcessVisualizerProps> = ({ text, refineCallback }) => {
  if (!text) return null;

  const parseTextToSteps = (inputText: string): Stage[] => {
    const stages: Stage[] = [];
    // Split the text into main stages using the '####' delimiter
    const stageBlocks = inputText.split(/\n(?=####\s)/).filter(block => block.trim() !== '');

    stageBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        const stageTitleLine = lines.shift() || '';
        const stageTitle = stageTitleLine.replace('####', '').trim();
        
        let color = 'text-slate-300 border-slate-600';
        if (stageTitle.includes('潜力') || stageTitle.includes('定位')) color = 'text-cyan-300 border-cyan-700';
        if (stageTitle.includes('元素融合')) color = 'text-sky-300 border-sky-700';
        if (stageTitle.includes('世界观')) color = 'text-purple-300 border-purple-700';
        if (stageTitle.includes('剧情梗概')) color = 'text-amber-300 border-amber-700';
        if (stageTitle.includes('角色生态')) color = 'text-green-300 border-green-700';

        const stage: Stage = { title: stageTitle, color, subSteps: [] };

        const contentStr = lines.join('\n');
        // Split the content of the stage into sub-steps
        const subStepBlocks = contentStr.split(/\n(?=\*\s\*\*)/).filter(subBlock => subBlock.trim() !== '');

        subStepBlocks.forEach(subBlock => {
            const subLines = subBlock.trim().split('\n');
            const titleLine = subLines.shift() || '';
            const titleMatch = titleLine.match(/\*\s*\*\*(.*?)\*\*/);
            const title = titleMatch ? titleMatch[1] : '思考';
            const content = subLines.join('\n').trim();

            let icon = '🤔';
            if (title.includes('质疑')) { icon = '❓'; }
            else if (title.includes('反思') || title.includes('升华')) { icon = '💡'; }
            
            stage.subSteps.push({ title, content, icon });
        });
        
        stages.push(stage);
    });

    return stages;
  };

  const steps = parseTextToSteps(text);

  if (steps.length === 0) {
     return <div className="p-3 bg-slate-800/30 rounded-lg text-sm text-slate-400 whitespace-pre-wrap">{text}</div>;
  }

  return (
    <div className="space-y-4">
      {steps.map((stage, index) => (
        <div key={index} className={`p-4 rounded-lg bg-slate-900/40 border-l-4 ${stage.color}`}>
          <h4 className={`font-bold text-lg mb-3 ${stage.color.replace('border-', 'text-')}`}>{stage.title}</h4>
          <div className="space-y-3 pl-4 border-l-2 border-slate-700/50">
             {stage.subSteps.map((step, subIndex) => (
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
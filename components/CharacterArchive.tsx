
import React from 'react';
import type { CharacterProfile } from '../types';

interface CharacterArchiveProps {
  characters: CharacterProfile[];
}

const CharacterField: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  value ? (
    <div className="py-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-slate-200 whitespace-pre-wrap">{value}</p>
    </div>
  ) : null
);


const CharacterArchive: React.FC<CharacterArchiveProps> = ({ characters }) => {
  if (!characters || characters.length === 0) {
    return <div className="p-6 text-center text-slate-400">角色档案为空。AI代理可能未能成功生成角色信息。</div>;
  }

  return (
    <div className="space-y-4 p-1">
      {characters.map((char, index) => (
        <details key={index} className="glass-card rounded-lg overflow-hidden transition-all duration-300" open={char.role === '核心'}>
          <summary className="p-4 cursor-pointer flex justify-between items-center bg-slate-900/50 hover:bg-slate-800/50">
            <div>
                <h3 className="text-xl font-bold text-sky-300">{char.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{char.coreConcept}</p>
            </div>
            <span className="text-xs flex-shrink-0 font-mono bg-slate-700/50 text-amber-300 px-2 py-1 rounded-full">{char.role}</span>
          </summary>
          <div className="p-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 bg-slate-900/20">
              <div className="lg:col-span-3"><CharacterField label="物理特征 (Observable)" value={char.physicalAppearance} /></div>
              <div className="md:col-span-1"><CharacterField label="行为怪癖 (Quirks)" value={char.behavioralQuirks} /></div>
              <div className="md:col-span-2"><CharacterField label="语言模式 (Speech)" value={char.speechPattern} /></div>
              
              <div className="col-span-full mt-2 pt-2 border-t border-slate-700/50">
                <CharacterField label="标志性物品 (Object)" value={char.definingObject} />
              </div>
               <div className="col-span-full">
                <CharacterField label="起源片段 (Origin Event)" value={char.originFragment} />
              </div>
               <div className="col-span-full">
                <CharacterField label="隐秘负担 (Burden)" value={char.hiddenBurden} />
              </div>

              <div className="mt-2 pt-2 border-t border-slate-700/50"><CharacterField label="即时目标 (Goal)" value={char.immediateGoal} /></div>
              <div className="mt-2 pt-2 border-t border-slate-700/50"><CharacterField label="长期野心 (Ambition)" value={char.longTermAmbition} /></div>
              <div className="mt-2 pt-2 border-t border-slate-700/50"><CharacterField label="赌注 (Stakes)" value={char.whatTheyRisk} /></div>
              
              <div className="col-span-full mt-2 pt-2 border-t border-slate-700/50">
                 <CharacterField label="关键人际关系 (Relationship)" value={char.keyRelationship} />
              </div>
               <div className="col-span-full">
                 <CharacterField label="主要对手 (Antagonist)" value={char.mainAntagonist} />
              </div>

              <div className="col-span-full mt-2 pt-2 border-t border-slate-700/50">
                <CharacterField label="故事功能 (Function)" value={char.storyFunction} />
              </div>
              <div className="col-span-full">
                 <CharacterField label="潜在变化 (Potential Arc)" value={char.potentialChange} />
              </div>
          </div>
        </details>
      ))}
    </div>
  );
};

export default CharacterArchive;

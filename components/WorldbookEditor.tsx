// Fix: Provide placeholder content for WorldbookEditor.tsx to make it a valid module.
import React from 'react';
import type { Worldbook } from '../types';
import NotebookTextIcon from './icons/NotebookTextIcon';

interface WorldbookEditorProps {
  worldbook: Worldbook | null;
  // other props...
}

const WorldbookEditor: React.FC<WorldbookEditorProps> = ({ worldbook }) => {
  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center"><NotebookTextIcon className="w-6 h-6 mr-2" /> Worldbook Editor</h2>
      <p className="text-slate-400">Flesh out the details of your story's world.</p>
      {worldbook ? (
        <textarea className="w-full h-48 p-3 mt-4 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-sky-500 transition resize-none" defaultValue={JSON.stringify(worldbook, null, 2)}></textarea>
      ) : (
         <p className="text-slate-500 mt-4">No worldbook data loaded.</p>
      )}
    </div>
  );
};

export default WorldbookEditor;

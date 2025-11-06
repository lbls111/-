// Fix: Provide placeholder content for OutlineGenerator.tsx to make it a valid module.
import React from 'react';
import type { StoryOptions } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';

interface OutlineGeneratorProps {
  options: StoryOptions;
  // other props...
}

const OutlineGenerator: React.FC<OutlineGeneratorProps> = ({ options }) => {
  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center"><BookOpenIcon className="w-6 h-6 mr-2" /> Outline Generator</h2>
      <p className="text-slate-400">Define your story premise to generate an outline.</p>
      <textarea className="w-full h-24 p-3 mt-4 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-sky-500 transition resize-none" placeholder="Enter your story idea here..."></textarea>
      <button className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-500 transition-colors shadow-md">
        Generate Outline
      </button>
    </div>
  );
};

export default OutlineGenerator;

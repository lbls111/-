// Fix: Provide placeholder content for CharacterArchive.tsx to make it a valid module.
import React from 'react';
import type { Character } from '../types';
import UsersRoundIcon from './icons/UsersRoundIcon';

interface CharacterArchiveProps {
  characters: Character[];
  // other props...
}

const CharacterArchive: React.FC<CharacterArchiveProps> = ({ characters }) => {
  return (
    <div className="glass-card p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4 flex items-center"><UsersRoundIcon className="w-6 h-6 mr-2" /> Character Archive</h2>
      {characters && characters.length > 0 ? (
        <ul>
          {characters.map(char => (
            <li key={char.id}>{char.name}</li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-400">No characters created yet.</p>
      )}
    </div>
  );
};

export default CharacterArchive;

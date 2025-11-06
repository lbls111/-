// Fix: Provide full content for types.ts to define shared types and resolve import errors.
export type AuthorStyle =
  | '默认风格'
  | '爱潜水的乌贼'
  | '辰东'
  | '猫腻'
  | '会说话的肘子'
  | '我吃西红柿'
  | '方想'
  | '孑与2'
  | '卖报小郎君'
  | '宅猪'
  | '神医下山风格'
  | '老鹰吃小鸡'
  | '言归正传'
  | '远瞳'
  | '方千金';

export interface StoryOptions {
  apiBaseUrl: string;
  apiKey: string;
  availableModels: string[];
  searchModel: string;
  planningModel: string;
  writingModel: string;
  authorStyle: AuthorStyle;
  temperature: number;
  diversity: number; // Represents top_p
  topK: number;
  forbiddenWords: string[];
}

export interface LogEntry {
  timestamp: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface OutlineGenerationProgress {
  version: number;
  maxVersions: number;
  message: string;
  score: number;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  // other character details
}

export interface Worldbook {
  setting: string;
  magicSystem?: string;
  factions?: { name: string, description: string }[];
  // other world details
}

export interface OutlineNode {
    title: string;
    description: string;
    children?: OutlineNode[];
}

export type Outline = OutlineNode[];

export interface AITaskContextType {
  isPaused: boolean;
  togglePause: () => void;
  registerController: (controller: AbortController) => void;
  unregisterController: (controller: AbortController) => void;
}

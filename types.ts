// FIX: Removed circular import of GameState from the same file.
export enum GameState {
  INITIAL,
  PLANNING,
  PLANNING_COMPLETE,
  WRITING,
  CHAPTER_COMPLETE,
  GENERATING_CHOICES,
  CHOOSING_PLOT,
  ERROR,
}

export type ActiveTab = 'agent' | 'worldbook' | 'characters' | 'outline' | 'writing';

export type StoryLength = '超短篇(5-10章)' | '短篇(15-30章)' | '中篇(30-100章)' | '长篇(100章以上)';
// FIX: Updated AuthorStyle to use Simplified Chinese characters to match usage in the app.
export type AuthorStyle = '默认风格' | '爱潜水的乌贼' | '辰东' | '猫腻' | '会说话的肘子' | '我吃西红柿' | '方想' | '孑与2' | '卖报小郎君' | '宅猪' | '神医下山风格' | '老鹰吃小鸡' | '言归正传' | '远瞳' | '方千金';

export interface StoryOptions {
    // New Generic API Settings
    apiBaseUrl: string;
    apiKey: string;
    availableModels: string[];
    searchModel: string;
    planningModel: string;
    writingModel: string;
    
    // Original settings
    style: string;
    length: StoryLength;
    authorStyle: AuthorStyle;
    temperature: number; 
    diversity: number; 
    topK: number;
    forbiddenWords: string[]; 
}

export interface CustomField {
  key: string;
  value: string;
}

export interface CharacterProfile {
  role: string;
  name: string;
  coreConcept: string; 
  definingObject: string; 
  physicalAppearance: string; 
  behavioralQuirks: string; 
  speechPattern: string; 
  originFragment: string; 
  hiddenBurden: string; 
  immediateGoal: string; 
  longTermAmbition: string; 
  whatTheyRisk: string; 
  keyRelationship: string; 
  mainAntagonist: string; 
  storyFunction: string; 
  potentialChange: string; 
  customFields?: CustomField[];
}

export interface WritingMethodology {
    icebergNarrative: { description: string; application: string; };
    roughLanguage: { description:string; application:string; };
    actionDrivenPlot: { description: string; application: string; };
    functionalEnvironment: { description: string; application: string; };
    meaningfulAction?: { description: string; application: string; };
    cinematicTransitions: { description: string; application: string; };
}

export interface AntiPatternGuide {
    noInnerMonologue: { description: string; instruction: string; };
    noExposition: { description:string; instruction: string; };
    noMetaphors: { description: string; instruction: string; };
    noCliches: { description: string; instruction: string; };
}

export interface WorldEntry {
  key: string;
  value: string;
}

export interface WorldCategory {
  name: string;
  entries: WorldEntry[];
}

export interface StoryOutline {
  title: string;
  genreAnalysis: string;
  worldConcept: string;
  plotSynopsis: string;
  characters: CharacterProfile[];
  writingMethodology: WritingMethodology;
  antiPatternGuide: AntiPatternGuide;
  worldCategories: WorldCategory[];
  worldEntries?: WorldEntry[]; // For backward compatibility during migration
}

export interface GeneratedChapter {
  id: number;
  title: string;
  content: string;
  status: 'streaming' | 'complete';
  preWritingThought?: string;
}

export interface Citation {
    uri: string;
    title: string;
}

export interface ThoughtStep {
    id: number;
    title: string;
    model: string;
    content: string | null;
    status: 'pending' | 'running' | 'complete' | 'error';
    citations?: Citation[];
}

export interface NextPlotChoice {
    summary: string;
    justification: string;
}

// Types for the new structured detailed outline
export interface PlotPointAnalysis {
  summary: string;
  emotionalCurve: string;
  maslowsNeeds: string;
  webNovelElements: string;
  conflictSource: string;
  showDontTell: string;
  dialogueAndSubtext: string;
  logicSolidification: string;
  emotionAndInteraction: string;
  pacingControl: string;
  worldviewReveal: string;
}

export interface NextChapterPreview {
  nextOutlineIdea: string;
  characterNeeds: string;
}

export interface DetailedOutlineAnalysis {
  plotPoints: PlotPointAnalysis[];
  nextChapterPreview: NextChapterPreview;
}

// New types for the iterative critique framework
export interface ScoringDimension {
  dimension: string;
  score: number;
  reason: string;
}

export interface ImprovementSuggestion {
  area: string;
  suggestion: string;
}

export interface OutlineCritique {
  thoughtProcess?: string;
  overallScore: number;
  scoringBreakdown: ScoringDimension[];
  improvementSuggestions: ImprovementSuggestion[];
}

// An entry for one round of optimization
export interface OptimizationHistoryEntry {
  version: number;
  critique: OutlineCritique;
  outline: DetailedOutlineAnalysis; // Store the parsed outline for easier display
}

// The new top-level type for the final detailed outline, which includes the history
export interface FinalDetailedOutline extends DetailedOutlineAnalysis {
  finalVersion: number;
  optimizationHistory: OptimizationHistoryEntry[];
}

// FIX: Added missing OutlineGenerationProgress type.
export interface OutlineGenerationProgress {
  status: 'refining' | 'critiquing' | 'error';
  version: number;
  maxVersions: number;
  score: number;
  message: string;
}

// New type for the logging system
export interface LogEntry {
  timestamp: string;
  type: 'error' | 'info' | 'success';
  message: string;
}
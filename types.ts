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

export type ActiveTab = 'agent' | 'worldbook' | 'characters' | 'writing';

export type StoryModel = 'gemini-2.5-pro' | 'gemini-2.5-flash';
export type StoryLength = '短篇(约5-10章)' | '中篇(约11-30章)' | '长篇(30章以上)';
export type AuthorStyle = '默认风格' | '爱潜水的乌贼' | '辰东' | '猫腻' | '会说话的肘子' | '我吃西红柿' | '方想' | '孑与2' | '卖报小郎君' | '宅猪' | '神医下山风格' | '老鹰吃小鸡' | '言归正传' | '远瞳';

export interface StoryOptions {
    writingModel: StoryModel;
    style: string;
    length: StoryLength;
    authorStyle: AuthorStyle;
    temperature: number; 
    diversity: number; 
    topK: number;
    forbiddenWords: string[]; 
}

export interface CharacterProfile {
  role: '核心' | '次要' | '龙套';
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

export interface StoryOutline {
  title: string;
  genreAnalysis: string;
  worldConcept: string;
  plotSynopsis: string;
  characters: CharacterProfile[];
  writingMethodology: WritingMethodology;
  antiPatternGuide: AntiPatternGuide;
}

export interface GeneratedChapter {
  id: number;
  title: string;
  content: string;
  status: 'streaming' | 'complete';
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

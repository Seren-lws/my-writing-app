export type Book = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Chapter = {
  id: string;
  bookId: string;
  title: string;
  content: string;
  outline: string;
  aiInstruction: string;
  createdAt: string;
  updatedAt: string;
};

export type WritingDNA = {
  languageStyle: string;
  writingPrefs: string;
  taboos: string;
  references: string;
  dynamics: string;
};

export type SoulCard = {
  bookId: string;
  tone: string;
  dynamics: string;
  worldbuilding: string;
  redlines: string;
  keywords: string;
  aiReminders: string;
};

export type ModelSettings = {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
  modelsText: string;
};

export type Inspiration = {
  id: string;
  content: string;
  createdAt: string;
};

export type Character = {
  id: string;
  bookId: string;
  name: string;
  alias: string;
  age: string;
  gender: string;
  role: string;
  appearance: string;
  personality: string;
  personalityOrigin: string;
  background: string;
  relationships: string;
  speechPattern: string;
  aiNotes: string;
  createdAt: string;
};

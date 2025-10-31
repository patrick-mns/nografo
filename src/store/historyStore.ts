import { create } from 'zustand';
import type { Node, Edge } from './graphStore';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

interface HistoryStore {
  past: HistoryState[];
  future: HistoryState[];
  maxHistorySize: number;

  pushState: (nodes: Node[], edges: Edge[]) => void;
  undo: () => HistoryState | null;
  redo: () => HistoryState | null;
  clear: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setMaxHistorySize: (size: number) => void;
}

const DEFAULT_MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  maxHistorySize: DEFAULT_MAX_HISTORY,

  pushState: (nodes: Node[], edges: Edge[]) => {
    const state = get();

    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: Date.now(),
    };

    const newPast = [...state.past, newState];

    if (newPast.length > state.maxHistorySize) {
      newPast.shift();
    }

    set({
      past: newPast,
      future: [],
    });
  },

  undo: () => {
    const state = get();

    if (state.past.length === 0) {
      return null;
    }

    const newPast = [...state.past];
    const stateToRestore = newPast.pop()!;

    set({
      past: newPast,
      future: [...state.future, stateToRestore],
    });

    return stateToRestore;
  },

  redo: () => {
    const state = get();

    if (state.future.length === 0) {
      return null;
    }

    const newFuture = [...state.future];
    const stateToRestore = newFuture.pop()!;

    set({
      past: [...state.past, stateToRestore],
      future: newFuture,
    });

    return stateToRestore;
  },

  clear: () => {
    set({
      past: [],
      future: [],
    });
  },

  canUndo: () => {
    return get().past.length > 0;
  },

  canRedo: () => {
    return get().future.length > 0;
  },

  setMaxHistorySize: (size: number) => {
    const state = get();
    const newPast = [...state.past];

    while (newPast.length > size) {
      newPast.shift();
    }

    set({
      maxHistorySize: size,
      past: newPast,
    });
  },
}));

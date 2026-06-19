import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useDSASessionStore = create(
  persist(
    (set, get) => ({
      isActive: false,
      startedAt: null,
      problemsAttempted: 0,
      problemsSolved: 0,
      topicsFocused: [],

      startSession: () => set({
        isActive: true,
        startedAt: Date.now(),
        problemsAttempted: 0,
        problemsSolved: 0,
        topicsFocused: []
      }),

      logAttempt: () => set((state) => ({
        problemsAttempted: state.problemsAttempted + 1
      })),

      logSolve: (topic) => set((state) => {
        const topics = new Set(state.topicsFocused);
        if (topic) topics.add(topic);
        return {
          problemsSolved: state.problemsSolved + 1,
          topicsFocused: Array.from(topics)
        };
      }),

      endSession: () => {
        const state = get();
        set({
          isActive: false,
          startedAt: null,
          problemsAttempted: 0,
          problemsSolved: 0,
          topicsFocused: []
        });
        return state; // return previous state so we can log it to backend
      }
    }),
    {
      name: 'dsa-study-session' // name of item in storage (must be unique)
    }
  )
);

export default useDSASessionStore;

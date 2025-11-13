
import { GradingCriteria, StudentSubmission } from '../types';

const STORAGE_KEY = 'gemini-auto-grader-state';

export interface AppState {
  gradingCriteria: GradingCriteria | null;
  studentSubmissions: StudentSubmission[];
}

/**
 * Saves the entire application state to localStorage.
 * @param state - The current state of the application.
 */
export const saveState = (state: AppState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error("Could not save state to local storage:", error);
  }
};

/**
 * Loads the application state from localStorage.
 * @returns The persisted application state, or null if nothing is stored or an error occurs.
 */
export const loadState = (): AppState | null => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error("Could not load state from local storage:", error);
    return null;
  }
};

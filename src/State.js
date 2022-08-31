import { Puzzle } from "./Puzzle.js";
export { State };


// Shareable object between modules for keeping track of UI state
const state = {};

class State {
    constructor() {
        state.playMode = false;
        state.solutionAnimating = false;
        state.editingGoalPuzzle = false;
        state.startingPuzzle = null; // Only used if user edits the goal state
        state.goalPuzzle = new Puzzle(3, 3, false);
        state.puzzleRows = 0;
        state.puzzleCols = 0;
        state.imageObjectURL = null; // For uploaded images
    }

    static get() {
        return state;
    }
}
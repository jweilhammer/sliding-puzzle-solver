import { Puzzle } from "./Puzzle.js";

// Shareable Singleton object between modules for keeping track of UI state
const state = {};

class State {
    constructor() {
        // User is in play mode, where swapping tiles must follow sliding puzzle rules
        state.playMode = false;

        // Solution is currently animating
        state.solutionAnimating = false;

        // Status of start or goal being edited, only one should be true at a time
        state.editingGoalPuzzle = false;
        state.editingStartPuzzle = false;

        // Only used to reset grid if user edits the goal state
        state.startingPuzzle = null; 

        // Goal state where the starting puzzle should be solved to
        state.goalPuzzle = new Puzzle(3, 3, false);

        // Mapping HTML puzzle grid to matrix of elements
        // Each element is a tile
        state.grid = [[]];

        // Current Puzzle dimensions for both start and goal
        state.puzzleRows = 0;
        state.puzzleCols = 0;

        // When swapping tiles, the currently selected tile by clicking or dragging
        state.dragSourceTile = null;
        state.clickSourceTile = null;

        // Keeping track of locally uploaded image
        state.imageObjectURL = null;

        // Background CSS image state, need to keep track for when updating tile background positions
        state.backgroundVerticallyFlipped = false;
        state.backgroundHorizontallyFlipped = false;
    }

    static get() {
        return state;
    }
}


export { State };
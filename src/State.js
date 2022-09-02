import { Puzzle } from "./Puzzle.js";

// Shareable Singleton object between modules for keeping track of UI state
const state = {

    // User is in play mode, where swapping tiles must follow sliding puzzle rules
    playMode: false,

    // Solution is currently animating
    solutionAnimating: false,

    // Status of start or goal being edited, only one should be true at a time
    editingGoalPuzzle: false,
    editingStartPuzzle: false,

    // Only used to reset grid if user edits the goal state
    startingPuzzle: null, 

    // Goal state where the starting puzzle should be solved to
    goalPuzzle: new Puzzle(3, 3, false),

    // Mapping HTML puzzle grid to matrix of elements
    // Each element is a tile
    grid: [[]],

    // Current Puzzle dimensions for both start and goal
    puzzleRows: 0,
    puzzleCols: 0,

    // When swapping tiles, the currently selected tile by clicking or dragging
    dragSourceTile: null,
    clickSourceTile: null,

    // Keeping track of locally uploaded image
    imageObjectURL: null,

    // Background CSS image state, need to keep track for when updating tile background positions
    backgroundVerticallyFlipped: false,
    backgroundHorizontallyFlipped: false,
};  

export { state };
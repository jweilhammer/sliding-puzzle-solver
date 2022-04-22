const Puzzle = require("./Puzzle");

let puzzle = new Puzzle(3);
puzzle.printPuzzle();

const goal_state = [ [1, 2, 3], 
                    [4, 5, 6],
                    [7, 8, 0] ];
const solvePuzzle = (puzzle) => {
    console.log(puzzle.matrix);
    console.log(puzzle.blank_row, puzzle.blank_col);

    puzzle.slideUp();
    puzzle.printPuzzle();
    
    puzzle.slideRight();
    puzzle.printPuzzle();

    puzzle.slideDown();
    puzzle.printPuzzle();

    puzzle.slideLeft();
    puzzle.printPuzzle();

    console.log(puzzle.isInGoalState(goal_state));
}


solvePuzzle(puzzle);

const Puzzle = require("./Puzzle");

let puzzle = new Puzzle(3);
puzzle.printPuzzle();

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

}


solvePuzzle(puzzle);

const Puzzle = require("./Puzzle");

// TODO: Make this a static variable, didn't seem to be working with nodejs...    
const slideDirections = {
    "INITIAL": 0,
    "UP": 1,
    "DOWN": 2,
    "LEFT": 3,
    "RIGHT": 4,
}

const solvePuzzle = (puzzle) => {
    const queue = [];
    const closedList = []; // Previously visited states
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {

        // curPuzzle.printPuzzle();
        
        // Gen all possible states from current puzzle state
        if (curPuzzle.canSlideUp() && curPuzzle.lastSlideDirection != slideDirections["UP"]) {
            let newPuzzle = Puzzle.fromPuzzle(curPuzzle);
            newPuzzle.slideUp();
            newPuzzle.lastSlideDirection = slideDirections["UP"];
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(newPuzzle))) {
                queue.push(newPuzzle);            
            }
        }

        if (curPuzzle.canSlideDown() && curPuzzle.lastSlideDirection != slideDirections["DOWN"]) {
            let newPuzzle = Puzzle.fromPuzzle(curPuzzle);
            newPuzzle.slideDown();
            newPuzzle.lastSlideDirection = slideDirections["DOWN"];
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(newPuzzle))) {
                queue.push(newPuzzle);            
            }          
        }

        if (curPuzzle.canSlideLeft() && curPuzzle.lastSlideDirection != slideDirections["LEFT"]) {
            let newPuzzle = Puzzle.fromPuzzle(curPuzzle);
            newPuzzle.slideLeft();
            newPuzzle.lastSlideDirection = slideDirections["LEFT"];
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(newPuzzle))) {
                queue.push(newPuzzle);            
            }         
        }

        if (curPuzzle.canSlideRight() && curPuzzle.lastSlideDirection != slideDirections["RIGHT"]) {
            let newPuzzle = Puzzle.fromPuzzle(curPuzzle);
            newPuzzle.slideRight();
            newPuzzle.lastSlideDirection = slideDirections["RIGHT"];
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(newPuzzle))) {
                queue.push(newPuzzle);            
            } 
        }

        
        closedList.push(curPuzzle);
        curPuzzle = queue.shift();
        console.log("QUEUE:", queue.length, " CLOSED_LIST:", closedList.length);
    }

    curPuzzle.printPuzzle();
}


const goal_state = [ [1, 2, 3], 
                    [4, 5, 6],
                    [7, 8, 0] ];
let puzzle = new Puzzle();

puzzle.printPuzzle();
console.log(puzzle.blank_row, puzzle.blank_col);

puzzle.slideUp();
puzzle.slideUp();
puzzle.slideUp();
puzzle.printPuzzle();

puzzle.slideRight();
puzzle.slideRight();
puzzle.slideRight();
puzzle.printPuzzle();

puzzle.slideDown();
puzzle.slideDown();
puzzle.slideDown();
puzzle.printPuzzle();

puzzle.slideLeft();
puzzle.slideLeft();
puzzle.slideLeft();
puzzle.printPuzzle();

// console.log(puzzle.isInGoalState(goal_state));


closed_list = [];
closed_list.push(puzzle);

let puzzle2 = Puzzle.fromPuzzle(puzzle);
puzzle.printPuzzle();
puzzle2.printPuzzle();
console.log(puzzle.isEqualToPuzzle(puzzle2))
console.log(!closed_list.find(puzzle => puzzle.isEqualToPuzzle(puzzle2)))
puzzle2.matrix[0][0].value=500000;
puzzle.printPuzzle();
puzzle2.printPuzzle();
console.log(puzzle.isEqualToPuzzle(puzzle2))
console.log(!closed_list.find(puzzle => puzzle.isEqualToPuzzle(puzzle2)))


puzzle = Puzzle.fromMatrix(goal_state);
puzzle.slideUp();
puzzle.slideUp();
puzzle.slideLeft();
puzzle.slideLeft();
puzzle.slideDown();
puzzle.printPuzzle();
console.log(puzzle.isInGoalState(goal_state))
solvePuzzle(puzzle);

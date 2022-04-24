const Puzzle = require("./Puzzle");
const PriorityQueue = require("./PriorityQueue");

// TODO: Make this a static variable, didn't seem to be working with nodejs...    
const slideDirections = {
    "INITIAL": 0,
    "UP": 1,
    "DOWN": 2,
    "LEFT": 3,
    "RIGHT": 4,
}

// Breadth first search
const solvePuzzleBFS = (puzzle, goal_state) => {
    puzzle.printPuzzle();
    const openList = [];   // Un-explored states
    const closedList = []; // Previously visited states
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {
        neighboringPuzzleStates = curPuzzle.generateNeighbors();
        for(neighbor of neighboringPuzzleStates) {
            // Only explore new states, if we've already explored then don't add to open list
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(neighbor))) {
                openList.push(neighbor);            
            }
        }

        closedList.push(curPuzzle);
        curPuzzle = openList.shift();
        console.log("QUEUE:", openList.length, " CLOSED_LIST:", closedList.length);
    }

    curPuzzle.printPuzzle();
}

const solvePuzzleAStar = (puzzle, goal_state) => {
    puzzle.printPuzzle();
    const openList = new PriorityQueue();   // Un-explored states as a priority queue
    const closedList = []; // Previously visited states
    const goal_mapping = Puzzle.getGoalMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    let curPuzzle = puzzle;
    curPuzzle.updateManhattanSum(goal_mapping);
    while (curPuzzle.manhattanSum !== 0) {
        neighboringPuzzleStates = curPuzzle.generateNeighbors(goal_mapping);
        for(neighbor of neighboringPuzzleStates) {
            // Only explore new states, if we've already explored then don't add to open list
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(neighbor))) {
                openList.enqueue(neighbor, neighbor.manhattanSum);         
            }
        }

        closedList.push(curPuzzle);
        curPuzzle = openList.dequeue();
        console.log("QUEUE:", openList.items.length, " CLOSED_LIST:", closedList.length);
    }

    curPuzzle.printPuzzle();
}

const SOLVED = 0;
const NOT_SOLVED = -1;

// https://en.wikipedia.org/wiki/Iterative_deepening_A*#Pseudocode
const solvePuzzleIDAStar = (puzzle, goal_state) => {
    const goal_mapping = Puzzle.getGoalMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    let curPuzzle = puzzle;
    curPuzzle.updateManhattanSum(goal_mapping);
    let threshold = curPuzzle.manhattanSum;
    const solutionPath = [curPuzzle] // Stack of Puzzles up to our current state
    while (curPuzzle.manhattanSum !== 0) {
        newThreshold = iterativeDeepeningSearch(solutionPath, 0, threshold, goal_mapping);
        threshold = newThreshold;
        curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    }

    curPuzzle.printPuzzle()
}

const iterativeDeepeningSearch = (solutionPath, costToCurPuzzle, boundingThreshold, goal_mapping) => {
    curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    costToSolution = costToCurPuzzle + curPuzzle.manhattanSum
    if (costToSolution > boundingThreshold) {
        return costToSolution;
    }

    if (curPuzzle.manhattanSum === 0) {
        return SOLVED;
    }

    minThreshold = Infinity;
    for (neighbor of curPuzzle.generateNeighbors(goal_mapping)) {
        // Only explore new states, if we've already explored then don't add to our solution path again
        if (!solutionPath.find(puzzle => puzzle.isEqualToPuzzle(neighbor))) {
            solutionPath.push(neighbor);
            console.log("SOLUTION_PATH:", solutionPath.length);
            threshold = iterativeDeepeningSearch(solutionPath, costToCurPuzzle + 1, boundingThreshold, goal_mapping);
            if (threshold == SOLVED) return threshold;
            if (threshold < minThreshold) minThreshold = threshold;
            solutionPath.pop();
        }
    }

    return minThreshold;
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


// Make a reasonably solvable puzzle
puzzle = Puzzle.fromMatrix(goal_state);
puzzle.slideUp();
puzzle.slideUp();
puzzle.slideLeft();
puzzle.slideLeft();
puzzle.slideDown();
puzzle.slideRight();
puzzle.slideDown();
puzzle.slideLeft();
puzzle.slideUp();
puzzle.slideRight();
puzzle.slideUp();
puzzle.slideLeft();
puzzle.slideDown();
puzzle.printPuzzle();
console.log(puzzle.isInGoalState(goal_state))

// puzzle = new Puzzle(); // Does not work with BFS as search space gets too large
solvePuzzleBFS(puzzle, goal_state);
solvePuzzleAStar(puzzle, goal_state);
solvePuzzleIDAStar(puzzle, goal_state);
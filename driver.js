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

const slideDirectionsInv = {
    "0": "INITIAL",
    "1": "UP",
    "2": "DOWN",
    "3": "LEFT",
    "4": "RIGHT",
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
        console.log("QUEUE:", openList.length, " CLOSED_LIST:", closedList.length);
        curPuzzle = openList.shift();
    }

    // curPuzzle.printPuzzle();
    return curPuzzle;
}

























const solvePuzzleAStar = (puzzle, goal_state) => {
    puzzle.printPuzzle();

    const openList = new PriorityQueue();   // Un-explored states as a priority queue
    const closedList = []; // Previously visited states
    const goal_mapping = Puzzle.getGoalMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    puzzle.updateManhattanSum(goal_mapping);
    openList.enqueue(puzzle, puzzle.manhattanSum);
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {
        const neighboringPuzzleStates = curPuzzle.generateNeighbors(goal_mapping);
        const costToNeighbor = curPuzzle.costFromStart + 1;
        for(neighbor of neighboringPuzzleStates) {
            const closeNeighborIndex = closedList.findIndex(puzzle => puzzle.isEqualToPuzzle(neighbor));
            // If on the closed list, check if we found a better way
            if (closeNeighborIndex !== -1) {
                const closedPuzzle = closedList[closeNeighborIndex];
                console.log("ON CLOSED LIST", closedPuzzle.manhattanSum + closedPuzzle.costFromStart, neighbor.manhattanSum + neighbor.costFromStart);
                if (closedPuzzle.costFromStart > costToNeighbor) {
                    console.log("\n\n\n\n\n\n\n\n\n\n\n\nFUCK YOU E ROBERTS");
                    console.log("FOUND A BETTER PATH", closedPuzzle.costFromStart, costToNeighbor);
                    closedList.splice(closeNeighborIndex, 1);
                    closedPuzzle.cameFrom = curPuzzle;
                    closedPuzzle.costFromStart = costToNeighbor;
                    openList.enqueue(closedPuzzle, closedPuzzle.manhattanSum + closedPuzzle.costFromStart)
                }
            }

            // If on the open list, check if we found a better way
            const openNeighorIndex = openList.items.findIndex(puzzle => puzzle.element.isEqualToPuzzle(neighbor));
            if (openNeighorIndex !== -1) {
                const puzzleToMaybeUpdate = openList.items[openNeighorIndex];
                if (puzzleToMaybeUpdate.element.costFromStart > costToNeighbor) {
                    console.log("FOUND A BETTER PATH", puzzleToMaybeUpdate.element.costFromStart, costToNeighbor);
                    let removed = openList.items.splice(openNeighorIndex, 1)[0]; // remove from queue to resort with new cost
                    neighbor.cameFrom = curPuzzle;
                    neighbor.updateManhattanSum(goal_mapping);
                    neighbor.costFromStart = costToNeighbor;
                    console.log("RE_EQUEUING NEIGHBER WITH INTIAL", removed.element.manhattanSum, removed.element.costFromStart, " TO", neighbor.manhattanSum, neighbor.costFromStart);
                    openList.enqueue(neighbor, neighbor.manhattanSum + neighbor.costFromStart);
                }
            } else {
                // Add to open list for further exploration
                neighbor.cameFrom = curPuzzle;
                neighbor.updateManhattanSum(goal_mapping);
                neighbor.costFromStart = costToNeighbor;
                console.log("ENQUEING MANHATTAN SUM OF ", neighbor.manhattanSum)
                openList.enqueue(neighbor, neighbor.manhattanSum + neighbor.costFromStart);   
            }
            
        }

        closedList.push(curPuzzle);
        curPuzzle = openList.dequeue();
        // console.log("QUEUE:", openList.items.length, " CLOSED_LIST:", closedList.length);
    }

    // curPuzzle.printPuzzle();
    return curPuzzle;
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
        // console.log("SOLUTION_PATH:", solutionPath.length, " BOUNDING_THRESHOLD:", threshold);
        newThreshold = iterativeDeepeningSearch(solutionPath, 0, threshold, goal_mapping);
        threshold = newThreshold;

        if (threshold === Infinity) {
            console.log("unsolvable");
            return;
        }
        curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    }

    // curPuzzle.printPuzzle()
    return curPuzzle;
}

const iterativeDeepeningSearch = (solutionPath, costToCurPuzzle, boundingThreshold, goal_mapping) => {
    curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    costToSolution = costToCurPuzzle + curPuzzle.manhattanSum
    // console.log("COST_TO_CUR_PUZZLE", costToCurPuzzle, " BOUNDING_THRESHOLD:", boundingThreshold);

    if (costToSolution > boundingThreshold) {
        return costToSolution;
    }

    if (curPuzzle.manhattanSum === 0) {
        // console.log("DID I REACH THE GOAL?")
        return SOLVED;
    }

    minThreshold = Infinity;
    for (neighbor of curPuzzle.generateNeighbors(goal_mapping)) {
        solutionPath.push(neighbor);
        // console.log("SOLUTION_PATH:", solutionPath.length);
        threshold = iterativeDeepeningSearch(solutionPath, costToCurPuzzle + 1, boundingThreshold, goal_mapping);
        if (threshold == SOLVED) return threshold;
        if (threshold < minThreshold) minThreshold = threshold;
        solutionPath.pop();
    }

    // console.log("NEW MIN THRESHOLD:", minThreshold)
    return minThreshold;
}

const goal_state = [ [1, 2, 3], 
                    [4, 5, 6],
                    [7, 8, 0] ];
// let puzzle = new Puzzle();

// puzzle.printPuzzle();
// console.log(puzzle.blank_row, puzzle.blank_col);

// puzzle.slideUp();
// puzzle.slideUp();
// puzzle.slideUp();
// puzzle.printPuzzle();

// puzzle.slideRight();
// puzzle.slideRight();
// puzzle.slideRight();
// puzzle.printPuzzle();

// puzzle.slideDown();
// puzzle.slideDown();
// puzzle.slideDown();
// puzzle.printPuzzle();

// puzzle.slideLeft();
// puzzle.slideLeft();
// puzzle.slideLeft();
// puzzle.printPuzzle();

// console.log(puzzle.isInGoalState(goal_state));

// let puzzle2 = Puzzle.fromPuzzle(puzzle);
// puzzle.printPuzzle();
// puzzle2.printPuzzle();
// console.log(puzzle.isEqualToPuzzle(puzzle2))
// console.log(!closed_list.find(puzzle => puzzle.isEqualToPuzzle(puzzle2)))
// puzzle2.matrix[0][0].value=500000;
// puzzle.printPuzzle();
// puzzle2.printPuzzle();
// console.log(puzzle.isEqualToPuzzle(puzzle2))
// console.log(!closed_list.find(puzzle => puzzle.isEqualToPuzzle(puzzle2)))


// Make a reasonably solvable puzzle

let puzzle = Puzzle.fromMatrix([[7, 0, 4],
                            [8, 1, 3],
                            [6, 5, 2]]);

puzzle.printPuzzle();
// cameFrom[puzzle].printPuzzle();
// cameFrom[puzzle2].printPuzzle();























// const bfs = solvePuzzleBFS(puzzle, goal_state);
// console.log("A* SOLUTION:", bfs.movesToState.length);
// let bfsMoves = [];
// bfs.movesToState.forEach(move => {
//     bfsMoves.push(slideDirectionsInv[move])
// });
// console.log(bfsMoves);

const aStarSolution = solvePuzzleAStar(puzzle, goal_state);
let astarMoves = [];
let FUCKYOU = aStarSolution;
while (FUCKYOU) {
    FUCKYOU.printPuzzle();
    astarMoves.push(FUCKYOU.lastSlideDirection);
    FUCKYOU = FUCKYOU.cameFrom;
}

console.log("A* SOLUTION:", astarMoves.length, astarMoves);

// const idastar = solvePuzzleIDAStar(puzzle, goal_state);

// let idastarMoves = [];
// idastar.movesToState.forEach(move => {
//     idastarMoves.push(slideDirectionsInv[move])
// });
// console.log("IDA* SOLUTION:", idastar.movesToState.length);
// console.log(idastarMoves);
// Credit to https://www.geeksforgeeks.org/implementation-priority-queue-javascript/
// Suprised there is not a built in or common library for a sorted queue/min heap in javscript

// User defined class
// to store element and its priority
class QElement {
    constructor(element, priority)
    {
        this.element = element;
        this.priority = priority;
    }
}
 
// PriorityQueue class
class PriorityQueue {
 
    // An array is used to implement priority
    constructor()
    {
        this.items = [];
    }

    // enqueue function to add element
    // to the queue as per priority
    enqueue(element, priority)
    {
            // creating object from queue element
        var qElement = new QElement(element, priority);
        var contain = false;
    
        // iterating through the entire
        // item array to add element at the
        // correct location of the Queue
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].priority > qElement.priority) {
                // Once the correct location is found it is
                // enqueued
                this.items.splice(i, 0, qElement);
                contain = true;
                break;
            }
        }
    
        // if the element have the highest priority
        // it is added at the end of the queue
        if (!contain) {
            this.items.push(qElement);
        }
    }

    // dequeue method to remove
    // element from the queue
    dequeue()
    {
        // return the dequeued element
        // and remove it.
        // if the queue is empty
        // returns Underflow
        if (this.isEmpty())
            return "Underflow";
        return this.items.shift().element;
    }

    
    // front function
    front()
    {
        // returns the highest priority element
        // in the Priority queue without removing it.
        if (this.isEmpty())
            return "No elements in Queue";
        return this.items[0];
    }

    
    // rear function
    rear()
    {
        // returns the lowest priority
        // element of the queue
        if (this.isEmpty())
            return "No elements in Queue";
        return this.items[this.items.length - 1];
    }

    
    // isEmpty function
    isEmpty()
    {
        // return true if the queue is empty.
        return this.items.length == 0;
    }

    
    // printQueue function
    // prints all the element of the queue
    printPQueue()
    {
        var str = "";
        for (var i = 0; i < this.items.length; i++)
            str += this.items[i].element + " ";
        return str;
    }
}


class Tile {
    constructor(value, row, col) {
      this.value = value;
      this.row = row;
      this.col = col;
    }
}

// TODO: Static variable somehow


class Puzzle {
    static goalState = Puzzle.fromMatrix([ [1, 2, 3], 
                                           [4, 5, 6],
                                           [7, 8, 0] ]);

    static slideDirections = {
        "INITIAL": 0,
        "UP": 1,
        "DOWN": 2,
        "LEFT": 3,
        "RIGHT": 4,
    }

    constructor(genRandomPuzzle=true) {
        if (genRandomPuzzle) this.matrix = this.generateRandomPuzzle();
        this.lastSlideDirection = 0;
        this.manhattanSum = 0; // No need to calculate manhatten sum on initial puzzle state
        this.cameFrom = null; // Last puzzle state
        this.costFromStart = 0;
    }

    // Create deep copy of another puzzle
    static fromPuzzle(puzzle) {
        let copy = new this(false);
        copy.matrix = JSON.parse(JSON.stringify(puzzle.matrix));  //  TODO: is something better here needed?  Lodash deepclone faster?
        copy.blank_row = puzzle.blank_row;
        copy.blank_col = puzzle.blank_col;
        copy.manhattanSum = puzzle.manhattanSum;
        copy.costFromStart = puzzle.costFromStart;
        return copy;
    }

    // TODO: Only working for 3x3
    static fromMatrix(matrix) {
        let puzzle = new this(false);
        puzzle.matrix = [[,,,], [,,,], [,,,]]; 
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[0].length; col++) {
                if (!matrix[row][col]) {
                    console.log("BLANK TILE", row, col)
                    puzzle.blank_row = row;
                    puzzle.blank_col = col;
                }
                puzzle.matrix[row][col] = new Tile(matrix[row][col], row, col);
            }
        }

        return puzzle;
    }

    static getBlankTilePosition(puzzle) {
        for (const row of puzzle.matrix) {
            for (const tile of row) {
                if (tile.value === 0) {
                    return [tile.row, tile.col];
                }
            }
        }
    }

    // Gives me a random, solveable puzzle
    generateRandomPuzzle() {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let puzzle_arr = [];
        do {
            puzzle_arr = this.shuffleArray(values);
        } 
        while (!this.isPuzzleSolvable(puzzle_arr));

        // Turn 1D array into our Puzzle Matrix from last to first to use arr.pop()
        let puzzle_matrix = [[,,,], [,,,], [,,,]];
        for (let row = 0; row < puzzle_matrix.length; row++) {
            for (let col = 0; col < puzzle_matrix[row].length; col++) {
                const value = puzzle_arr.shift();
                if (!value) {
                    this.blank_row = row;
                    this.blank_col = col;
                }
                puzzle_matrix[row][col] = new Tile(value, row, col);
            }
        }

        return puzzle_matrix;
    }


    canSlideLeft() {
        // Edge guarding on left side
        if (this.blank_col <= 0) {
            return false;
        } else {
            return true;
        }
    }

    canSlideRight() {
        // Edge guarding on current row
        if (this.blank_col >= this.matrix[this.blank_row].length - 1) {
            return false;
        } else {
            return true;
        }
    }

    canSlideUp() {
        // Edge guarding on left side
        if (this.blank_row <= 0) {
            return false;
        } else {
            return true;
        }
    }

    canSlideDown() {
        // Edge guarding on left side
        if (this.blank_row >= this.matrix.length - 1) {
            return false;
        } else {
            return true;
        }
    }
    

    slideLeft() {
        // Edge guarding on left side
        if (this.blank_col <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row][this.blank_col - 1].value;
        this.matrix[this.blank_row][this.blank_col - 1].value = 0;
        this.blank_col--;
    }


    slideRight() {
        // Edge guarding on current row
        if (this.blank_col >= this.matrix[this.blank_row].length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row][this.blank_col + 1].value;
        this.matrix[this.blank_row][this.blank_col + 1].value = 0;
        this.blank_col++;
    }


    slideUp() {
        // Edge guarding on left side
        if (this.blank_row <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row - 1][this.blank_col].value;
        this.matrix[this.blank_row - 1][this.blank_col].value = 0;
        this.blank_row--;
    }

    slideDown() {
        // Edge guarding on left side
        if (this.blank_row >= this.matrix.length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row + 1][this.blank_col].value;
        this.matrix[this.blank_row + 1][this.blank_col].value = 0;
        this.blank_row++;
    }

    // Updates manhattan sum for this puzzle state.  Takes a goal mapping from Puzzle's goal mapping static method
    updateManhattanSum(goal_mapping) {
        let manhattanSum = 0;
        for(let row of this.matrix) {
            for(let tile of row) {
                if (tile.value) {
                    manhattanSum += ( Math.abs(tile.row - goal_mapping[tile.value.toString()].row) + Math.abs(tile.col - goal_mapping[tile.value.toString()].col) );    
                }
            }
        }

        this.manhattanSum = manhattanSum;
    }

    // Map our goal state's (row, col) for each tile value to quickly find distance in manhattan method without recalcuating the mapping for each state
    // Allows us to not assume a sqaure matrix (NxN) by accounting for NxP goal states
    // {1: {row: 0, col: 0}, ...}
    // TODO: Make goal mapping static on Puzzle
    static getGoalMapping(goal_state) {
        const map = {};
        for (let row = 0; row < goal_state.length; row++) {
            for (let col = 0; col < goal_state[row].length; col++) {
                map[goal_state[row][col]] = {row, col};
            }
        }

        return map;
    }

    generateNeighbors(goal_mapping=null) {
        const neighboringPuzzleStates = [];
        if (this.canSlideUp() && this.lastSlideDirection != Puzzle.slideDirections["DOWN"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideUp();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["UP"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideDown() && this.lastSlideDirection != Puzzle.slideDirections["UP"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideDown();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["DOWN"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideLeft() && this.lastSlideDirection != Puzzle.slideDirections["RIGHT"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideLeft();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["LEFT"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideRight() && this.lastSlideDirection != Puzzle.slideDirections["LEFT"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideRight();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["RIGHT"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (goal_mapping) {
            for (let puzzle of neighboringPuzzleStates) {
                puzzle.updateManhattanSum(goal_mapping)
                puzzle.costFromStart += 1;
            }
        }

        return neighboringPuzzleStates;
    }

    isInGoalState() {
        return this.isEqualToPuzzle(Puzzle.goalState)
    }

    isEqualToPuzzle(puzzle) {
        // TODO: Type checks, size checks, etc
        for (let row = 0; row < puzzle.matrix.length; row++) {
            for (let col = 0; col < puzzle.matrix[row].length; col++) {
                if (puzzle.matrix[row][col].value !== this.matrix[row][col].value) {
                    return false;
                }
            }
        }

        return true;
    }

    // TODO: Add unit tests!  Does this work for an odd N?  Does this work for NxM?
    /**
     * Takes a 1D array and counts the inversions, returns false if inversions is odd and true if even.
     * 
     * A pair of tiles form an inversion if the values on tiles are in reverse order of their appearance in goal state
     * For example, the following instance of 8 puzzle has two inversions, (8, 6) and (8, 7). 
     * 1   2   3
     * 4   _   5
     * 8   6   7
     */
    isPuzzleSolvable(arr) {
        let inversions = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                // Not comparing either side with the blank space (0), and greater than next value
                if (arr[i] && arr[j] && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }
        // Return true on even, false on odd inversion count
        return !(inversions % 2)
    }
    
    // Modern Fisher–Yates shuffle:
    // https://en.wikipedia.org/wiki/Fisher-Yates_shuffle
    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)); // random from 0 -> i
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    printPuzzle() {
        let string = "";
        for (const row of this.matrix) {
            for (const tile of row) {
                string += tile.value + " ";;
            }
            string += "\n";
        }
        string += "\n";
        console.log(string)
    }
}


// Note:  Since our heuristics are admissasble we don't need to keep track of a closed set
//        Hashing on a closed set and checking if we've visited before could improve runtime, but also increase memory usage
//        Using a closed set is only viable if our heuristic is also consistent: https://en.wikipedia.org/wiki/A*_search_algorithm
const solvePuzzleAStar = (puzzle, goal_state) => {
    puzzle.printPuzzle();

    const openList = new PriorityQueue();   // Un-explored states as a priority queue
    const goal_mapping = Puzzle.getGoalMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    puzzle.updateManhattanSum(goal_mapping);
    openList.enqueue(puzzle, puzzle.manhattanSum);
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {
        const neighboringPuzzleStates = curPuzzle.generateNeighbors(goal_mapping);
        const costToNeighbor = curPuzzle.costFromStart + 1;
        for(neighbor of neighboringPuzzleStates) {

            // If on the open list, check if we found a better way
            const openNeighorIndex = openList.items.findIndex(puzzle => puzzle.element.isEqualToPuzzle(neighbor));
            if (openNeighorIndex !== -1) {
                const puzzleToMaybeUpdate = openList.items[openNeighorIndex];
                if (puzzleToMaybeUpdate.element.costFromStart > costToNeighbor) {
                    let removed = openList.items.splice(openNeighorIndex, 1)[0]; // remove from queue to resort with new cost
                    neighbor.cameFrom = curPuzzle;
                    neighbor.updateManhattanSum(goal_mapping);
                    neighbor.costFromStart = costToNeighbor;
                    openList.enqueue(neighbor, neighbor.manhattanSum + neighbor.costFromStart);
                }
            } else {
                // Add to open list for further exploration
                neighbor.cameFrom = curPuzzle;
                neighbor.updateManhattanSum(goal_mapping);
                neighbor.costFromStart = costToNeighbor;
                openList.enqueue(neighbor, neighbor.manhattanSum + neighbor.costFromStart);   
            }
        }

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

    curPuzzle.printPuzzle()
    return curPuzzle;
}

const iterativeDeepeningSearch = (solutionPath, costToCurPuzzle, boundingThreshold, goal_mapping) => {
    let curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    let costToSolution = costToCurPuzzle + curPuzzle.manhattanSum

    if (costToSolution > boundingThreshold) {
        return costToSolution;
    }

    if (curPuzzle.manhattanSum === 0) {
        // console.log("DID I REACH THE GOAL?")
        return SOLVED;
    }

    minThreshold = Infinity;
    for (neighbor of curPuzzle.generateNeighbors(goal_mapping)) {
        neighbor.cameFrom = curPuzzle;
        solutionPath.push(neighbor);
        threshold = iterativeDeepeningSearch(solutionPath, costToCurPuzzle + 1 + neighbor.manhattanSum, boundingThreshold, goal_mapping);
        if (threshold == SOLVED) return threshold;
        if (threshold < minThreshold) minThreshold = threshold;
        solutionPath.pop();
    }

    return minThreshold;
}

const goal_state = [ [1, 2, 3], 
                    [4, 5, 6],
                    [7, 8, 0] ];

// let puzzle = Puzzle.fromMatrix([[8, 6, 7],
//                             [2, 5, 4],
//                             [3, 0, 1]]);


// Breadth first search
const solvePuzzleBFS = (puzzle, goal_state) => {
    // puzzle.printPuzzle();
    const openList = [];   // Un-explored states
    const closedList = []; // Previously visited states
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {
        neighboringPuzzleStates = curPuzzle.generateNeighbors();
        for(neighbor of neighboringPuzzleStates) {
            // Only explore new states, if we've already explored then don't add to open list
            if (!closedList.find(puzzle => puzzle.isEqualToPuzzle(neighbor))) {
                neighbor.cameFrom = curPuzzle;
                // neighbor.printPuzzle();
                openList.push(neighbor);            
            }
        }

        // closedList.push(curPuzzle);
        curPuzzle = openList.shift();
    }

    // curPuzzle.printPuzzle();
    return curPuzzle;
}

const solvePuzzle = (algorithm, puzzle, goal_state) => {
    Puzzle.goalState = Puzzle.fromMatrix(goal_state);
    let solutionPuzzle = algorithm(puzzle, goal_state);
    let solutionMoves = [];
    while (solutionPuzzle) {
        solutionMoves.push(Object.keys(Puzzle.slideDirections)[Object.values(Puzzle.slideDirections).indexOf(solutionPuzzle.lastSlideDirection)]);
        solutionPuzzle = solutionPuzzle.cameFrom;
    }

    console.log(algorithm.name, "SOLUTION:", solutionMoves.length - 1, solutionMoves);

    return solutionMoves.reverse();
}



// let bfs = solvePuzzleBFS(puzzle, goal_state);
// let bfsMoves = [];
// while (bfs) {
//     bfsMoves.push(slideDirectionsInv[JSON.stringify(bfs.lastSlideDirection)]);
//     bfs = bfs.cameFrom;
// }
// console.log("BFS SOLUTION:", bfsMoves.length, bfsMoves);


// solvePuzzle(solvePuzzleAStar, puzzle, goal_state)

const htmlMatrix = [[,,,], [,,,], [,,,]];
for(let row = 0; row < 3; row++) {
    for(let col = 0; col < 3; col++) {
        let gridItem = document.getElementsByClassName("row" + row + " col" + col)[0];
        console.log(gridItem);
        htmlMatrix[row][col] = gridItem;
    }
}

const resetPuzzle = (htmlMatrix, puzzle) => {
    console.log(htmlMatrix,puzzle)
    for (let row = 0; row < puzzle.matrix.length; row++) {
        for (let col = 0; col < puzzle.matrix[row].length; col++) {
            console.log(puzzle.matrix[row][col].value)

            // Make blank space actually blank
            if (puzzle.matrix[row][col].value === 0) {
                htmlMatrix[row][col].innerHTML = " "
            }
            else {
                htmlMatrix[row][col].innerHTML = puzzle.matrix[row][col].value;
            }
        }
    }
}

const swapHtmlTiles = (htmlMatrix, rows, cols) => {
    console.log(rows, cols);
    temp = htmlMatrix[rows[0]][cols[0]].innerHTML;
    htmlMatrix[rows[0]][cols[0]].innerHTML = htmlMatrix[rows[1]][cols[1]].innerHTML;
    htmlMatrix[rows[1]][cols[1]].innerHTML = temp;
}

const solvePuzzleForFunzies = async (htmlMatrix, puzzle, goal_state) => {
    resetPuzzle(htmlMatrix, puzzle);
    sliderPosition = Puzzle.getBlankTilePosition(puzzle);
    solution = solvePuzzle(solvePuzzleIDAStar, puzzle, goal_state);
    sliderRow = sliderPosition[0];
    sliderCol = sliderPosition[1];
    for(move of solution) {

        console.log(move);

        if (move === "RIGHT") {
            swapHtmlTiles(htmlMatrix, [sliderRow, sliderRow], [sliderCol, sliderCol+1]);
            sliderCol++;
        }

        if (move === "LEFT") {
            swapHtmlTiles(htmlMatrix, [sliderRow, sliderRow], [sliderCol, sliderCol-1]);
            sliderCol--;
        }

        if (move === "UP") {
            swapHtmlTiles(htmlMatrix, [sliderRow, sliderRow-1], [sliderCol, sliderCol]);
            sliderRow--;
        }
        
        if (move === "DOWN") {
            swapHtmlTiles(htmlMatrix, [sliderRow, sliderRow+1], [sliderCol, sliderCol]);
            sliderRow++;
        }

        await new Promise(r => setTimeout(r, 500));
    }
}

// solvePuzzleForFunzies(htmlMatrix, new Puzzle(genRandomPuzzle=true), goal_state);

// https://web.dev/drag-and-drop/
document.addEventListener('DOMContentLoaded', (e) => {

    function handleDragStart(e) {
      this.style.opacity = '0.4';

      dragSrcEl = this;

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
    }
  
    function handleDragEnd(e) {
      this.style.opacity = '1';
  
      items.forEach(function (item) {
        item.classList.remove('over');
      });
    }
  
    function handleDragOver(e) {
      e.preventDefault();
      return false;
    }
  
    function handleDragEnter(e) {
      this.classList.add('over');
    }
  
    function handleDragLeave(e) {
      this.classList.remove('over');
    }

    function handleDrop(e) {
        if (dragSrcEl !== this) {
            dragSrcEl.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');
          }
        
        return false;
    }
  
    let items = document.querySelectorAll('.grid-item');
    items.forEach(function(item) {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('dragenter', handleDragEnter);
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('dragend', handleDragEnd);
      item.addEventListener('drop', handleDrop);
    });
  });
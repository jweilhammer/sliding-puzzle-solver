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

    // TODO: Only working for 3x3, maybe also validate this is a valid puzzle too :-)
    static fromMatrix(matrix) {
        let puzzle = new this(false);

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[0].length; col++) {
                if (!matrix[row][col]) {
                    puzzle.blank_row = row;
                    puzzle.blank_col = col;
                }
            }
        }
        puzzle.matrix = matrix;
        return puzzle;
    }

    static getBlankTilePosition(puzzle) {
        for (let row = 0; row < puzzle.matrix.length; row++) {
            for (let col = 0; col < puzzle.matrix[row].length; col++) {
                if (puzzle.matrix[row][col] === 0) {
                    return [row, col];
                }
            }
        }
    }

    // Gives me a random, solveable puzzle
    generateRandomPuzzle() {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let puzzle_arr = [];
        do {
            puzzle_arr = Puzzle.shuffleArray(values);
        } 
        while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr));

        // Turn 1D array into our Puzzle Matrix from last to first to use arr.pop()
        let puzzle_matrix = [[,,,], [,,,], [,,,]];
        for (let row = 0; row < puzzle_matrix.length; row++) {
            for (let col = 0; col < puzzle_matrix[row].length; col++) {
                const value = puzzle_arr.shift();
                if (!value) {
                    this.blank_row = row;
                    this.blank_col = col;
                }
                puzzle_matrix[row][col] = value;
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

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row][this.blank_col - 1];
        this.matrix[this.blank_row][this.blank_col - 1] = 0;
        this.blank_col--;
    }


    slideRight() {
        // Edge guarding on current row
        if (this.blank_col >= this.matrix[this.blank_row].length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row][this.blank_col + 1];
        this.matrix[this.blank_row][this.blank_col + 1] = 0;
        this.blank_col++;
    }


    slideUp() {
        // Edge guarding on left side
        if (this.blank_row <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row - 1][this.blank_col];
        this.matrix[this.blank_row - 1][this.blank_col] = 0;
        this.blank_row--;
    }

    slideDown() {
        // Edge guarding on left side
        if (this.blank_row >= this.matrix.length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row + 1][this.blank_col];
        this.matrix[this.blank_row + 1][this.blank_col] = 0;
        this.blank_row++;
    }

    // Updates manhattan sum for this puzzle state.  Takes a goal mapping from Puzzle's goal mapping static method
    updateManhattanSum(goal_mapping) {
        let manhattanSum = 0;
        for(let row = 0; row < this.matrix.length; row++) {
            for(let col = 0; col < this.matrix[row].length; col++) {
                if (this.matrix[row][col]) {
                    const goalPos = goal_mapping[this.matrix[row][col]]
                    manhattanSum += ( Math.abs(row - goalPos.row) + Math.abs(col - goalPos.col) );    
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
                if (puzzle.matrix[row][col] !== this.matrix[row][col]) {
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
    static isPuzzleSolvable1Darr(arr) {
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

    static isPuzzleSolvable2Darr(matrix) {
        const arr = [];

        for(let row = 0; row < matrix.length; row++){
            for(let col = 0; col < matrix[0].length; col++) {
                arr.push(matrix[row][col]);
            }
        }

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
    static shuffleArray(array) {
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
                string += tile + " ";;
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

    const closedList = {}; // doesn't have to be a queue
    const openList = new PriorityQueue();   // Un-explored states as a priority queue
    const goal_mapping = Puzzle.getGoalMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    puzzle.updateManhattanSum(goal_mapping);
    openList.enqueue(puzzle, puzzle.manhattanSum);
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {
        
        closedList[JSON.stringify(curPuzzle.matrix)] = 1;
        const neighboringPuzzleStates = curPuzzle.generateNeighbors(goal_mapping);
        const costToNeighbor = curPuzzle.costFromStart + 1;
        for(neighbor of neighboringPuzzleStates) {

            // If on the closed list, don't explore that pat
            if (closedList[JSON.stringify(neighbor.matrix)]) {
                // console.log("FOUND THIS ON THE CLOSED LIST YO", JSON.stringify(neighbor.matrix), closedList[JSON.stringify(curPuzzle.matrix)])
                continue;
            }

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
// Will recursively search and prune baths based on threshold sum of heuristic
// Restarts at beginning node and chooses the best path each iteration
const solvePuzzleIDAStar = (puzzle, goal_state) => {
    const goal_mapping = Puzzle.getGoalMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    let curPuzzle = puzzle;
    curPuzzle.updateManhattanSum(goal_mapping);
    let threshold = curPuzzle.manhattanSum;
    const solutionPath = [curPuzzle] // Stack of Puzzles up to our current state
    while (curPuzzle.manhattanSum !== 0) {
        threshold = iterativeDeepeningSearch(solutionPath, 0, threshold, goal_mapping);
        if (threshold === Infinity) {
            console.log("unsolvable");
            return;
        }
        curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    }

    return curPuzzle;
}

// Recursively loop through neighboring paths and prune branches based on bounding threshold
// Will return the minimum threshold from all neighboring state paths (sum of heuristsics + cost to traverse to neighbor)
const iterativeDeepeningSearch = (solutionPath, costToCurPuzzle, boundingThreshold, goal_mapping) => {
    let curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    let costToSolution = costToCurPuzzle + curPuzzle.manhattanSum

    if (costToSolution > boundingThreshold) {
        return costToSolution;
    }

    if (curPuzzle.manhattanSum === 0) {
        return SOLVED;
    }

    minThreshold = Infinity;
    for (neighbor of curPuzzle.generateNeighbors(goal_mapping)) {

        // If neighbor is already on our solution path, don't re-explore to prevent loops
        const neighborSolutionIndex = solutionPath.findIndex(puzzle => puzzle.isEqualToPuzzle(neighbor));
        if (neighborSolutionIndex === -1) {
            neighbor.cameFrom = curPuzzle;
            solutionPath.push(neighbor);
            threshold = iterativeDeepeningSearch(solutionPath, costToCurPuzzle + 1 + neighbor.manhattanSum, boundingThreshold, goal_mapping);
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
        htmlMatrix[row][col] = gridItem;
    }
}


const shuffleHtmlMatrix = () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let puzzle_arr = [];
    do {
        puzzle_arr = Puzzle.shuffleArray(values);
    } 
    while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr));

    for(let row = 0; row < htmlMatrix.length; row++) {
        for(let col = 0; col < htmlMatrix[row].length; col++) {
            htmlMatrix[row][col].innerHTML = puzzle_arr.pop();
        }
    }
    
}

const resetPuzzleGridHTML = (htmlMatrix, puzzle) => {
    for (let row = 0; row < puzzle.matrix.length; row++) {
        for (let col = 0; col < puzzle.matrix[row].length; col++) {

            // Make blank space actually blank
            if (puzzle.matrix[row][col] === 0) {
                htmlMatrix[row][col].innerHTML = " "
            }
            else {
                htmlMatrix[row][col].innerHTML = puzzle.matrix[row][col];
            }
        }
    }
}


// TODO: Make this less error prone/breakable to editing of elements
const getPuzzleFromGridHTML = (htmlMatrix) => {
    const matrix = [[,,,],[,,,],[,,,]];
    for (let row = 0; row < htmlMatrix.length; row++) {
        for (let col = 0; col < htmlMatrix[0].length; col++) {
            if (isNaN(parseInt(htmlMatrix[row][col].innerHTML))) {   
                matrix[row][col] = 0;
            } else {    
                matrix[row][col] = parseInt(htmlMatrix[row][col].innerHTML);
            }
        }
    }

    if (!Puzzle.isPuzzleSolvable2Darr(matrix)) {
        alert("Puzzle is not in a solveable state");
        return undefined;
    }

    return Puzzle.fromMatrix(matrix);
}

const swapHtmlTiles = (htmlMatrix, rows, cols) => {
    temp = htmlMatrix[rows[0]][cols[0]].innerHTML;
    htmlMatrix[rows[0]][cols[0]].innerHTML = htmlMatrix[rows[1]][cols[1]].innerHTML;
    htmlMatrix[rows[1]][cols[1]].innerHTML = temp;
}

const solvePuzzleForFunzies = async (htmlMatrix, goal_state) => {
    const startingPuzzle = getPuzzleFromGridHTML(htmlMatrix);

    if (!startingPuzzle) {
        return;
    }

    sliderPosition = Puzzle.getBlankTilePosition(startingPuzzle);
    solution = solvePuzzle(solvePuzzleIDAStar, startingPuzzle, goal_state);
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

        await new Promise(r => setTimeout(r, 300));
    }
}


let dragSourceElement = undefined;
let clickSourceElement = undefined;

// https://web.dev/drag-and-drop/
document.addEventListener('DOMContentLoaded', (e) => {

    function handleDragStart(e) {
      this.style.opacity = '0.4';
      dragSourceElement = this;

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);

      // Unselect clicked tile if we're dragging a different one
      if (clickSourceElement) {
          if (this !== clickSourceElement) {
            clickSourceElement.style.opacity = '1';
            clickSourceElement = undefined;
          }
      }
    }
  
    function handleDragEnd(e) {
      // Keep this tile highlighted if it's clicked
      if (this === clickSourceElement) {
        this.style.opacity = '0.4';
      } 
      else {
        this.style.opacity = '1';
      }

      dragSourceElement = undefined;
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
        // Swap dragged tiles
        if (dragSourceElement !== this) {
            dragSourceElement.innerHTML = this.innerHTML;
            this.innerHTML = e.dataTransfer.getData('text/html');
        }

        // Don't keep click selection if dragging that same tile after clicking it
        if (dragSourceElement === clickSourceElement) {
            clickSourceElement = undefined;
        }

        // Select this tile as clicked, makes mini/accidental drags feel more natural
        if (dragSourceElement === this) {
            clickSourceElement = this;
            this.style.opacity = '0.4';
        }
        
        return false;
    }

    // This is so mobile can customize puzzles without having to jump through hoops
    // Mobile HTML5 drop and drag not supported natively: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
    function handleTouchAndCLick(e) {
        // Stop zooming when double clicking tiles on mobile
        e.preventDefault();

        if (clickSourceElement) {
            // Unselect same tile after double click
            if (clickSourceElement === this) {
                clickSourceElement.style.opacity = '1';
                clickSourceElement = undefined;
            }
            else {
                // Swap these tiles
                const temp = this.innerHTML;
                this.innerHTML = clickSourceElement.innerHTML
                clickSourceElement.innerHTML = temp;
                clickSourceElement.classList.remove('over');
                clickSourceElement.style.opacity = '1';
                clickSourceElement = undefined;
            }
        } else {
            // Visually select this tile
            this.style.opacity = '0.4';
            clickSourceElement = this;
        }
    }
  
    let items = document.querySelectorAll('.grid-item');
    items.forEach(function(item) {
      // Desktop puzzle customization with drag API
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('dragenter', handleDragEnter);
      item.addEventListener('dragleave', handleDragLeave);
      item.addEventListener('dragend', handleDragEnd);
      item.addEventListener('drop', handleDrop);


      // Mobile and desktop point and swap puzzle customization
      item.addEventListener('click', handleTouchAndCLick);
      item.addEventListener('touchstart', handleTouchAndCLick);
    });
});


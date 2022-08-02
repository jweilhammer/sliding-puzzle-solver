// Note:  Since our heuristics are admissasble we don't need to keep track of a closed set
//        Hashing on a closed set and checking if we've visited before could improve runtime, but also increase memory usage
//        Using a closed set is only viable if our heuristic is also consistent: https://en.wikipedia.org/wiki/A*_search_algorithm
const solvePuzzleAStar = (puzzle, goal_state) => {
    const startTime = performance.now();

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

    const endTime = performance.now();

    // curPuzzle.printPuzzle();

    return {
        "solutionPuzzle": curPuzzle,
        "runtimeMs": endTime - startTime,
        "maxPuzzlesInMemory": Object.keys(closedList).length + openList.items.length,
    };
}


const SOLVED = 0;
const NOT_SOLVED = -1;

// https://en.wikipedia.org/wiki/Iterative_deepening_A*#Pseudocode
// Will recursively search and prune baths based on threshold sum of heuristic
// Restarts at beginning node and chooses the best path each iteration
const solvePuzzleIDAStar = (puzzle, goal_state) => {
    const startTime = performance.now();

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

    const endTime = performance.now();

    return {
        "solutionPuzzle": curPuzzle,
        "runtimeMs": endTime - startTime,
        "maxPuzzlesInMemory": solutionPath.length,
    };
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
    const startTime = performance.now();

    const openList = [];   // Un-explored states
    const closedSet = {}; // Previously visited states
    let curPuzzle = puzzle;
    while (!curPuzzle.isInGoalState(goal_state)) {
        neighboringPuzzleStates = curPuzzle.generateNeighbors();
        for(neighbor of neighboringPuzzleStates) {
            // Only explore new states, if we've already explored then don't add to open list
            if (!closedSet[JSON.stringify(neighbor.matrix)]) {
                neighbor.cameFrom = curPuzzle;
                // neighbor.printPuzzle();
                openList.push(neighbor);      
            }
        }

        closedSet[JSON.stringify(curPuzzle.matrix)] = 1;
        curPuzzle = openList.shift();
    }
    
    const endTime = performance.now();
    return {
        "solutionPuzzle": curPuzzle,
        "runtimeMs": endTime - startTime,
        "maxPuzzlesInMemory": Object.keys(closedSet).length + openList.length,
    };
}

const solvePuzzle = (algorithm, puzzle, goal_state) => {
    Puzzle.goalState = Puzzle.fromMatrix(goal_state);
    let solution = algorithm(puzzle, goal_state);
    let solutionPuzzle = solution['solutionPuzzle'];
    let solutionMoves = [];
    while (solutionPuzzle) {
        solutionMoves.push(Object.keys(Puzzle.slideDirections)[Object.values(Puzzle.slideDirections).indexOf(solutionPuzzle.lastSlideDirection)]);
        solutionPuzzle = solutionPuzzle.cameFrom;
    }

    console.log(algorithm.name, "SOLUTION:", solutionMoves.length - 1, solutionMoves);

    return {
        "solutionMoves": solutionMoves.reverse(),
        "runtimeMs": solution["runtimeMs"],
        "maxPuzzlesInMemory": solution["maxPuzzlesInMemory"]
    }
}

const resetClickSourceElement = () => {
    console.log("resetClickSourceElement()")
    // Unselect any tiles before shuffling
    if (clickSourceElement) {
        console.log("CLICK SOURCE ELEMENT EXISTS", clickSourceElement);

        // Leave sliding tile blank
        if (isNaN(parseInt(clickSourceElement.innerHTML))) {
            console.log("MAKING SLIDING TILE BLANK", "!isNaN(parseInt(clickSourceElement.innerHTML))", !isNaN(parseInt(clickSourceElement.innerHTML)), parseInt(clickSourceElement.innerHTML));
            clickSourceElement.style.opacity = '0';
        }
        else {
            console.log("MAKING REGULAR TILE VISIBLE")
            clickSourceElement.style.opacity = '1';
        }

        clickSourceElement = undefined;
    }
}


const resetDragSourceElement = () => {
    console.log("resetDragSourceElement()")
    // Unselect any tiles before shuffling
    if (dragSourceElement) {
        console.log("DRAG SOURCE ELEMENT EXISTS", dragSourceElement);

        // Leave sliding tile blank
        if (isNaN(parseInt(dragSourceElement.innerHTML))) {
            console.log("MAKING SLIDING TILE BLANK", "!isNaN(parseInt(clickSourceElement.innerHTML))", isNaN(parseInt(dragSourceElement.innerHTML)), parseInt(dragSourceElement.innerHTML));
            dragSourceElement.style.opacity = '0';
        }
        else {
            console.log("MAKING REGULAR TILE VISIBLE")
            dragSourceElement.style.opacity = '1';
        }

        dragSourceElement = undefined;
    }
}

const shuffleHtmlMatrix = () => {

    // Unselect any tiles before shuffling
    resetClickSourceElement();

    const values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let puzzle_arr = [];
    do {
        puzzle_arr = Puzzle.shuffleArray(values);
    } 
    while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr));

    const backgroundPositions = getBackgroundPositions(htmlMatrix.length, htmlMatrix[0].length);

    for(let row = 0; row < htmlMatrix.length; row++) {
        for(let col = 0; col < htmlMatrix[row].length; col++) {
            let value = puzzle_arr.pop();
            if (value === 0) { 
                htmlMatrix[row][col].innerHTML = " ";
                htmlMatrix[row][col].style.opacity = '0';

                // TODO: Make blank space anywhere for images?  For now I'm taking out 100%, 100% here to use as the bottom right tile
                htmlMatrix[row][col].style.backgroundPosition = '100% 100%';
            }
            else {
                htmlMatrix[row][col].innerHTML = value;
                htmlMatrix[row][col].style.opacity = '1';
                htmlMatrix[row][col].style.backgroundPosition = `${backgroundPositions[value]['rowPercent']}% ${backgroundPositions[value]['colPercent']}%`;
            }
        }
    }
}

const getBackgroundPositions = (rows, cols) => {
    
    // Holds keys for the value the user sees for the puzzle
    //  [1, 2, 3]
    //  [4, 5, 6]
    //  [7, 8  0]
    const positionMatrix = {}

    // Step for the even values of percentages between 0-100% for the number of tiles
    // Ex. 3 tiles = [0, 50, 100].  4 tiles = [0, 33.3, 66.6, 100]
    const rowPercentStep = (100 / (rows - 1));
    const colPercentStep = (100 / (cols - 1));
    for(let row = 0; row < rows; row++){
        for(let col = 0; col < cols; col++){
            console.log("SETTING POSITION FOR", row, col, {rowPercent: rowPercentStep*row, colPercent: colPercentStep*col})
            positionMatrix[row + 1 + cols * col] = {rowPercent: rowPercentStep*row, colPercent: colPercentStep*col};
        }
    }

    return positionMatrix
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

const solvePuzzleForFunzies = async (htmlMatrix, goal_state) => {
    const startingPuzzle = getPuzzleFromGridHTML(htmlMatrix);

    if (!startingPuzzle) {
        return;
    }

    // Unselect any tiles before sorting
    resetClickSourceElement();

    const algorithmMappings = {
        "IDA*": solvePuzzleIDAStar,
        "A*": solvePuzzleAStar,
        "BFS": solvePuzzleBFS
    }

    console.log(document.getElementById("algorithmsDropdown").value)
    const algorithm = algorithmMappings[document.getElementById("algorithmsDropdown").value];

    sliderPosition = Puzzle.getBlankTilePosition(startingPuzzle);
    sliderRow = sliderPosition[0];
    sliderCol = sliderPosition[1];
    htmlMatrix[sliderRow][sliderCol].style.opacity = '0';
    solution = solvePuzzle(algorithm, startingPuzzle, goal_state);
    
    for(move of solution['solutionMoves']) {
        console.log(move);

        if (move === "RIGHT") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow][sliderCol+1]);
            sliderCol++;
        }

        if (move === "LEFT") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow][sliderCol-1]);
            sliderCol--;
        }

        if (move === "UP") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow-1][sliderCol]);
            sliderRow--;
        }
        
        if (move === "DOWN") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow+1][sliderCol]);
            sliderRow++;
        }

        await new Promise(r => setTimeout(r, 300));
    }

    console.log("RUNTIME:", solution['runtimeMs'], "ms. MAX PUZZLES IN MEM:", solution['maxPuzzlesInMemory']);
    console.log("APPROXIMATE MEMORY USAGE", (solution['maxPuzzlesInMemory']*112 / (1024 * 1024)), "MB");

    solutionOutput.innerHTML = `RUNTIME: ${solution['runtimeMs']}ms<br />
                                MAX PUZZLES IN MEM: ${solution['maxPuzzlesInMemory']}<br />
                                APPROXIMATE MEMORY USAGE ${(solution['maxPuzzlesInMemory']*112 / (1024 * 1024))}MB
                                `;
}

// UI ELEMENTS
let dragSourceElement = undefined;
let clickSourceElement = undefined;
const playButton = document.getElementById("playButton");
const solutionOutput = document.getElementById("output");
const htmlMatrix = [[,,,], [,,,], [,,,]];
const gridContainer = document.getElementById("gridContainer");
const styler = document.getElementById("dynamicStyling");


// https://web.dev/drag-and-drop/
document.addEventListener('DOMContentLoaded', (e) => {
    console.log(gridContainer);
    console.log(gridContainer.offsetWidth, gridContainer.offsetHeight);
    styler.innerHTML = `.grid-item { background-size: ${gridContainer.offsetWidth}px ${gridContainer.offsetHeight}px; }`


    // TODO: Make dynamic size
    let rows = 3, cols = 3;
    const totalGridItems = rows*cols
    for(let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            let gridItem = document.getElementsByClassName("row" + row + " col" + col)[0];
            htmlMatrix[row][col] = gridItem;
            console.log(gridItem);
            gridItem.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
            if (isNaN(parseInt(gridItem.innerHTML))) {
                gridItem.style.opacity = '0';
            }
        }
    }


    function handleDragStart(e) {
        if (playMode) {
            return;
        }

      this.style.opacity = '0.4';
      dragSourceElement = this;

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);

      // Unselect clicked tile if we're dragging a different one
      if (this !== clickSourceElement) {
        resetClickSourceElement();
      }
    }
  
    function handleDragEnd(e) {

        console.log("HANDLE DRAG END", e);
        console.log("THIS TILE IS HANDLING IT", this)
        console.log("DRAG SOURCE ELEMENT IS: ", dragSourceElement);

      // Keep this tile highlighted if it's clicked
      if (this === clickSourceElement) {
        dragSourceElement = undefined; // reset without unselecting
      } 
      else {
        if (isNaN(parseInt(this.innerHTML))) {
            this.style.opacity = '0';
        } else {
            this.style.opacity = '1'
        }
      }
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
        if (playMode) {
            return;
        }

        if (dragSourceElement !== this) {
            // Swap dragged tiles
            temp = { text: this.innerHTML, bgPosition: this.style.backgroundPosition };
            this.innerHTML = dragSourceElement.innerHTML;
            this.style.backgroundPosition = dragSourceElement.style.backgroundPosition;
            dragSourceElement.innerHTML = temp.text;
            dragSourceElement.style.backgroundPosition = temp.bgPosition;
            
            if (isNaN(parseInt(this.innerHTML))) {
                this.style.opacity = '0';
            }
            else {
                this.style.opacity = '1';
            }a

            // Don't keep click selection if dragging that same tile after clicking it
            if (dragSourceElement === clickSourceElement) {
                resetClickSourceElement();
            }
        }


        // Select this tile as clicked, makes mini/accidental drags feel more natural
        if (dragSourceElement === this) {
            this.style.opacity = '0.4';
            clickSourceElement = this;
        }
        
        return false;
    }

    // This is so mobile can customize puzzles without having to jump through hoops
    // Mobile HTML5 drop and drag not supported natively: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
    function handleTouchAndCLick(e) {
        // Stop zooming when double clicking tiles on mobile
        e.preventDefault();

        if (clickSourceElement && !playMode) {
            // Unselect same tile after double click
            if (clickSourceElement === this) {
                resetClickSourceElement();
            }
            else {
                // Swap the two different tiles
                if (!playMode) {
                    swapHtmlTiles(clickSourceElement, this);
                    resetClickSourceElement();
                }
            }
        } else {
            if (playMode) {
                // need indices for checking neighbors
                for (let row = 0; row < htmlMatrix.length; row++) {
                    for (let col = 0; col < htmlMatrix[row].length; col++) {
            
                        // Make neighbors of blank space clickable if they're in bounds
                        if (this === htmlMatrix[row][col]) {
                            if (row - 1 >= 0 && isNaN(parseInt(htmlMatrix[row-1][col].innerHTML))) {
                                swapHtmlTiles(htmlMatrix[row-1][col], this);
                            }
                            
                            if (row + 1 <= (htmlMatrix.length - 1) && isNaN(parseInt(htmlMatrix[row+1][col].innerHTML))) {
                                swapHtmlTiles(htmlMatrix[row+1][col], this);

                            }
            
                            if (col - 1 >= 0 && isNaN(parseInt(htmlMatrix[row][col-1].innerHTML))) {
                                swapHtmlTiles(htmlMatrix[row][col-1], this);

                            }
            
                            if (col + 1 <= (htmlMatrix[row].length - 1) && isNaN(parseInt(htmlMatrix[row][col+1].innerHTML))) {
                                swapHtmlTiles(htmlMatrix[row][col+1], this);
                            }
                        }
                    }
                }
                resetClickSourceElement();
                playModeResetAllMovableTiles();
                playModeSetMovableTiles();
            }
            else {
                // Visually select this tile
                this.style.opacity = '0.4';
                clickSourceElement = this;
            }
        }
    }


  
    let items = document.querySelectorAll('.grid-item');
    items.forEach(function(item) {
        item.style.cursor = 'move';
        item.setAttribute("unselectable", "on");

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

addEventListener('resize', (event) => {
    // console.log(event);
    
    styler.innerHTML = `.grid-item { background-size: ${gridContainer.offsetWidth}px ${gridContainer.offsetHeight}px; }`
});

const swapHtmlTiles = (tile1, tile2) => {
    const temp = tile1.innerHTML
    const tempBackground = tile1.style.backgroundPosition;
    tile1.innerHTML = tile2.innerHTML;
    tile1.style.backgroundPosition = tile2.style.backgroundPosition;
    tile2.innerHTML = temp;
    tile2.style.backgroundPosition = tempBackground;
    tile1.style.opacity = isNaN(parseInt(tile1.innerHTML)) ? "0" : "1";
    tile2.style.opacity = isNaN(parseInt(tile2.innerHTML)) ? "0" : "1";
}


let playMode = false;
const togglePlayMode = () => {
    if (playMode) {
        playMode = false;
        playButton.innerHTML = "Play Puzzle";
        clickSourceElement = undefined;
        dragSourceElement = undefined;
        for (row of htmlMatrix) {
            for (tile of row) {
                tile.setAttribute('draggable', true);
                tile.style.pointerEvents = 'auto';
                tile.style.cursor = 'move';
                tile.style.opacity = isNaN(parseInt(tile.innerHTML)) ? '0' : '1';
            }
        }
    }
    else {
        playMode = true;
        playButton.innerHTML = "Customize Puzzle";
        playModeResetAllMovableTiles();
        playModeSetMovableTiles();
    }
}

const playModeResetAllMovableTiles = () => {
    for (row of htmlMatrix) {
        for (tile of row) {
            tile.setAttribute('draggable', false);
            tile.style.pointerEvents = 'none';
            tile.style.cursor = 'default';
        }
    }
}

const playModeSetMovableTiles = () => {
    // need indices for finding neigbhors
    for (let row = 0; row < htmlMatrix.length; row++) {
        for (let col = 0; col < htmlMatrix[row].length; col++) {

            // Make neighbors of blank space clickable if they're in bounds
            if (isNaN(parseInt(htmlMatrix[row][col].innerHTML))) {

                htmlMatrix[row][col].style.opacity = '0'; // highlight blank tile

                if (row - 1 >= 0) {
                    htmlMatrix[row-1][col].style.pointerEvents = 'auto';
                    htmlMatrix[row-1][col].style.cursor = 'pointer';
                }
                
                if (row + 1 <= (htmlMatrix.length - 1)) {
                    htmlMatrix[row+1][col].style.pointerEvents = 'auto';
                    htmlMatrix[row+1][col].style.cursor = 'pointer';
                }

                if (col - 1 >= 0) {
                    htmlMatrix[row][col-1].style.pointerEvents = 'auto';
                    htmlMatrix[row][col-1].style.cursor = 'pointer';
                }

                if (col + 1 <= (htmlMatrix[row].length - 1)) {
                    htmlMatrix[row][col+1].style.pointerEvents = 'auto';
                    htmlMatrix[row][col+1].style.cursor = 'pointer';
                }
            } else {
                htmlMatrix[row][col].style.opacity = '1'; // highlight blank tile
            }
        }
    }
}
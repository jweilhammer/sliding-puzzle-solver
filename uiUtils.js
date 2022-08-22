// UI ELEMENTS
let dragSourceElement = undefined;
let clickSourceElement = undefined;
const playButton = document.getElementById("playButton");
const solutionOutput = document.getElementById("output");
let htmlMatrix = [[,,,], [,,,], [,,,]];
const grid = document.getElementById("grid");
const gridContainer = document.getElementById("gridContainer");
const styler = document.getElementById("dynamicStyling");
const algorithmDropdown =document.getElementById("algorithmsDropdown");
const colInput = document.getElementById("colInput");


// App state
let puzzleRows = undefined;
let puzzleCols = undefined;
let solutionAnimating = false;

const resetClickSourceElement = () => {
    // Unselect any tiles before shuffling
    if (clickSourceElement) {

        // Leave sliding tile blank
        if (isNaN(parseInt(clickSourceElement.innerHTML))) {
            clickSourceElement.style.opacity = '0';
        }
        else {
            clickSourceElement.style.opacity = '1';
        }

        clickSourceElement = undefined;
    }
}


const resetDragSourceElement = () => {
    // Unselect any tiles before shuffling
    if (dragSourceElement) {

        // Leave sliding tile blank
        if (isNaN(parseInt(dragSourceElement.innerHTML))) {
            dragSourceElement.style.opacity = '0';
        }
        else {
            dragSourceElement.style.opacity = '1';
        }

        dragSourceElement = undefined;
    }
}



const shuffleHtmlMatrix = () => {
    // Unselect any tiles and stop animation before shuffling
    resetClickSourceElement();
    solutionAnimating = false;

    // Get all tile Values in 1D array, plus blank tile (0)
    let tileValue = 1;
    const values = [];
    while (tileValue < (puzzleRows*puzzleCols)) {
        values.push(tileValue);
        tileValue++;
    }
    values.push(0);

    let puzzle_arr = [];
    do {
        puzzle_arr = Puzzle.shuffleArray(values);
    } 
    while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr, puzzleRows, puzzleCols));

    const backgroundPositions = getBackgroundPositions(puzzleRows, puzzleCols);

    for(let row = 0; row < puzzleRows; row++) {
        for(let col = 0; col < puzzleCols; col++) {
            let value = puzzle_arr.shift();
            if (value === 0) { 
                htmlMatrix[row][col].innerHTML = " ";
                htmlMatrix[row][col].style.opacity = '0';

                // TODO: Make blank space anywhere for images?  For now I'm taking out 100%, 100% here to use as the bottom right tile
                htmlMatrix[row][col].style.backgroundPosition = '100% 100%';
            }
            else {
                htmlMatrix[row][col].innerHTML = value;
                htmlMatrix[row][col].style.opacity = '1';
                htmlMatrix[row][col].style.backgroundPosition = `${backgroundPositions[value]['colPercent']}% ${backgroundPositions[value]['rowPercent']}%`;
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
    let value = 1;
    for(let row = 0; row < rows; row++){
        for(let col = 0; col < cols; col++){
            positionMatrix[value] = {rowPercent: rowPercentStep*row, colPercent: colPercentStep*col};
            value++;
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
    const matrix = Array(puzzleRows).fill().map(() => Array(puzzleCols));
    for (let row = 0; row < puzzleRows; row++) {
        for (let col = 0; col < puzzleCols; col++) {
            if (isNaN(parseInt(htmlMatrix[row][col].innerHTML))) {   
                matrix[row][col] = 0;
            } else {
                // console.log("SETTING VALUE ON STARTING PUZZLE MATRIX:", parseInt(htmlMatrix[row][col].innerHTML));
                matrix[row][col] = parseInt(htmlMatrix[row][col].innerHTML);
            }
        }
    }

    // console.log("MATRIX TO SOLVE:", matrix);

    if (!Puzzle.isPuzzleSolvable2Darr(matrix)) {
        alert("Puzzle is not in a solveable state");
        return undefined;
    }

    return Puzzle.fromMatrix(matrix);
}


// https://web.dev/drag-and-drop/
document.addEventListener('DOMContentLoaded', (e) => {
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();
});



// Workaround for keeping the background image the correct size on window resizes
// Do not have <img> tags that have abosulute positions updated.  Update the CSS class instead and let it handle it
addEventListener('resize', (event) => {
    updateBackgroundImageSize();
});


const swapHtmlTiles = (tile1, tile2) => {
    const temp = tile1.textContent
    const tempBackground = tile1.style.backgroundPosition;
    tile1.textContent = tile2.textContent;
    tile1.style.backgroundPosition = tile2.style.backgroundPosition;
    tile2.textContent = temp;
    tile2.style.backgroundPosition = tempBackground;
    tile1.style.opacity = isNaN(parseInt(tile1.textContent)) ? "0" : "1";
    tile2.style.opacity = isNaN(parseInt(tile2.textContent)) ? "0" : "1";
}


let playMode = false;
const togglePlayMode = () => {
    // Stop animation if solution is playing out
    solutionAnimating = false;

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


const updatePuzzleDimensions = (newRow, newCol) => {
    solutionAnimating = false;

    if (isNaN(newRow) || isNaN(newCol)) {
        return false;
    }

    // Max size of 100x100
    if (newRow > 100) {
        rowInput.value = 100;
        updateBackgroundImageSize();
        return false;
    }

    if (newCol > 100) {
        colInput.value = 100;
        updateBackgroundImageSize();
        return false;
    }


    // Minimum rows/cols of 2.
    // TODO: Allow 1xN or Nx1 puzzles?
    if (newRow < 2) {
        rowInput.value = 2;
        updateBackgroundImageSize();
        return false;
    }

    if (newCol < 2) {
        colInput.value = 2;
        updateBackgroundImageSize();
        return false;
    }


    // Only allow strategic algorithm on puzzles that are larger
    // TODO: Optimize IDA* for 4x4?  Don't see the point though..
    //       Easier to compare with other algorithms at 3x3
    if (newRow * newCol > 9) {
        console.log("PUZZLE IS LARGE", newRow * newCol);
        toggleStrategicOnlyAlgorithm(true);
    } else {
        toggleStrategicOnlyAlgorithm(false);
    }


    if (newRow === puzzleRows && newCol === puzzleCols) {
        return false;
    } else {
        puzzleRows = newRow;
        puzzleCols = newCol;
    }


    // Remove all current tiles
    resetClickSourceElement();
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    grid.style.gridTemplateRows = `${'1fr '.repeat(newRow)}`;
    grid.style.gridTemplateColumns = `${'1fr '.repeat(newCol)}`;
    grid.style.fontSize = null;
    

    value = 1;
    htmlMatrix = Array(newRow).fill().map(() => Array(newCol));
    const colPercentStep = (100 / (newCol - 1));
    const rowPercentStep = (100 / (newRow - 1));

    preset = [[16, 12, 17, 19, 10],
    [5, 7, 24, 23, 11],
    [22, 0, 21, 2, 1],
    [20, 4, 3, 6, 13],
    [15, 8, 18, 9, 14]
    ]

    for(let row = 0; row < newRow; row++){ 
        for(let col = 0; col < newCol; col++) {
            const tile = document.createElement("div");
            tile.className = `grid-item row${row} col${col}`;
            tile.textContent = value === newCol*newRow ? " " : value; // last tile is blank
            tile.id =  value === newRow*newCol ? 0 : value;
            tile.draggable = true;
            tile.style.backgroundPosition = `${col * colPercentStep}% ${row * rowPercentStep}%`;
            tile.style.opacity = value === newRow*newCol ? '0' : '1';
            grid.appendChild(tile);
            attachTileEventListeners(tile);
            htmlMatrix[row][col] = tile;
            value++;
        }
    }
}

const toggleStrategicOnlyAlgorithm = (strategicOnly) => {

    // Remove all other algorithms since our puzzle space is too large
    if (strategicOnly) {
        const childrenToRemove = [];
        for (const child of algorithmDropdown.children) {
            if (child.value !== "Strategic") {
                childrenToRemove.push(child);
            }
        }

        for (const child of childrenToRemove) {
            algorithmDropdown.removeChild(child);
        }

    } else if (algorithmDropdown.childElementCount <= 1) {

        // Add the other algorithms back in!
        const algorithms = {
            "IDA*": "Iterative Deepening A*",
            "A*": "A* (with closed set)",
            "BFS": "Breadth-First Search"
        }

        for (key in algorithms) {
            console.log("ADDING", key, algorithms[key]);
            const option = document.createElement("option");
            option.value = key;
            option.textContent = algorithms[key];
            algorithmDropdown.appendChild(option);
        }
    }
}

const updateBackgroundImageSize = () => {
    // Keep our segmented tile background sizes the same as the grid container as window resizes
    grid.style.backgroundSize = `${gridContainer.offsetWidth}px ${gridContainer.offsetHeight}px`

    // At a certain point, we don't care about seeing the tiles
    if (puzzleCols * puzzleRows > 1000) {
        grid.style.fontSize = 0;
    } else {
        // Magic formula that will keep things looking nice and prevent grid from getting out of bounds due to the numbers
        grid.style.fontSize = `${800 * ( 0.001 * gridContainer.offsetWidth) /  ( 2 * Math.max(puzzleCols, puzzleRows))}px`;
    }
}

const attachTileEventListeners = (tile) => {
    tile.style.cursor = 'move';
    tile.setAttribute("unselectable", "on"); // Prevents highlighting with cursor

    // Desktop puzzle customization with drag API
    tile.addEventListener('dragstart', handleTileDragStart);
    tile.addEventListener('drop', handleTileDrop);
    tile.addEventListener('dragend', handleTileDragEnd);

    tile.addEventListener('dragover', handleTileDragOver);
    // tile.addEventListener('dragenter', handleTileDragEnter);


    // Mobile and desktop point and swap puzzle customization
    tile.addEventListener('click', handleTileTouchAndCLick);
    tile.addEventListener('touchstart', handleTileTouchAndCLick);
}


rowInput.addEventListener('change', (e) => {
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();
});

colInput.addEventListener('change', (e) => {
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();
});



/*******************************************************************************
 * TILE EVENT LISTENERS
 * TODO: Any better way to group these together?  Don't want anonmyous functions
 *******************************************************************************/
function handleTileDragOver (e) {
    e.preventDefault();
    return false;
}

function handleTileDragStart (e) {
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

function handleTileDragEnd (e) {
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

function handleTileDrop (e) {
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
        }

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
function handleTileTouchAndCLick (e) {
    // Stop zooming when double clicking tiles on mobile
    // TODO: Attach this to rest of page?
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
// UI ELEMENTS
let dragSourceElement = undefined;
let clickSourceElement = undefined;
const editInputsContainer = document.getElementById("editInputsContainer");
const imageUploadForm = document.getElementById("ImageUploadForm");
const imageInputURL = document.getElementById("imageInputURL");
let imageURL = undefined;
const playButton = document.getElementById("playButton");

const outputAreaContainer = document.getElementById('outputAreaContainer');
let summaryOutput = document.getElementById('summaryOutput');
let solutionOutput = document.getElementById('solutionOutput');

const grid = document.getElementById("grid");
const gridContainer = document.getElementById("gridContainer");

const algorithmDropdown =document.getElementById("algorithmsDropdown");
let htmlMatrix = [[]];

// Dimension inputs
let rowInput = document.getElementById("rowInput");
let colInput = document.getElementById("colInput");
let rowSlider = document.getElementById("rowSlider");
let colSlider = document.getElementById("colSlider");

// CSS stylesheets in doc that allow for dynamic styling
const borderCss = document.getElementById("tileBorderCss");
const backgroundCss = document.getElementById("tileBackgroundCss");
const backgroundflipCss = document.getElementById("backgroundflipCss");

const editGoalButton = document.getElementById('editGoalButton');
const title = document.getElementById('title');


// App state
let puzzleRows = 0;
let puzzleCols = 0;
let solutionAnimating = false;

const resetClickSourceElement = () => {
    // Unselect any tiles before shuffling
    if (clickSourceElement) {

        // Leave sliding tile blank
        if (isNaN(parseInt(clickSourceElement.textContent))) {
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
        if (isNaN(parseInt(dragSourceElement.textContent))) {
            dragSourceElement.style.opacity = '0';
        }
        else {
            dragSourceElement.style.opacity = '1';
        }

        dragSourceElement = undefined;
    }
}



const shufflePuzzle = () => {
    solutionAnimating = false;

    // Unselect any tiles and stop animation before shuffling
    resetClickSourceElement();
    hideOutputTextAreas();
    setPlayMode(false);


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

    const bgPositions = getBackgroundPositions(puzzleRows, puzzleCols);
    for(let row = 0; row < puzzleRows; row++) {
        for(let col = 0; col < puzzleCols; col++) {
            let value = puzzle_arr.shift();
            const tile = htmlMatrix[row][col];
            if (value === 0) {
                tile.textContent = "";
                tile.style.opacity = '0';

                // TODO: Make blank space anywhere for images?  For now I'm taking out 100%, 100% here to use as the bottom right tile
                tile.style.backgroundPosition = '100% 100%';
            }
            else {
                tile.textContent = value;
                tile.style.opacity = '1';
                tile.style.backgroundPosition = `${bgPositions[value].y}% ${bgPositions[value].x}%`;
            }
        }
    }

}


// Gets the position that each tile should be on the background image
const getBackgroundPositions = (rows, cols) => {

    // Step for the even values of percentages between 0-100% for the number of tiles
    // Ex. 3 tiles = [0, 50, 100].  4 tiles = [0, 33.3, 66.6, 100]
    let value = 1;
    const positionsPercentages = {};
    const rowPercentStep = (100 / (rows - 1));
    const colPercentStep = (100 / (cols - 1));
    for(let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++){
            value = value === rows*cols ? '' : value;
            positionsPercentages[value] = {
                x: (rowPercentStep)*(backgroundVerticallyFlipped ? (puzzleRows - 1 - row) : row),
                y: (colPercentStep)*(backgroundHorizontallyFlipped ? (puzzleCols - 1 - col) : col),
            };

            value++;
        }
    }

    return positionsPercentages
}


const getPuzzleFromGridHTML = () => {
    const matrix = Array(puzzleRows).fill().map(() => Array(puzzleCols));
    for (let row = 0; row < puzzleRows; row++) {
        for (let col = 0; col < puzzleCols; col++) {
            const tile = htmlMatrix[row][col];
            if (isNaN(parseInt(tile.textContent))) {   
                matrix[row][col] = 0;
            } else {
                matrix[row][col] = parseInt(tile.textContent);
            }
        }
    }
    
    return Puzzle.fromMatrix(matrix);
}


// https://web.dev/drag-and-drop/
document.addEventListener('DOMContentLoaded', (e) => {
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();

    // Set intial image and add borders so we can toggle on all items without adding one for the grid itself
    borderCss.innerHTML = ".grid-item-border { border: 1px solid black; }";
    backgroundCss.innerHTML = `.grid-item::before { background-image: url('test.jpg'); }`;

    // Make goal puzzle a default goal state with current size;
    goalPuzzle = new Puzzle(puzzleRows, puzzleCols, false);
});



// Workaround for keeping the background image the correct size on window resizes
// Do not have <img> tags that have abosulute positions updated.  Update the CSS class instead and let it handle it
addEventListener('resize', (event) => {
    updateBackgroundImageSize();
    resetBackgroundPositions();
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
const setPlayMode = (enable) => {
    // Stop animation if solution is playing out
    solutionAnimating = false;
    if (enable) {
        if (editingGoalPuzzle) {
            setGoalEditMode(false);
        }

        // Convert to Puzzle to make sure it's solveable before letting user play it
        const startingPuzzle = getPuzzleFromGridHTML();
        if (Puzzle.isPuzzleSolvable2Darr(startingPuzzle.matrix) !== Puzzle.isPuzzleSolvable2Darr(goalPuzzle.matrix)) {
            let errorMessage = "Puzzle is not solvable with current goal state!  Would you like to auto-fix it?\n\n";
            errorMessage += "Auto-fix will swap two adjacent non-blank tiles on the bottom right";
    
            let answer = confirm(errorMessage);
            if (answer) {
                autoFixPuzzle();
            }
        }

        playMode = true;
        playButton.textContent = "Edit Puzzle";
        title.textContent = '';


        playModeResetAllMovableTiles();
        playModeSetMovableTiles();
        hideEditElements();
        hideOutputTextAreas();
    }
    else {
        playMode = false;
        playButton.textContent = "Play Puzzle";

        if (!editingGoalPuzzle){
            title.textContent = "Editing Start";
        }

        clickSourceElement = undefined;
        dragSourceElement = undefined;
        for (row of htmlMatrix) {
            for (tile of row) {
                tile.setAttribute('draggable', true);
                tile.style.pointerEvents = 'auto';
                tile.style.cursor = 'move';
                tile.style.opacity = isNaN(parseInt(tile.textContent)) ? '0' : '1';
            }
        }
        showEditElements();
        hideOutputTextAreas();
    }
}

const hideEditElements = () => {
    editInputsContainer.style.display = 'none';
}

const showEditElements = () => {
    editInputsContainer.style.display = 'flex';
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
    for (let row = 0; row < htmlMatrix.length; row++) {
        for (let col = 0; col < htmlMatrix[row].length; col++) {
            // Make neighbors of blank space clickable if they're in bounds
            if (isNaN(parseInt(htmlMatrix[row][col].textContent))) {
                // Above
                if (row - 1 >= 0) {
                    htmlMatrix[row-1][col].style.pointerEvents = 'auto';
                    htmlMatrix[row-1][col].style.cursor = 'pointer';
                }
                
                // Below
                if (row + 1 <= (htmlMatrix.length - 1)) {
                    htmlMatrix[row+1][col].style.pointerEvents = 'auto';
                    htmlMatrix[row+1][col].style.cursor = 'pointer';
                }

                // Left
                if (col - 1 >= 0) {
                    htmlMatrix[row][col-1].style.pointerEvents = 'auto';
                    htmlMatrix[row][col-1].style.cursor = 'pointer';
                }

                // Right
                if (col + 1 <= (htmlMatrix[row].length - 1)) {
                    htmlMatrix[row][col+1].style.pointerEvents = 'auto';
                    htmlMatrix[row][col+1].style.cursor = 'pointer';
                }
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
    if (newRow > 25) {
        rowInput.value = 25;
        rowSlider.value = 25;
        updateBackgroundImageSize();
        return false;
    }

    if (newCol > 25) {
        colInput.value = 25;
        colSlider.value = 25;
        updateBackgroundImageSize();
        return false;
    }


    // Minimum rows/cols of 2.
    // TODO: Allow 1xN or Nx1 puzzles?
    if (newRow < 2) {
        rowInput.value = 2;
        rowSlider.value = 2;
        updateBackgroundImageSize();
        return false;
    }

    if (newCol < 2) {
        colInput.value = 2;
        colSlider.value = 2;
        updateBackgroundImageSize();
        return false;
    }


    // Only allow strategic algorithm on puzzles that are larger
    // TODO: Optimize IDA* for 4x4?  Don't see the point though..
    //       Easier to compare with other algorithms at 3x3
    if (newRow * newCol > 9) {
        toggleStrategicOnlyAlgorithm(true);
    } else {
        toggleStrategicOnlyAlgorithm(false);
    }


    // Set these new rows/cols to our UI state
    const oldRows = puzzleRows;
    const oldCols = puzzleCols; 
    if (newRow === puzzleRows && newCol === puzzleCols) {
        return false;
    } else {
        puzzleRows = newRow;
        puzzleCols = newCol;
        rowInput.value = newRow;
        colInput.value = newCol;
        rowSlider.value = newRow;
        colSlider.value = newCol;
        resetClickSourceElement();
    }


    // We have a new set of rows and/or cols
    // Optimization: Create a new matrix and re-use tiles that we can to optimize for large images
    // Destroying and recreating 2500+ tiles with large image + event listeners takes up a lot of CPU..
    // Remove extra tiles if are rows/cols are smaller
    // Need to actually call remove child for each element or it will stay in the Puzzle/Grid/UI
    const newHtmlMatrix = Array(newRow).fill().map(() => Array(newCol));
    let rowDiff = puzzleRows - oldRows;
    let colDiff = puzzleCols - oldCols;

    // Remove whole rows first
    if (rowDiff < 0) {
        const rowsToRemove = Math.abs(rowDiff);
        for(let row = oldRows - 1; row >= oldRows - rowsToRemove; row--) {
            htmlMatrix[row].forEach((element, index) => { 
                grid.removeChild(element);
                htmlMatrix[row][index] = null;
            });
        }
    }

    // Remove col from every row
    if (colDiff < 0) {
        const colsToRemove = Math.abs(colDiff);
        for(let row of htmlMatrix) {
            for(let col = oldCols - 1; col >= oldCols - colsToRemove; col--) {
                if (row[col] != null)
                    grid.removeChild(row[col]);
            }
        }
    }

    // Reset our tile background positions and number overlays/ids
    // Add new tiles in if needed
    value = 1;
    const bgPositions = getBackgroundPositions(puzzleRows, puzzleCols);
    for(let row = 0; row < newRow; row++){ 
        for(let col = 0; col < newCol; col++) {
            const tileNum = value === newCol*newRow ? '' : value; // Last tile is blank

            if (row >= oldRows || col >= oldCols) {
                // This is a new row/col, create a new tile
                const tile = document.createElement("div");
                tile.draggable = true;
                tile.textContent = tileNum;
                tile.style.opacity = tileNum ? '1' : '0';
                tile.className = `grid-item grid-item-border`;
                tile.style.backgroundPosition = `${bgPositions[tileNum].y}% ${bgPositions[tileNum].x}%`;

                // Insert tile into grid
                grid.insertBefore(tile, grid.children[value-1]);
                attachTileEventListeners(tile);
                newHtmlMatrix[row][col] = tile;
            } 
            else {
                // We can re-use this tile, copy reference over to the new matrix
                const tile = htmlMatrix[row][col];
                tile.draggable = true;
                tile.textContent = tileNum;
                tile.style.opacity = tileNum ? '1' : '0';
                tile.style.backgroundPosition = `${bgPositions[tileNum].y}% ${bgPositions[tileNum].x}%`;
                newHtmlMatrix[row][col] = tile;
            }
            value++;
        }
    }

    // Update our CSS grid rows + columns, set to have even size throughout
    grid.style.gridTemplateRows = `${'1fr '.repeat(newRow)}`;
    grid.style.gridTemplateColumns = `${'1fr '.repeat(newCol)}`;
    goalPuzzle = new Puzzle(puzzleRows, puzzleCols, false);
    htmlMatrix = newHtmlMatrix;
}

const toggleStrategicOnlyAlgorithm = (strategicOnly) => {

    // Remove all other algorithms since our puzzle space is too large
    if (strategicOnly) {
        for (const child of algorithmDropdown.children) {
            if (child.value !== "Strategic") {
                child.style.display = 'none';
            }
        }

        // Select strategic algorithm in case selection was on another during resizing
        algorithmDropdown.value="Strategic"
    } else {

        // Add the other algorithms back in!
        for (const child of algorithmDropdown.children) {
            child.style.display = 'flex';
        }
    }
}

const updateBackgroundImageSize = () => {
    // Keep our segmented tile background sizes the same as the grid container as window resizes
    grid.style.backgroundSize = `${gridContainer.offsetWidth}px ${gridContainer.offsetHeight}px`;

    // At a certain point, we don't care about seeing the tiles
    if (puzzleCols * puzzleRows > 1000) {
        grid.style.fontSize = 0;
    } else {
        if (showNumbers)
            // Magic formula that will keep number font looking nice and prevent grid from getting out of bounds
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

rowSlider.addEventListener('change', (e) => {
    rowInput.value = rowSlider.value;
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();
});

colSlider.addEventListener('change', (e) => {
    colInput.value = colSlider.value;
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();
});

rowInput.addEventListener('change', (e) => {
    rowSlider.value = rowInput.value;
    updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
    updateBackgroundImageSize();
});

colInput.addEventListener('change', (e) => {
    colSlider.value = colInput.value;
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
    if (playMode || solutionAnimating) {
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
    if (isNaN(parseInt(this.textContent))) {
        this.style.opacity = '0';
    } else {
        this.style.opacity = '1'
    }
  }
}

function handleTileDrop (e) {
    if (playMode || solutionAnimating) {
        return;
    }

    if (dragSourceElement !== this) {
        // Swap dragged tiles
        temp = { text: this.textContent, bgPosition: this.style.backgroundPosition };
        this.textContent = dragSourceElement.textContent;
        this.style.backgroundPosition = dragSourceElement.style.backgroundPosition;
        dragSourceElement.textContent = temp.text;
        dragSourceElement.style.backgroundPosition = temp.bgPosition;
        
        if (isNaN(parseInt(this.textContent))) {
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
    e.preventDefault();

    if (solutionAnimating) {
        return;
    }

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
                        if (row - 1 >= 0 && isNaN(parseInt(htmlMatrix[row-1][col].textContent))) {
                            swapHtmlTiles(htmlMatrix[row-1][col], this);
                        }
                        
                        if (row + 1 <= (htmlMatrix.length - 1) && isNaN(parseInt(htmlMatrix[row+1][col].textContent))) {
                            swapHtmlTiles(htmlMatrix[row+1][col], this);

                        }
        
                        if (col - 1 >= 0 && isNaN(parseInt(htmlMatrix[row][col-1].textContent))) {
                            swapHtmlTiles(htmlMatrix[row][col-1], this);

                        }
        
                        if (col + 1 <= (htmlMatrix[row].length - 1) && isNaN(parseInt(htmlMatrix[row][col+1].textContent))) {
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

// Prevent default and return false to prevent page reload
// Using form onsubmit for free URL validation from URL input tage
function handleImageURL () {
    backgroundCss.innerHTML = `.grid-item::before { background-image: url('${imageInputURL.value}'); }`;
}

function handleImageUpload () {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    if (file && file['type'].split('/')[0] === 'image') {
        const tempImageUrl = URL.createObjectURL(file);
        const img = new Image();
        img.src = tempImageUrl;
        img.onload = function(imgElement) {
            // Use tmp canvas to resize to 500 px wide, scale height at the same rate
            const resizedWidth = 500;
            const canvas = document.createElement('canvas');
            const scaleResize = resizedWidth / imgElement.target.width;
            canvas.width = resizedWidth;
            canvas.height = imgElement.target.height * scaleResize;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement.target, 0, 0, canvas.width, canvas.height);
            ctx.canvas.toBlob((blob) => {
                // Reclaim any used space by the browser after uploading more than one image
                URL.revokeObjectURL(tempImageUrl);
                if (imageURL) {
                    URL.revokeObjectURL(imageURL);
                }

                imageURL = URL.createObjectURL(blob);
                backgroundCss.innerHTML = `.grid-item::before { background-image: url('${imageURL}');}`;
            });
        }
    }
}

const hideOutputTextAreas = () => {
    outputAreaContainer.style.display = 'none';
}

const showOutputTextAreas = () => {
    outputAreaContainer.style.display = 'flex';
}

// Reset our tile background positions and number overlays/ids for the current dimensions
const resetPuzzle = () => {
    solutionAnimating = false;
    setPlayMode(false);
    const bgPositions = getBackgroundPositions(puzzleRows, puzzleCols);
    for(let row = 0; row < puzzleRows; row++){ 
        for(let col = 0; col < puzzleCols; col++) {
            const tile = htmlMatrix[row][col];
            const tileNum = (row * puzzleCols + col + 1) === puzzleRows*puzzleCols ? '' : (row * puzzleCols + col + 1);
            tile.draggable = true;
            tile.textContent = tileNum 
            tile.style.opacity = tileNum ? '1' : '0'
            tile.style.backgroundPosition = `${bgPositions[tileNum].y}% ${bgPositions[tileNum].x}%`;
        }
    }
}


// Resets current puzzle to match a new matrix state
// Mostly for switching in between start and goal states
const updatePuzzleState = (matrix) => {
    if (matrix.length !== puzzleRows || matrix[0].length !== puzzleCols) {
        resetPuzzle();
    } else {
        htmlMatrix.forEach((row, rowIndex) => {
            row.forEach((tile, colIndex) => {
                const tileNum = matrix[rowIndex][colIndex] ? matrix[rowIndex][colIndex] : '';
                tile.draggable = true;
                tile.textContent = tileNum
                tile.style.opacity = tileNum ? '1' : '0';
            });
        });
    }

    resetBackgroundPositions();
}

// Set state to a random solvable puzzle from [2-25 x 2-25]
const randomizePuzzle = async () => {
    const newRow = Math.floor(Math.random() * 25) + 2;
    const newCol = Math.floor(Math.random() * 25) + 2;

    // Update puzzle size if needed
    if (newRow !== puzzleRows || newCol !== puzzleCols) {
        updatePuzzleDimensions(newRow, newCol);
    } else {
        resetClickSourceElement();

        // Always set to default solvable goal when randomizing start
        if (!editingGoalPuzzle)
            goalPuzzle = new Puzzle(puzzleRows, puzzleCols, false);

    }

    if (Math.random() < 0.5)
        toggleBorders();

    if (Math.random() < 0.5)
        toggleNumbers();

    let randomizedPuzzle = null;
    do {
        // 10% chance to just shuffle puzzle, will always be solvable
        if (Math.random() < 0.10) {
            shufflePuzzle();
        } else {
            // Make a more visually interesting randomized puzzle by flipping and rotating
            if (Math.random() < 0.5)
                flipPuzzleHorizontally();

            if (Math.random() < 0.5)
                flipPuzzleVertically();

            if (Math.random() < 0.7);
                rotatePuzzle();
        }

        randomizedPuzzle = getPuzzleFromGridHTML();
    }
    while (!Puzzle.isPuzzleSolvable2Darr(randomizedPuzzle.matrix) || goalPuzzle.isEqualToPuzzle(randomizedPuzzle));

    updateBackgroundImageSize();
}

const flipPuzzleHorizontally = () => {
    console.log("flipPuzzleHorizontally");
    solutionAnimating = false;
    for(let row = 0; row < puzzleRows; row++){ 
        for(let col = 0; col < puzzleCols / 2; col++) {
            swapHtmlTiles(htmlMatrix[row][col], htmlMatrix[row][puzzleCols - 1 - col]);
        }
    }
}

const flipPuzzleVertically = () => {
    console.log("flipPuzzleVertically");
    solutionAnimating = false;
    for(let row = 0; row < puzzleRows / 2; row++){ 
        for(let col = 0; col < puzzleCols; col++) {
            swapHtmlTiles(htmlMatrix[row][col], htmlMatrix[puzzleRows - 1 - row][col]);
        }
    }
}

let backgroundVerticallyFlipped = false;
const flipBackgroundVertically = () => {
    backgroundVerticallyFlipped = !backgroundVerticallyFlipped
    flipBackground();
    resetBackgroundPositions();
}

let backgroundHorizontallyFlipped = false;
const flipBackgroundHorizontally = () => {
    backgroundHorizontallyFlipped = !backgroundHorizontallyFlipped;
    flipBackground();
    resetBackgroundPositions();
}

const flipBackground = () => {
    backgroundflipCss.innerHTML = `
    .grid-item::before {
        transform: scale(${backgroundHorizontallyFlipped ? '-1,':'1,'}${backgroundVerticallyFlipped ? '-1' : '1'});
    }`;
}


const resetBackgroundPositions = () => {
    const bgPositions = getBackgroundPositions(puzzleRows, puzzleCols);
    htmlMatrix.forEach((r, row) => {
        r.forEach((tile, col) => {
            tile.style.backgroundPosition = `${bgPositions[tile.textContent].y}% ${bgPositions[tile.textContent].x}%`
        });
    });
}


// Rotates the puzzle clockwise
// IF puzzle is non-square (NxM), then new puzzle will be (MxN)
const rotatePuzzle = () => {
    console.log("ROTATE PUZZLE");
    solutionAnimating = false;

    // Get original values
    let tempMatrix = Array(puzzleCols).fill().map(() => Array(puzzleRows));
    for (let row = 0; row < puzzleRows; row++){
        for (let col = 0; col < puzzleCols; col++) {
            const tile = htmlMatrix[row][col];
            tempMatrix[col][puzzleRows - 1 - row] = { 
                textContent: tile.textContent,
                opacity: tile.style.opacity,
            }
        }
    }

    // Resize the puzzle on the page if needed
    let resized = false;
    if (puzzleRows !== puzzleCols) { 
        updatePuzzleDimensions(puzzleCols, puzzleRows);
        updateBackgroundImageSize();
        resized = true;
    }

    // Update matrix to have the original tile values
    htmlMatrix.forEach((row, rowIndex) => { 
        row.forEach((tile, colIndex) => {
            const originalTile = tempMatrix[rowIndex][colIndex];
            tile.textContent = originalTile.textContent;
            tile.style.opacity = originalTile.opacity;
        });
    });

    // Get the correct background positions for our new tile layoud
    resetBackgroundPositions();
}

const getColTileValues = (col) => {
    const tempValues = []
    for (let row = 0; row < puzzleRows; row++) {
        tempValues.push(
            {
                textContent: htmlMatrix[row][col].textContent,
                backgroundPosition: htmlMatrix[row][col].style.backgroundPosition
            }
        )
    }

    return tempValues;
}

const getRowTileValues = (row) => {
    const tempValues = []
    for (let col = 0; col < puzzleCols; col++) {
        tempValues.push(
            {
                textContent: htmlMatrix[row][col].textContent,
                backgroundPosition: htmlMatrix[row][col].style.backgroundPosition
            }
        )
    }

    return tempValues;
}

const toggleBorders = () => {
    // Remove border from the dynamic css
    // Using this to set borders on just the tiles and not the grid itself
    if (borderCss.innerHTML === "") {
        borderCss.innerHTML = ".grid-item-border { border: 1px solid black; }";
    } else {
        borderCss.innerHTML = "";
    }
}

let showNumbers = true;
const toggleNumbers = () => {
    if (showNumbers) {
        showNumbers = false;
        grid.style.fontSize = 0;
    } else {
        showNumbers = true;
        updateBackgroundImageSize()
    }
}

    
let editingGoalPuzzle = false;
let goalPuzzle = undefined;
let startingPuzzleState = undefined;
const setGoalEditMode = (enable) => {
    solutionAnimating = false;

    if (enable && !editingGoalPuzzle) {
        // Show editing options
        if (playMode) {
            setPlayMode(false);
        }

        // Store the current puzzle as our starting state
        editingGoalPuzzle = true;
        startingPuzzleState = {
            puzzle: getPuzzleFromGridHTML()
        }

        updatePuzzleState(goalPuzzle.matrix);
        editGoalButton.textContent = "Confirm Goal";
        title.textContent = "Editing Goal";
    } else if (!enable && editingGoalPuzzle) {
        // Save current puzzle as our goal
        editingGoalPuzzle = false;
        goalPuzzle = getPuzzleFromGridHTML();

        const startingPuzzle = startingPuzzleState.puzzle;
        if (puzzleRows === startingPuzzle.rows && puzzleCols === startingPuzzle.cols) {
            updatePuzzleState(startingPuzzle.matrix);
        } else {
            resetPuzzle();
        }

        editGoalButton.textContent = "Edit Goal";
        title.textContent = "Editing Start";
    }
}


// Swaps the two most bottom right non-blank tiles with each other (left/right)
// This inverses the solvability of the puzzle to make things solvable or "unsolvable"
// Allows for user to not have to think about fixing the puzzle after rotating/flipping/etc
const autoFixPuzzle = () => {
    for (let row = puzzleRows - 1; row >= 0; row--) {
        for (let col = puzzleCols - 1; col >= 0; col--) {
            if (col - 1 >= 0) {
                if (htmlMatrix[row][col].textContent && htmlMatrix[row][col - 1].textContent) {
                    swapHtmlTiles(htmlMatrix[row][col], htmlMatrix[row][col-1]);
                    return;
                }
            }
        }
    }
}

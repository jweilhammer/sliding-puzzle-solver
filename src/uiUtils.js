import { Puzzle } from "./Puzzle.js";
import { state } from "./State.js";

// Inject assets into HTML via webpack
import "./style.css";
import Background from "../public/default.jpg";

// Include icons
import Icon180Px from '../public/logo180.png';
import Icon192Px from '../public/logo192.png';
import Icon512Px from '../public/logo512.png';
import IconManifest from '../public/manifest.json';

// Custom inputs
const rowInput = document.getElementById("rowInput");
const colInput = document.getElementById("colInput");
const playButton = document.getElementById("playBtn");
const rowSlider = document.getElementById("rowSlider");
const colSlider = document.getElementById("colSlider");
const editGoalBtn = document.getElementById("editGoalBtn");
const editStartBtn = document.getElementById('editStartBtn');
const imageInputURL = document.getElementById("imageInputURL");
const imageUploadInput = document.getElementById("imageUploadInput");
const quickEditButtons = document.getElementById("quickEditButtons");
const algorithmDropdown = document.getElementById("algorithmsDropdown");
const editInputsContainer = document.getElementById("editInputsContainer");

// Outputs and Puzzle state
const grid = document.getElementById("grid");
const gridContainer = document.getElementById("gridContainer");
const outputAreaContainer = document.getElementById("outputAreaContainer");

// CSS stylesheets in doc that allow for dynamic styling/CSS toggles
const title = document.getElementById("title");
const borderCss = document.getElementById("tileBorderCss");
const backgroundCss = document.getElementById("tileBackgroundCss");
const backgroundflipCss = document.getElementById("backgroundflipCss");

// Toggling SVG icons
const hideNumberSvg = document.getElementById("hideNumberSvg");
const showNumberSvg = document.getElementById("showNumberSvg");
const hideBorderSvg = document.getElementById("hideBorderSvg");
const showBorderSvg = document.getElementById("showBorderSvg");

// Unselects any user selected tile on the visible Puzzle grid
const resetClickSourceTile = () => {
	// Unselect any tiles before shuffling
	if (state.clickSourceTile) {
		// Leave sliding tile blank
		if (isNaN(parseInt(state.clickSourceTile.textContent))) {
			state.clickSourceTile.style.opacity = "0";
		} else {
			state.clickSourceTile.style.opacity = "1";
		}

		state.clickSourceTile = undefined;
	}
};

// Shuffles visible Puzzle grid to a random solvable state
const shufflePuzzle = () => {
	state.solutionAnimating = false;

	// Unselect any tiles and stop animation before shuffling
	resetClickSourceTile();
	hideOutputTextAreas();

	if (!state.editingGoalPuzzle) {
		enableStartEditMode();
	}

	// Get all tile Values in 1D array, plus blank tile (0)
	let tileValue = 1;
	const values = [];
	while (tileValue < state.puzzleRows * state.puzzleCols) {
		values.push(tileValue);
		tileValue++;
	}
	values.push(0);

	let puzzle_arr = [];
    const goalSolvability = Puzzle.isPuzzleSolvable2Darr(state.goalPuzzle.matrix);
	do {
		puzzle_arr = Puzzle.shuffleArray(values);
	} while (Puzzle.isPuzzleSolvable1Darr(puzzle_arr, state.puzzleRows, state.puzzleCols) !== goalSolvability);

	const bgPositions = getBackgroundPositions(state.puzzleRows, state.puzzleCols);
	for (let row = 0; row < state.puzzleRows; row++) {
		for (let col = 0; col < state.puzzleCols; col++) {
			let value = puzzle_arr.shift();
			const tile = state.grid[row][col];
			if (value === 0) {
				tile.textContent = "";
				tile.style.opacity = "0";
				tile.style.backgroundPosition = `${bgPositions[""].y}% ${bgPositions[""].x}%`;
			} else {
				tile.textContent = value;
				tile.style.opacity = "1";
				tile.style.backgroundPosition = `${bgPositions[value].y}% ${bgPositions[value].x}%`;
			}
		}
	}
};

// Gets the position that each tile should be on the background image
// Each tile has a different [x,y] percentage for its "slice" of the background image
const getBackgroundPositions = (rows, cols) => {
	// Step for the even values of percentages between 0-100% for the number of tiles
	// Ex. 3 tiles = [0, 50, 100].  4 tiles = [0, 33.3, 66.6, 100]
	let value = 1;
	const positionsPercentages = {};
	const rowPercentStep = 100 / (rows - 1);
	const colPercentStep = 100 / (cols - 1);
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			value = value === rows * cols ? "" : value;
			positionsPercentages[value] = {
				x: rowPercentStep * (state.backgroundVerticallyFlipped ? state.puzzleRows - 1 - row : row),
				y: colPercentStep * (state.backgroundHorizontallyFlipped ? state.puzzleCols - 1 - col : col),
			};

			value++;
		}
	}

	return positionsPercentages;
};

// Loops over visible puzzle grid elements and returns a Puzzle object with matching matrix
const getPuzzleFromGrid = () => {
	const matrix = Array(state.puzzleRows)
		.fill()
		.map(() => Array(state.puzzleCols));
	for (let row = 0; row < state.puzzleRows; row++) {
		for (let col = 0; col < state.puzzleCols; col++) {
			const tile = state.grid[row][col];
			if (isNaN(parseInt(tile.textContent))) {
				matrix[row][col] = 0;
			} else {
				matrix[row][col] = parseInt(tile.textContent);
			}
		}
	}

	return Puzzle.fromMatrix(matrix);
};

// Adds onclick listeners, sets initial puzzle state, adds initial CSS style toggles
const initializeUiElements = () => {

    // Button onclick event listeners
	document.getElementById("resetBtn").addEventListener("click", resetPuzzle);
	document.getElementById("shuffleBtn").addEventListener("click", shufflePuzzle);
	document.getElementById("randomizeBtn").addEventListener("click", randomizePuzzle);
	document.getElementById("rotatePuzzleBtn").addEventListener("click", rotatePuzzle);
	document.getElementById("imageInputURL").addEventListener("change", handleImageURL);
	document.getElementById("toggleBordersBtn").addEventListener("click", toggleBorders);
	document.getElementById("toggleNumbersBtn").addEventListener("click", toggleNumbers);
	document.getElementById("imageUploadInput").addEventListener("change", handleImageUpload);
	document.getElementById("flipPuzzleVerticalBtn").addEventListener("click", flipPuzzleVertically);
	document.getElementById("flipImageVerticalBtn").addEventListener("click", flipBackgroundVertically);
	document.getElementById("flipPuzzleHorizontalBtn").addEventListener("click", flipPuzzleHorizontally);
	document.getElementById("flipImageHorizontalBtn").addEventListener("click", flipBackgroundHorizontally);
	document.getElementById("editGoalBtn").addEventListener("click", () => {
		enableGoalEditMode();
	});
	playButton.addEventListener("click", () => { enablePlayMode() });
	editStartBtn.addEventListener("click", () => { enableStartEditMode() });


	// Keep puzzle the same dimensions as our row/col inputs
	rowSlider.addEventListener("change", (e) => {
		rowInput.value = rowSlider.value;
		updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
		updateBackgroundImageSize();
	});

	colSlider.addEventListener("change", (e) => {
		colInput.value = colSlider.value;
		updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
		updateBackgroundImageSize();
	});

	rowInput.addEventListener("change", (e) => {
		rowSlider.value = rowInput.value;
		updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
		updateBackgroundImageSize();
	});

	colInput.addEventListener("change", (e) => {
		colSlider.value = colInput.value;
		updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
		updateBackgroundImageSize();
	});


	// Initialize visible puzzle grid
	updatePuzzleDimensions(parseInt(rowInput.value), parseInt(colInput.value));
	updateBackgroundImageSize();

	// Set intial image and add borders so we can toggle on all grid tiles
	// Unable to inherit this from the grid-container
	borderCss.innerHTML = ".grid-item::before { padding: 1px; }";
	borderCss.innerHTML += ".grid-item { border: 1px solid black; padding: 1px }";
	backgroundCss.innerHTML = `.grid-item::before { background-image: url('${Background}'); }`;

	// Make goal puzzle a default goal state with current size
	state.goalPuzzle = new Puzzle(state.puzzleRows, state.puzzleCols, false);

    // Workaround for keeping the background image the correct size on window resizes
    // Do not have <img> tags that have abosulute positions updated.  Update the CSS class instead and let it handle it
    window.addEventListener("resize", (event) => {
        updateBackgroundImageSize();
        resetBackgroundPositions();
    });
};


// Swap two tile elements' attributes on the puzzle grid
const swapGridTiles = (tile1, tile2) => {
	const temp = tile1.textContent;
	const tempBackground = tile1.style.backgroundPosition;
	tile1.textContent = tile2.textContent;
	tile1.style.backgroundPosition = tile2.style.backgroundPosition;
	tile2.textContent = temp;
	tile2.style.backgroundPosition = tempBackground;
	tile1.style.opacity = isNaN(parseInt(tile1.textContent)) ? "0" : "1";
	tile2.style.opacity = isNaN(parseInt(tile2.textContent)) ? "0" : "1";
};


// When play mode set, the user can't edit the puzzle freely
// This lets them play the puzzle by the normal rules:
// The blank tile can only be moved by swapping with one its adjacent neighbors
const enablePlayMode = () => {
	// Stop animation if solution is playing out
	state.solutionAnimating = false;
	disableGoalEditMode();

	// Convert to Puzzle to make sure it's solveable before letting user play it
	const startingPuzzle = getPuzzleFromGrid();
	const goalSolvability = Puzzle.isPuzzleSolvable2Darr(state.goalPuzzle.matrix);
	const puzzleSolvability = Puzzle.isPuzzleSolvable2Darr(startingPuzzle.matrix);
	if (puzzleSolvability !== goalSolvability) {
		let errorMessage = "Puzzle is not solvable with current goal state!\n\nWould you like to auto-fix it?\n\n";
		errorMessage += "(Auto-fix will swap two adjacent non-blank tiles on the bottom right)";

		let answer = confirm(errorMessage);
		if (answer) {
			autoFixPuzzle();
		}
	}

	state.playMode = true;
	title.style.visibility = null;
	title.textContent = "Slide Blank to Solve";
	disableGridTileDragging();
	playModeSetMovableTiles();
	hideEditElements();
	hideQuickEditButtons();
	hideOutputTextAreas();
};


const disablePlayMode = () => {
	title.style.visibility = null;
	state.playMode = false;
	resetClickSourceTile()
	enableGridTileDragging();
	showEditElements();
	showQuickEditButtons();
	hideOutputTextAreas();
}

const enableStartEditMode = () => {
	state.solutionAnimating = false;

	disableGoalEditMode();
	disablePlayMode();
	title.textContent = "Editing Start";
}

const enableGoalEditMode = () => {
	state.solutionAnimating = false;
	if (!state.editingGoalPuzzle) {
		disablePlayMode();


		state.editingGoalPuzzle = true;
		state.startingPuzzle = getPuzzleFromGrid();
		updatePuzzleState(state.goalPuzzle.matrix);
		title.textContent = "Editing Goal";
		title.style.visibility = null;
	}
};

// Saves current puzzle as the goal state
const disableGoalEditMode = () => {
	state.solutionAnimating = false;
	if (state.editingGoalPuzzle) {
		// Save current puzzle as our goal
		state.editingGoalPuzzle = false;
		state.goalPuzzle = getPuzzleFromGrid();

		if (state.puzzleRows === state.startingPuzzle.rows && state.puzzleCols === state.startingPuzzle.cols) {
			updatePuzzleState(state.startingPuzzle.matrix);
		} else {
			state.startingPuzzle = null;
			resetPuzzle();
		}

		editGoalBtn.textContent = "Edit Goal";
		title.textContent = "Editing Start";
		title.style.visibility = null;
	}
}

// Hide/show the edit start controls by changing container's display style
const hideEditElements = () => {
	editInputsContainer.style.display = "none";
};

const showEditElements = () => {
	editInputsContainer.style.display = null;
};

const hideQuickEditButtons = () => {
	quickEditButtons.style.visibility = 'hidden';
}

const showQuickEditButtons = () => {
	quickEditButtons.style.visibility = null;
}


// Set things up for play mode, where user can't drag any tiles
const disableGridTileDragging = () => {
	for (const row of state.grid) {
		for (const tile of row) {
			tile.setAttribute("draggable", false);
			tile.style.pointerEvents = "none";
			tile.style.cursor = "default";
		}
	}
};

// Set things up for edit mode, where user can click/drag any tiles
const enableGridTileDragging = () => {
	for (const row of state.grid) {
		for (const tile of row) {
			tile.setAttribute("draggable", true);
			tile.style.pointerEvents = "auto";
			tile.style.cursor = "move";
			tile.style.opacity = isNaN(parseInt(tile.textContent)) ? "0" : "1";
		}
	}
}

// Set only neighbors of blank space to be clickable so user can slide the puzzle normally
const playModeSetMovableTiles = () => {
	for (let row = 0; row < state.grid.length; row++) {
		for (let col = 0; col < state.grid[row].length; col++) {
			// Make neighbors of blank space clickable if they're in bounds
			if (isNaN(parseInt(state.grid[row][col].textContent))) {
				// Above
				if (row - 1 >= 0) {
					state.grid[row - 1][col].style.pointerEvents = "auto";
					state.grid[row - 1][col].style.cursor = "pointer";
				}

				// Below
				if (row + 1 <= state.grid.length - 1) {
					state.grid[row + 1][col].style.pointerEvents = "auto";
					state.grid[row + 1][col].style.cursor = "pointer";
				}

				// Left
				if (col - 1 >= 0) {
					state.grid[row][col - 1].style.pointerEvents = "auto";
					state.grid[row][col - 1].style.cursor = "pointer";
				}

				// Right
				if (col + 1 <= state.grid[row].length - 1) {
					state.grid[row][col + 1].style.pointerEvents = "auto";
					state.grid[row][col + 1].style.cursor = "pointer";
				}
			}
		}
	}
};

// Update our puzzle grid with new dimensions
// Re-uses as many tiles as possible so eventListeners aren't destroyed unnecessarily
const updatePuzzleDimensions = (newRow, newCol) => {
	state.solutionAnimating = false;

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

	if (newRow * newCol > 9) {
		toggleStrategicOnlyAlgorithm(true);
	} else {
		toggleStrategicOnlyAlgorithm(false);
	}

	// Set these new rows/cols to our UI state
	const oldRows = state.puzzleRows;
	const oldCols = state.puzzleCols;
	if (newRow === state.puzzleRows && newCol === state.puzzleCols) {
		return false;
	} else {
		state.puzzleRows = newRow;
		state.puzzleCols = newCol;
		rowInput.value = newRow;
		colInput.value = newCol;
		rowSlider.value = newRow;
		colSlider.value = newCol;
		resetClickSourceTile();
	}

	// We have a new set of rows and/or cols
	// Optimization: Create a new matrix and re-use tiles that we can to optimize for large images
	// Destroying and recreating 2500+ tiles with large image + event listeners takes up a lot of CPU..
	// Remove extra tiles if are rows/cols are smaller
	// Need to actually call remove child for each element or it will stay in the Puzzle/Grid/UI
	const newGridMatrix = Array(newRow)
		.fill()
		.map(() => Array(newCol));
	let rowDiff = state.puzzleRows - oldRows;
	let colDiff = state.puzzleCols - oldCols;

	// Remove whole rows first
	if (rowDiff < 0) {
		const rowsToRemove = Math.abs(rowDiff);
		for (let row = oldRows - 1; row >= oldRows - rowsToRemove; row--) {
			state.grid[row].forEach((element, index) => {
				grid.removeChild(element);
				state.grid[row][index] = null;
			});
		}
	}

	// Remove col from every row
	if (colDiff < 0) {
		const colsToRemove = Math.abs(colDiff);
		for (let row of state.grid) {
			for (let col = oldCols - 1; col >= oldCols - colsToRemove; col--) {
				if (row[col] != null) grid.removeChild(row[col]);
			}
		}
	}

	// Reset our tile background positions and number overlays/ids
	// Add new tiles in if needed
	let value = 1;
	const bgPositions = getBackgroundPositions(state.puzzleRows, state.puzzleCols);
	for (let row = 0; row < newRow; row++) {
		for (let col = 0; col < newCol; col++) {
			const tileNum = value === newCol * newRow ? "" : value; // Last tile is blank

			if (row >= oldRows || col >= oldCols) {
				// This is a new row/col, create a new tile
				const tile = document.createElement("div");
				tile.draggable = true;
				tile.textContent = tileNum;
				tile.style.opacity = tileNum ? "1" : "0";
				tile.className = `grid-item`;
				tile.style.backgroundPosition = `${bgPositions[tileNum].y}% ${bgPositions[tileNum].x}%`;

				// Insert tile into grid
				grid.insertBefore(tile, grid.children[value - 1]);
				attachTileEventListeners(tile);
				newGridMatrix[row][col] = tile;
			} else {
				// We can re-use this tile, copy reference over to the new matrix
				const tile = state.grid[row][col];
				tile.draggable = true;
				tile.textContent = tileNum;
				tile.style.opacity = tileNum ? "1" : "0";
				tile.style.backgroundPosition = `${bgPositions[tileNum].y}% ${bgPositions[tileNum].x}%`;
				newGridMatrix[row][col] = tile;
			}
			value++;
		}
	}

	// Update our CSS grid rows + columns, set to have even size throughout
	grid.style.gridTemplateRows = `${"1fr ".repeat(newRow)}`;
	grid.style.gridTemplateColumns = `${"1fr ".repeat(newCol)}`;

	// Reset goal puzzle if editing the starting puzzle
	if (!state.editingGoalPuzzle) {
		state.goalPuzzle = new Puzzle(state.puzzleRows, state.puzzleCols, false);
	}

	state.grid = newGridMatrix;
};

// Set algorithm dropdown to only have the strategic algorithm
// This is because all other search algorithms run too long on puzzles greater than 3x3
// Could try to optimize them further, but no point as strategic is more interesting
// Best case is IDA* being able to do "most" 4x4s...
const toggleStrategicOnlyAlgorithm = (strategicOnly) => {
	// Remove all other algorithms since our puzzle space is too large
	if (strategicOnly) {
		for (const child of algorithmDropdown.children) {
			if (child.value !== "Strategic") {
				child.style.display = "none";
			}
		}

		// Select strategic algorithm in case selection was on another during resizing
		algorithmDropdown.value = "Strategic";
	} else {
		// Add the other algorithms back in!
		for (const child of algorithmDropdown.children) {
			child.style.display = "flex";
		}
	}
};

// Updates puzzle grid container's background size to match its actual size
// If window resized withtout this, then the tile's background size will not match grid size
const updateBackgroundImageSize = () => {
	// Keep our segmented tile background sizes the same as the grid container as window resizes
	grid.style.backgroundSize = `${gridContainer.offsetWidth}px ${gridContainer.offsetHeight}px`;

	// At a certain point, we don't care about seeing the tiles
	if (state.puzzleCols * state.puzzleRows > 1000) {
		grid.style.fontSize = 0;
	} else {
		if (showNumbers)
			// Magic formula that will keep number font looking nice and prevent grid from getting out of bounds
			grid.style.fontSize = `${
				(800 * (0.001 * gridContainer.offsetWidth)) / (2 * Math.max(state.puzzleCols, state.puzzleRows))
			}px`;
	}
};

// Prevent default and return false to prevent page reload
// Using form onsubmit for free URL validation from URL input tage
function handleImageURL() {
	backgroundCss.innerHTML = `.grid-item::before { background-image: url('${imageInputURL.value}'); }`;
}


// Handle local image upload, resize to low-ish resolution to handle huge 8k images, etc
const handleImageUpload = () => {
	const file = imageUploadInput.files[0];
	if (file && file["type"].split("/")[0] === "image") {

        // Set dummy img element to have our temp image as source
		const tempImageUrl = URL.createObjectURL(file);
		const img = new Image();
		img.src = tempImageUrl;

		img.onload = function (imgElement) {

			// Use tmp canvas to resize to 500 px wide, scale height at the same rate
			const resizedWidth = 500;
			const canvas = document.createElement("canvas");
			const scaleResize = resizedWidth / imgElement.target.width;
			canvas.width = resizedWidth;
			canvas.height = imgElement.target.height * scaleResize;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(imgElement.target, 0, 0, canvas.width, canvas.height);

			// Convert canvas to object URL to use in css background attribute
			ctx.canvas.toBlob((blob) => {
				// Reclaim any used space by the browser after uploading more than one image
				URL.revokeObjectURL(tempImageUrl);
				if (state.imageURL) {
					URL.revokeObjectURL(state.imageURL);
				}

				state.imageURL = URL.createObjectURL(blob);
				backgroundCss.innerHTML = `.grid-item::before { background-image: url('${state.imageURL}');}`;
			});
		};
	}
};


// Hide/show outputs for our solution summary and move list
const hideOutputTextAreas = () => {
	outputAreaContainer.style.display = "none";
};

const showOutputTextAreas = () => {
	outputAreaContainer.style.display = null;
};

// Reset our tile background positions and number overlays/ids for the current dimensions
const resetPuzzle = () => {
	state.solutionAnimating = false;

	if (!state.editingGoalPuzzle) {
		enableStartEditMode();
	}

	const bgPositions = getBackgroundPositions(state.puzzleRows, state.puzzleCols);
	for (let row = 0; row < state.puzzleRows; row++) {
		for (let col = 0; col < state.puzzleCols; col++) {
			const tile = state.grid[row][col];
			const tileNum =
				row * state.puzzleCols + col + 1 === state.puzzleRows * state.puzzleCols
					? ""
					: row * state.puzzleCols + col + 1;
			tile.draggable = true;
			tile.textContent = tileNum;
			tile.style.opacity = tileNum ? "1" : "0";
			tile.style.backgroundPosition = `${bgPositions[tileNum].y}% ${bgPositions[tileNum].x}%`;
		}
	}

    if (!Puzzle.isPuzzleSolvable2Darr(state.goalPuzzle.matrix)) {
        autoFixPuzzle();
    }
};

// Resets current puzzle to match a new matrix state
// Mostly for switching in between start and goal states
const updatePuzzleState = (matrix) => {
	if (matrix.length !== state.puzzleRows || matrix[0].length !== state.puzzleCols) {
		resetPuzzle();
	} else {
		state.grid.forEach((row, rowIndex) => {
			row.forEach((tile, colIndex) => {
				const tileNum = matrix[rowIndex][colIndex] ? matrix[rowIndex][colIndex] : "";
				tile.draggable = true;
				tile.textContent = tileNum;
				tile.style.opacity = tileNum ? "1" : "0";
			});
		});
	}

	resetBackgroundPositions();
};

// Set state to a random solvable puzzle from [2-25 x 2-25]
// Make a more visually interesting randomized puzzle by flipping and rotating puzzle
const randomizePuzzle = async () => {
	state.solutionAnimating = false;
	resetClickSourceTile();
	if (!state.editingGoalPuzzle) {
		// Always set to default solvable goal when randomizing start
		enableStartEditMode();
		state.goalPuzzle = new Puzzle(state.puzzleRows, state.puzzleCols, false);
	}


	// Random puzzle size (2-25)
	const newRow = Math.floor(Math.random() * 24) + 2;
	const newCol = Math.floor(Math.random() * 24) + 2;

	// Make a temp matrix with default state for transformation
	// Manipulate this instead of the actual grid to save time
	let tempMatrix = Array(newRow)
		.fill()
		.map(() => Array(newCol));
	for (let row = 0; row < newRow; row++) {
		for (let col = 0; col < newCol; col++) {
			let num = row * newCol + col + 1;
			num = num === newRow*newCol ? 0 : num;
			tempMatrix[row][col] = num;
		}
	}

	// 10% chance to just shuffle puzzle, will always be solvable
	let randomizedPuzzle = new Puzzle(newRow, newCol, false);
	do {
		// 10% chance to just shuffle puzzle, will always be solvable
		if (Math.random() < 0.1) {
			const shufflePuzzle = new Puzzle(tempMatrix.length, tempMatrix[0].length, true);
			tempMatrix = shufflePuzzle.matrix;
		} else {
			// Horizontal flip
			if (Math.random() < 0.5 ) {
				for (let row = 0; row < tempMatrix.length; row++) {
					for (let col = 0; col < tempMatrix[0].length / 2; col++) {
						const tmp = tempMatrix[row][col];
						tempMatrix[row][col] = tempMatrix[row][tempMatrix[0].length - 1 - col];
						tempMatrix[row][tempMatrix[0].length - 1 - col] = tmp;
					}
				}
			}

			// Vertical flip
			if (Math.random() < 0.5) {
				for (let row = 0; row < tempMatrix.length / 2; row++) {
					for (let col = 0; col < tempMatrix[0].length; col++) {
						const tmp = tempMatrix[row][col];
						tempMatrix[row][col] = tempMatrix[tempMatrix.length - 1 - row][col];
						tempMatrix[tempMatrix.length - 1 - row][col] = tmp;
					}
				}
			}

			// Clockwise rotation
			if (Math.random() < 0.7) {

				// Make puzzle that is inversed dimensions [col][row]
				const rotatedMatrix = Array(tempMatrix[0].length)
				.fill()
				.map(() => Array(tempMatrix.length));
				for (let row = 0; row < tempMatrix.length; row++) {
					for (let col = 0; col < tempMatrix[0].length; col++) {
						rotatedMatrix[col][tempMatrix.length - 1 - row] = tempMatrix[row][col];
					}
				}

				tempMatrix = rotatedMatrix;

				// Will need to resize goal puzzle after rotating non-square tempmatrix
				if (state.goalPuzzle.rows !== tempMatrix.length || state.goalPuzzle.cols !== tempMatrix[0].length) {
					state.goalPuzzle = new Puzzle(tempMatrix.length,  tempMatrix[0].length, false);
				}
			}
		}

		randomizedPuzzle.matrix = tempMatrix;
	} while (!Puzzle.isPuzzleSolvable2Darr(tempMatrix) || state.goalPuzzle.isEqualToPuzzle(randomizedPuzzle));

	if (Math.random() < 0.5) toggleBorders();
	if (Math.random() < 0.5) toggleNumbers();
	updatePuzzleDimensions(tempMatrix.length, tempMatrix[0].length);
	updateBackgroundImageSize();
	updatePuzzleState(tempMatrix);
};


// Flips the puzzle grid tiles horizontally, inverts on x axists
const flipPuzzleHorizontally = () => {
	state.solutionAnimating = false;
	for (let row = 0; row < state.puzzleRows; row++) {
		for (let col = 0; col < state.puzzleCols / 2; col++) {
			swapGridTiles(state.grid[row][col], state.grid[row][state.puzzleCols - 1 - col]);
		}
	}
};

// Flips the puzzle grid tiles vertically, inverts on y axists
const flipPuzzleVertically = () => {
	state.solutionAnimating = false;
	for (let row = 0; row < state.puzzleRows / 2; row++) {
		for (let col = 0; col < state.puzzleCols; col++) {
			swapGridTiles(state.grid[row][col], state.grid[state.puzzleRows - 1 - row][col]);
		}
	}
};


// Toggles to flip the background image itself via CSS
// Does not affect tile/number order on the puzzle grid
const flipBackgroundVertically = () => {
	state.backgroundVerticallyFlipped = !state.backgroundVerticallyFlipped;
	flipBackground();
	resetBackgroundPositions();
};

const flipBackgroundHorizontally = () => {
	state.backgroundHorizontallyFlipped = !state.backgroundHorizontallyFlipped;
	flipBackground();
	resetBackgroundPositions();
};

const flipBackground = () => {
	backgroundflipCss.innerHTML = `
    .grid-item::before {
        transform: scale(${state.backgroundHorizontallyFlipped ? "-1," : "1,"}${state.backgroundVerticallyFlipped ? "-1" : "1"});
    }`;
};

const resetBackgroundPositions = () => {
	const bgPositions = getBackgroundPositions(state.puzzleRows, state.puzzleCols);
	state.grid.forEach((r, row) => {
		r.forEach((tile, col) => {
			tile.style.backgroundPosition = `${bgPositions[tile.textContent].y}% ${bgPositions[tile.textContent].x}%`;
		});
	});
};

// Rotates the puzzle clockwise
// IF puzzle is non-square (NxM), then new puzzle will be (MxN)
const rotatePuzzle = () => {
	state.solutionAnimating = false;

	// Get original values
	let tempMatrix = Array(state.puzzleCols)
		.fill()
		.map(() => Array(state.puzzleRows));
	for (let row = 0; row < state.puzzleRows; row++) {
		for (let col = 0; col < state.puzzleCols; col++) {
			const tile = state.grid[row][col];
			tempMatrix[col][state.puzzleRows - 1 - row] = {
				textContent: tile.textContent,
				opacity: tile.style.opacity,
			};
		}
	}

	// Resize the puzzle on the page if needed
	let resized = false;
	if (state.puzzleRows !== state.puzzleCols) {
		updatePuzzleDimensions(state.puzzleCols, state.puzzleRows);
		updateBackgroundImageSize();
		resized = true;
	}

	// Update matrix to have the original tile values
	state.grid.forEach((row, rowIndex) => {
		row.forEach((tile, colIndex) => {
			const originalTile = tempMatrix[rowIndex][colIndex];
			tile.textContent = originalTile.textContent;
			tile.style.opacity = originalTile.opacity;
		});
	});

	// Get the correct background positions for our new tile layoud
	resetBackgroundPositions();
};

const toggleBorders = () => {
	// Remove border from the dynamic css
	// Using this to set borders on just the tiles and not the grid itself
	if (borderCss.innerHTML === "") {
		// Fixes issues when flipping image and background somehow gets 1px smaller
		borderCss.innerHTML = ".grid-item::before { padding: 1px; }";
		borderCss.innerHTML += ".grid-item { border: 1px solid black; padding: 1px }";

		hideBorderSvg.style.display = null;
		showBorderSvg.style.display = "none";
	} else {
		borderCss.innerHTML = "";
		hideBorderSvg.style.display = "none";
		showBorderSvg.style.display = null;
	}
};

let showNumbers = true;
const toggleNumbers = () => {
	if (showNumbers) {
		showNumbers = false;
		grid.style.fontSize = 0;
		showNumberSvg.style.display = null;
		hideNumberSvg.style.display = "none";
	} else {
		showNumbers = true;
		showNumberSvg.style.display = "none";
		hideNumberSvg.style.display = null;
		updateBackgroundImageSize();
	}
};



// Swaps the two most bottom right non-blank tiles with each other (left/right)
// This inverses the solvability of the puzzle to make things solvable or "unsolvable"
// Allows for user to not have to think about fixing the puzzle after rotating/flipping/etc
const autoFixPuzzle = () => {
	for (let row = state.puzzleRows - 1; row >= 0; row--) {
		for (let col = state.puzzleCols - 1; col >= 0; col--) {
			if (col - 1 >= 0) {
				if (state.grid[row][col].textContent && state.grid[row][col - 1].textContent) {
					swapGridTiles(state.grid[row][col], state.grid[row][col - 1]);
					return;
				}
			}
		}
	}
};

const animateMoveList = async (startingPuzzle, moveList) => {
	// Show output area before starting animation
	showOutputTextAreas();
	showQuickEditButtons();
	title.style.visibility = "hidden";

	state.solutionAnimating = true;
	let blankRow = startingPuzzle.blankRow;
	let blankCol = startingPuzzle.blankCol;

	// 200 ms for 3x3 (9 tiles).  Get faster as the puzzle scales up
	// Apparently 4ms will run slightly faster than 0 since the min timeout is 4ms by default
	let moveDelayMs = Math.max(1800 / (state.puzzleRows * state.puzzleCols), 4);
	for (const move of moveList) {
		// Only move tiles if our solution is allowed to animate
		if (!state.solutionAnimating) {
			return;
		}

		if (move === "RIGHT") {
			swapGridTiles(state.grid[blankRow][blankCol], state.grid[blankRow][blankCol + 1]);
			blankCol++;
		} else if (move === "LEFT") {
			swapGridTiles(state.grid[blankRow][blankCol], state.grid[blankRow][blankCol - 1]);
			blankCol--;
		} else if (move === "UP") {
			swapGridTiles(state.grid[blankRow][blankCol], state.grid[blankRow - 1][blankCol]);
			blankRow--;
		} else if (move === "DOWN") {
			swapGridTiles(state.grid[blankRow][blankCol], state.grid[blankRow + 1][blankCol]);
			blankRow++;
		}

		await new Promise((r) => setTimeout(r, moveDelayMs));
	}

	state.solutionAnimating = false;

	// Let user click around after finishing solving as we're not really in play or edit mode
	disableGridTileDragging();
	playModeSetMovableTiles();
	state.playMode = true;
};

const checkPuzzleBeforeAnimating = () => {
	// Set state back to starting puzzle if looking at goal
	showQuickEditButtons();
	disableGoalEditMode()

	let startingPuzzle = getPuzzleFromGrid();
	if (Puzzle.isPuzzleSolvable2Darr(startingPuzzle.matrix) !== Puzzle.isPuzzleSolvable2Darr(state.goalPuzzle.matrix)) {
		let errorMessage = "Puzzle is not solvable with current goal state!\n\nWould you like to auto-fix it?\n\n";
		errorMessage += "(Auto-fix will swap two adjacent non-blank tiles on the bottom right)";

		let answer = confirm(errorMessage);
		if (answer) {
			autoFixPuzzle();
			startingPuzzle = getPuzzleFromGrid();
		} else {
			// Let user be able to fix themselves
			enableStartEditMode();
			return null;
		}
	}

	// Hide our input elements so the output is clear to see when animating
	resetClickSourceTile();
	hideEditElements();
	hideOutputTextAreas();

	return startingPuzzle;
};

// Attaches drag/drop/click/touch event listeneres for swapping tiles in the puzzle grid
const attachTileEventListeners = (tile) => {
	// Prevents highlighting with cursor
	tile.style.cursor = "move";
	tile.setAttribute("unselectable", "on");

	// Desktop puzzle customization with drag API
	tile.addEventListener("dragstart", handleTileDragStart);
	tile.addEventListener("drop", handleTileDrop);
	tile.addEventListener("dragend", handleTileDragEnd);
	tile.addEventListener("dragover", handleTileDragOver);

	// Mobile and desktop point and swap puzzle customization
	tile.addEventListener("click", handleTileTouchAndCLick);
	tile.addEventListener("touchstart", handleTileTouchAndCLick);
};

// Tile event listeners for swapping with drag/drop/click/touch
function handleTileDragOver(e) {
	e.preventDefault();
	return false;
}

function handleTileDragStart(e) {
	if (state.playMode || state.solutionAnimating) {
		return;
	}

	this.style.opacity = "0.4";
	state.dragSourceTile = this;

	e.dataTransfer.effectAllowed = "move";
	e.dataTransfer.setData("text/html", this.innerHTML);

	// Unselect clicked tile if we're dragging a different one
	if (this !== state.clickSourceTile) {
		resetClickSourceTile();
	}
}

function handleTileDragEnd(e) {
	// Keep this tile highlighted if it's clicked
	if (this === state.clickSourceTile) {
		state.dragSourceTile = undefined; // reset without unselecting
	} else {
		if (isNaN(parseInt(this.textContent))) {
			this.style.opacity = "0";
		} else {
			this.style.opacity = "1";
		}
	}
}

function handleTileDrop(e) {
	if (state.playMode || state.solutionAnimating) {
		return;
	}

	if (state.dragSourceTile !== this) {
		// Swap dragged tiles
		const temp = { text: this.textContent, bgPosition: this.style.backgroundPosition };
		this.textContent = state.dragSourceTile.textContent;
		this.style.backgroundPosition = state.dragSourceTile.style.backgroundPosition;
		state.dragSourceTile.textContent = temp.text;
		state.dragSourceTile.style.backgroundPosition = temp.bgPosition;

		if (isNaN(parseInt(this.textContent))) {
			this.style.opacity = "0";
		} else {
			this.style.opacity = "1";
		}

		// Don't keep click selection if dragging that same tile after clicking it
		if (state.dragSourceTile === state.clickSourceTile) {
			resetClickSourceTile();
		}
	}

	// Select this tile as clicked, makes mini/accidental drags feel more natural
	if (state.dragSourceTile === this) {
		this.style.opacity = "0.4";
		state.clickSourceTile = this;
	}

	return false;
}

// This is so mobile can customize puzzles without having to jump through hoops
// Mobile HTML5 drop and drag not supported natively: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
function handleTileTouchAndCLick(e) {
	// Stop zooming when double clicking tiles on mobile
	e.preventDefault();

	if (state.solutionAnimating) {
		return;
	}

	if (state.clickSourceTile && !state.playMode) {
		// Unselect same tile after double click
		if (state.clickSourceTile === this) {
			resetClickSourceTile();
		} else {
			// Swap the two different tiles
			if (!state.playMode) {
				swapGridTiles(state.clickSourceTile, this);
				resetClickSourceTile();
			}
		}
	} else {
		if (state.playMode) {
			// need indices for checking neighbors
			for (let row = 0; row < state.grid.length; row++) {
				for (let col = 0; col < state.grid[row].length; col++) {
					// Make neighbors of blank space clickable if they're in bounds
					if (this === state.grid[row][col]) {
						if (row - 1 >= 0 && isNaN(parseInt(state.grid[row - 1][col].textContent))) {
							swapGridTiles(state.grid[row - 1][col], this);
						}

						if (row + 1 <= state.grid.length - 1 && isNaN(parseInt(state.grid[row + 1][col].textContent))) {
							swapGridTiles(state.grid[row + 1][col], this);
						}

						if (col - 1 >= 0 && isNaN(parseInt(state.grid[row][col - 1].textContent))) {
							swapGridTiles(state.grid[row][col - 1], this);
						}

						if (
							col + 1 <= state.grid[row].length - 1 &&
							isNaN(parseInt(state.grid[row][col + 1].textContent))
						) {
							swapGridTiles(state.grid[row][col + 1], this);
						}
					}
				}
			}
			resetClickSourceTile();
			disableGridTileDragging();
			playModeSetMovableTiles();
		} else {
			// Visually select this tile
			this.style.opacity = "0.4";
			state.clickSourceTile = this;
		}
	}
}


export { animateMoveList, checkPuzzleBeforeAnimating, initializeUiElements };
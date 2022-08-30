// Overall strategy derived from: https://www.wikihow.com/Solve-Slide-Puzzles
// Actual algorithm needs to check lots of things when moving tiles that a human could just "see"
//
// If the puzzle is non-square, solve rows or columns first until remaining unsolved puzzle is square
// Then alternate between solving rows and columns until it's a 2x2
// Once a tile has been solved, never touch it again: each solved row/col reduces the effective problem space
const solvePuzzleStrategically = (puzzle, goalState) => {
	const startTime = performance.now();

	// Check if our puzzle is already solved
	const goalPuzzle = Puzzle.fromMatrix(goalState);
	if (goalPuzzle.isEqualToPuzzle(puzzle)) {
		return {
			solutionPuzzle: puzzle,
			runtimeMs: 0,
			solutionMoves: [],
			maxPuzzlesInMemory: 1,
		};
	}

	const solutionMoves = [];
	puzzle.solutionMoves = solutionMoves;
	const goalMapping = Puzzle.getMatrixMapping(goalState); // {0: {row: 2, col: 2}}

	// Set state for our effective bounds of the unsolved puzzle
	// If we've solved a row/col, then we will never move into it again
	puzzle.topRowProgress = 0;
	puzzle.leftColProgress = 0;
	puzzle.botRowProgress = puzzle.rows - 1;
	puzzle.rightColProgress = puzzle.cols - 1;

	// Start by solving rows top -> bottom and columns left -> right
	puzzle.rowInProgress = 0;
	puzzle.colInProgress = 0;
	puzzle.rowProgressCol = 0;
	puzzle.colProgressRow = 0;
	puzzle.solvingRowTopDown = true;
	puzzle.solvingColLeftRight = true;
	while (!goalPuzzle.isEqualToPuzzle(puzzle)) {
		// While we have more than 2 unsolved rows (stopping at 2x2)
		// If there are more or equal unsolved rows than columns, solve rows
		while (moreThanTwoUnsolvedRows(puzzle) && moreUnsolvedRowsThanCols(puzzle)) {
			
			// If the row is solved, then move on
			// Handles pre-solved rows and allows us to loop on unsolved rows/cols and increment after finishing
			// For custom goal states: stop when we reach the blank's row on the goal puzzle
			puzzle.solvingRow = true;
			if (rowFinishedAndNotInGoalRow(goalPuzzle, puzzle)) {

				// Increment up or down depending on which way we're solving
				if (puzzle.solvingRowTopDown) {
					puzzle.topRowProgress++;
					puzzle.rowInProgress = puzzle.topRowProgress;
				} else {
					puzzle.botRowProgress--;
					puzzle.rowInProgress = puzzle.botRowProgress;
				}

				// Set progress to left corner of row
				puzzle.rowProgressCol = 0;
			} else {

				if (puzzle.solvingRowTopDown) {

					// Once we've reached the goal state's blank row, start solving from the bottom
					if (puzzle.rowInProgress === goalPuzzle.blankRow) {
						puzzle.solvingRowTopDown = false;
						puzzle.rowInProgress = puzzle.botRowProgress;
					} else {

						// If not in the blank's goal row, then keep solving from the top
						puzzle.rowInProgress = puzzle.topRowProgress;
					}
				} else {
					puzzle.rowInProgress = puzzle.botRowProgress;
				}

				let rowIteration = 0;
				targetValue = goalState[puzzle.rowInProgress][puzzle.rowProgressCol];
				while (!Puzzle.isRowEqual(goalPuzzle, puzzle, puzzle.rowInProgress)) {

					// Guard against infinite loops if they may occur
					// NOTE: Likely not needed, but feels better having it in since I can't test every single starting Puzzle state
					if (rowIteration > 1) {
						return false;
					}

					if (rowIteration > 0) {
						puzzle.printPuzzle();
						goalPuzzle.printPuzzle();
						return false;
					}

					// We are not on the last two tiles of the row, solve normally and increment across the row
					if (targetValue !== goalState[puzzle.rowInProgress][puzzle.rightColProgress - 1]) {
						moveTile(puzzle, targetValue, goalMapping[targetValue].row, goalMapping[targetValue].col);
						puzzle.rowProgressCol++;
						targetValue = goalState[puzzle.rowInProgress][puzzle.rowProgressCol];
					} else {
						/*
						  We are on the last two values of the row
						  These are special and need to be moved together
						*/
						const lastValue = goalState[puzzle.rowInProgress][puzzle.rightColProgress];
						if (puzzle.solvingRowTopDown) {
							/*
							  1. Move last value two row below its goal
							     At least two rows out of the way will guarentee it won't get in a bad position
							  2. Move our 2nd to last value into the last value's goal position (corner)
							  3. Move our last value to below the 2nd to last value
							*/
							moveTile(puzzle, lastValue, goalMapping[lastValue].row + 2, goalMapping[lastValue].col);
							moveTile(puzzle, targetValue, goalMapping[lastValue].row, goalMapping[lastValue].col);
							moveTile(puzzle, lastValue, goalMapping[lastValue].row + 1, goalMapping[lastValue].col);

							/* 
							  Move to left of our 2nd to last value and slide into place
							  [ 1, 0, 2 ]
							  [ x, x, 3 ]
							  [ x, x, x ]
							*/
							moveBlankToCol(puzzle, goalMapping[lastValue].col - 1);
							moveBlankToRow(puzzle, goalMapping[lastValue].row);
							puzzle.slideRight();
							puzzle.slideDown();
							solutionMoves.push("RIGHT");
							solutionMoves.push("DOWN");

							// Reset the target in case we somehow got into a bad state
							rowIteration++;
							puzzle.rowProgressCol = 0;
							targetValue = goalState[puzzle.rowInProgress][puzzle.rowProgressCol];
						} else {

							// We're solving a row on the bottom.  Same logic as top, but flipped
							moveTile(puzzle, lastValue, goalMapping[lastValue].row - 2, goalMapping[lastValue].col);
							moveTile(puzzle, targetValue, goalMapping[lastValue].row, goalMapping[lastValue].col);
							moveTile(puzzle, lastValue, goalMapping[lastValue].row - 1, goalMapping[lastValue].col);
							moveBlankToCol(puzzle, goalMapping[lastValue].col - 1);
							moveBlankToRow(puzzle, goalMapping[lastValue].row);
							puzzle.slideRight();
							puzzle.slideUp();
							solutionMoves.push("RIGHT");
							solutionMoves.push("UP");

							// Reset the target in case we somehow got into a bad state
							rowIteration++;
							puzzle.rowProgressCol = 0;
							targetValue = goalState[puzzle.rowInProgress][puzzle.rowProgressCol];
						}
					}
				}
			}
		}

		// While there are more unsolved columns than rows, solve columns.  Stop at 2x2
		while (moreThanTwoUnsolvedCols(puzzle) && moreUnsolvedColsThanRows(puzzle)) {

			// If the col is solved, then move on
			// Handles pre-solved columns and allows us to loop on unsolved rows/cols and increment after finishing
			puzzle.solvingRow = false;
			if (colFinishedAndNotInGoalCol(goalPuzzle, puzzle)) {
				puzzle.colProgressRow = 0;

				// Increment up or down depending on which way we're solving
				if (puzzle.solvingColLeftRight) {
					puzzle.leftColProgress++;
					puzzle.colInProgress = puzzle.leftColProgress;
				} else {
					puzzle.rightColProgress--;
					puzzle.colInProgress = puzzle.rightColProgress;
				}
			} else {
				if (puzzle.solvingColLeftRight) {

					// Once we've reached the goal state's blank col, start solving from the right
					if (puzzle.colInProgress === goalPuzzle.blankCol) {
						puzzle.solvingColLeftRight = false;
						puzzle.colInProgress = puzzle.rightColProgress;
					} else {
						// If not in the blank's goal row, then keep solving from the top
						puzzle.colInProgress = puzzle.leftColProgress;
					}
				} else {
					puzzle.colInProgress = puzzle.rightColProgress;
				}

				let colIteration = 0;
				targetValue = goalState[puzzle.topRowProgress][puzzle.colInProgress];
				while (!Puzzle.isColEqual(goalPuzzle, puzzle, puzzle.colInProgress)) {

					// Guard against infinite loops if they may occur
					// NOTE: Likely not needed, but feels better having it in since I can't test every single starting Puzzle state
					if (colIteration > 1) {
						return false;
					}

					if (colIteration > 0) {
						puzzle.printPuzzle();
						goalPuzzle.printPuzzle();
						return false;
					}

					// We are not moving the last two tiles of the column, solve normally and increment down the col
					if (targetValue !== goalState[puzzle.botRowProgress - 1][puzzle.colInProgress]) {
						moveTile(puzzle, targetValue, goalMapping[targetValue].row, goalMapping[targetValue].col);
						puzzle.colProgressRow++;
						targetValue = goalState[puzzle.colProgressRow][puzzle.colInProgress];
					} else {
						/*
						  We are on the last two values of the column
						  These are special and need to be moved together
						*/
						const lastValue = goalState[puzzle.botRowProgress][puzzle.colInProgress];
						if (puzzle.solvingColLeftRight) {
							/*                          
							  1. Move last value two cols right of its goal
							     At least two cols out of the way will guarentee it won't get in a bad position
							  2. Move our 2nd to last value into the last value's goal position (corner)
							  3. Move our last value to the right of the 2nd to last value
							*/
							moveTile(puzzle, lastValue, goalMapping[lastValue].row, goalMapping[lastValue].col + 2);
							moveTile(puzzle, targetValue, goalMapping[lastValue].row, goalMapping[lastValue].col);
							moveTile(puzzle, lastValue, goalMapping[lastValue].row, goalMapping[lastValue].col + 1);

							/*
							  Move above of our 2nd to last value and slide into place 
							  [ 1, x, x ]
							  [ 0, x, x ]
							  [ 4, 7, x ]
							*/
							moveBlankToRow(puzzle, goalMapping[lastValue].row - 1);
							moveBlankToCol(puzzle, goalMapping[lastValue].col);
							puzzle.slideDown();
							puzzle.slideRight();
							solutionMoves.push("DOWN");
							solutionMoves.push("RIGHT");

							// Reset the target in case we somehow got into a bad state
							colIteration++;
							puzzle.colProgressRow = 0;
							targetValue = goalState[puzzle.colProgressRow][puzzle.colInProgress];
						} else {

							// We're solving a column on the right.  Same logic as left, but flipped
							moveTile(puzzle, lastValue, goalMapping[lastValue].row, goalMapping[lastValue].col - 2);
							moveTile(puzzle, targetValue, goalMapping[lastValue].row, goalMapping[lastValue].col);
							moveTile(puzzle, lastValue, goalMapping[lastValue].row, goalMapping[lastValue].col - 1);
							moveBlankToRow(puzzle, goalMapping[lastValue].row - 1);
							moveBlankToCol(puzzle, goalMapping[lastValue].col);
							puzzle.slideDown();
							puzzle.slideLeft();
							solutionMoves.push("DOWN");
							solutionMoves.push("LEFT");

							// Reset the target in case we somehow got into a bad state
							colIteration++;
							puzzle.colProgressRow = 0;
							targetValue = goalState[puzzle.colProgressRow][puzzle.colInProgress];
						}
					}
				}
			}
		}

		// When down to a 2x2, rotate blank in circles until in goal state
		// Alternate between vertical and horizontal slides while staying in bounds
		if (unsolvedPuzzleIsTwoByTwo(puzzle)) {
			let iterations = 0;
			let slideVertically = true;
			while (!goalPuzzle.isEqualToPuzzle(puzzle)) {
				if (slideVertically) {
					if (puzzle.canSlideDown() && puzzle.blankRow - 1 <= goalPuzzle.blankRow - 1) {
						puzzle.slideDown();
						solutionMoves.push("DOWN");
					} else {
						puzzle.slideUp();
						solutionMoves.push("UP");
					}

					slideVertically = false;
				} else {
					if (puzzle.canSlideRight() && puzzle.blankCol + 1 <= goalPuzzle.blankCol + 1) {
						puzzle.slideRight();
						solutionMoves.push("RIGHT");
					} else {
						puzzle.slideLeft();
						solutionMoves.push("LEFT");
					}
					slideVertically = true;
				}

				iterations++;

				// Should have hit all the states after moving 12 times
				// The fact puzzle is still not solved means something went wrong
				// NOTE: Likely not needed, but leaving in just in case
				if (iterations > 20) {
					console.log("Something wen't wrong :-(");
					puzzle.printPuzzle();
					goalPuzzle.printPuzzle();
					return false;
				}
			}
		}
	}

	const endTime = performance.now();
	return {
		solutionPuzzle: puzzle,
		runtimeMs: endTime - startTime,
		solutionMoves: solutionMoves,
		maxPuzzlesInMemory: 1,
	};
};

// Moves tile into it's goal state with different logic depending if we're solving a row or column
// When solving rows, position tile col first (left/right) and then row (up/down)
// When solving cols, position tile row first (up/down) and then col (left/right)
// Prevents cases where moving tile displaces already solved tiles
const moveTile = (puzzle, value, goalRow, goalCol) => {
	const matrixMapping = Puzzle.getMatrixMapping(puzzle.matrix);
	valueRow = matrixMapping[value].row;
	valueCol = matrixMapping[value].col;

	// Tile already in it's correct position
	if (valueRow === goalRow && valueCol === goalCol) {
		return;
	}

	const tile = { value, row: valueRow, col: valueCol, goalRow, goalCol };
	if (puzzle.solvingRow) {
		// Left
		while (tile.col > goalCol) {
			moveTileLeft(puzzle, tile);
			tile.col--;
		}

		// Right
		while (tile.col < goalCol) {
			moveTileRight(puzzle, tile);
			tile.col++;
		}

		// Up
		while (tile.row > goalRow) {
			moveTileUp(puzzle, tile);
			tile.row--;
		}

		// Down
		while (tile.row < goalRow) {
			moveTileDown(puzzle, tile);
			tile.row++;
		}
	} else {
        // Solving column

		// Up
		while (tile.row > goalRow) {
			moveTileUp(puzzle, tile);
			tile.row--;
		}

		// Down
		while (tile.row < goalRow) {
			moveTileDown(puzzle, tile);
			tile.row++;
		}

		// Left
		while (tile.col > goalCol) {
			moveTileLeft(puzzle, tile);
			tile.col--;
		}

		// Right
		while (tile.col < goalCol) {
			moveTileRight(puzzle, tile);
			tile.col++;
		}
	}
};

const moveTileLeft = (puzzle, tile) => {
	// Blank tile is to the right of value and in the same row
	if (puzzle.blankCol > tile.col && tile.row === puzzle.blankRow) {
		moveBlankUpOrDown(puzzle);
	}

	// Moving tile into its goal column on the left side
	if (!puzzle.solvingRow && puzzle.solvingColLeftRight) {

		// Tile is one right of our column in progress
		if (tile.col === puzzle.colInProgress + 1) {

			// Tile not in last row
			if (tile.row !== puzzle.botRowProgress) {

				// Blank is to the right and or above our value, and value not in last row
				// Go right and then down
				if (puzzle.blankCol >= tile.col && puzzle.blankRow < tile.row) {
					moveBlankToCol(puzzle, tile.col + 1);
					moveBlankToRow(puzzle, tile.row + 1);
				}
			} else {
				// If we're in the last row, we're moving the last two pieces
				// Go above it and let default move to left
				moveBlankToRow(puzzle, tile.row - 1);
				moveBlankToCol(puzzle, tile.col);
			}
		}
	}

	// Move to left of tile
	// Since our value is greater than the goal col, there should always be a col to the left of it to move to
	moveBlankToCol(puzzle, tile.col - 1);
	moveBlankToRow(puzzle, tile.row);
	puzzle.slideRight();
	puzzle.solutionMoves.push("RIGHT");
};

const moveTileRight = (puzzle, tile) => {
	// Blank tile is to the right of value and in the same row, avoid going up (solve rows are above)
	if (puzzle.blankCol < tile.col && tile.row === puzzle.blankRow) {
		moveBlankUpOrDown(puzzle);
	}

	if (puzzle.solvingRow) {
		if (puzzle.solvingRowTopDown) {
			// Tile needs to go right, and our blank is in the row in progress
			// If tile is not underneath our blank, then slide the blank down first to get out of our solving row
			if (
				puzzle.blankRow === puzzle.rowInProgress &&
				(puzzle.blankRow + 1 !== tile.row || puzzle.blankCol !== tile.col)
			) {
				if (puzzle.canSlideDown()) {
					puzzle.slideDown();
					puzzle.solutionMoves.push("DOWN");
				}
			}
		} else {
			// We're solving rows bottom to top
			// If tile is not above our blank, then slide the blank down first to get out of our solving row
			if (
				puzzle.blankRow === puzzle.rowInProgress &&
				(puzzle.blankRow - 1 !== tile.row || puzzle.blankCol !== tile.col)
			) {
				if (puzzle.canSlideUp()) {
					puzzle.slideUp();
					puzzle.solutionMoves.push("UP");
				}
			}
		}
	} else {
		// Solving column logic

		// Moving tile into its goal column on the right side
		if (!puzzle.solvingColLeftRight) {

			// Tile is one left of our column in progress
			if (tile.col === puzzle.colInProgress - 1) {

				// Tile not in last row
				if (tile.row !== puzzle.botRowProgress) {

					// Blank is to the left and or above our value, and value not in last row
					// Go left and then DOWN
					if (puzzle.blankCol <= tile.col && puzzle.blankRow < tile.row) {
						moveBlankToCol(puzzle, tile.col - 1);
						moveBlankToRow(puzzle, tile.row + 1);
					}
				} else {
					// If we're in the last row, we're moving the last two pieces
					// Go above it and let default move to right
					moveBlankToRow(puzzle, tile.row - 1);
					moveBlankToCol(puzzle, tile.col);
				}
			}
		}
	}

	// Move to right of tile
	// Since our value is less than the goal col, there should always be a col to the right of it to move to
	moveBlankToCol(puzzle, tile.col + 1);

	moveBlankToRow(puzzle, tile.row);

	puzzle.slideLeft();
	puzzle.solutionMoves.push("LEFT");
};

const moveTileUp = (puzzle, tile) => {
	// Moving tile into its goal row on the top
	if (puzzle.solvingRow && puzzle.solvingRowTopDown) {

		// Tile is in row below our in progress row
		if (tile.row === puzzle.rowInProgress + 1) {

			// Not in last column
			if (tile.col !== puzzle.rightColProgress) {

				// Blank is to the left and/or under the value -> Go down and to the right
				if (puzzle.blankCol <= tile.col && puzzle.blankRow >= tile.row) {
					moveBlankToRow(puzzle, tile.row + 1);
					moveBlankToCol(puzzle, tile.col + 1);
				}
			} else {
				// If value is in last column and we're solving the row, these are the last two pieces
				// Don't move up by default, go right first and then up
				// If values happen to already be in place, going up will displace solved tiles
				moveBlankToCol(puzzle, tile.col - 1);
				moveBlankToRow(puzzle, tile.row);
			}
		}
	}

	// If blank is under the value, move left or right (within bounds)
	if (puzzle.blankRow > tile.row && puzzle.blankCol === tile.col) {
		moveBlankLeftOrRight(puzzle);
	}

	// Move blank above the value and swap
	moveBlankToRow(puzzle, tile.row - 1);
	moveBlankToCol(puzzle, tile.col);
	puzzle.slideDown();
	puzzle.solutionMoves.push("DOWN");
};

const moveTileDown = (puzzle, tile) => {
	// Solving column logic
	if (!puzzle.solvingRow) {
		if (puzzle.solvingColLeftRight) {

			// Tile needs to go down, and the blank is in the column in progress (farthest left column)
			// If tile isn't to the right of the blank, then slide the blank right first to get out of the half-solved column
			if (
				puzzle.blankCol === puzzle.colInProgress &&
				(puzzle.blankCol + 1 !== tile.col || puzzle.blankRow !== tile.row)
			) {
				// Go right instead of left to avoid displacing tiles
				if (puzzle.canSlideRight()) {
					puzzle.slideRight();
					puzzle.solutionMoves.push("RIGHT");
				}
			}
		} else {
			// We're solving columns right to left

			// Tile needs to go down, and the blank is in the column in progress (farthest right column)
			// If tile isn't to the left of the blank, then slide the blank left first to get out of the half-solved column
			if (
				puzzle.blankCol === puzzle.colInProgress &&
				(puzzle.blankCol - 1 !== tile.col || puzzle.blankRow !== tile.row)
			) {
				// Go right instead of left to avoid displacing tiles
				if (puzzle.canSlideLeft()) {
					puzzle.slideLeft();
					puzzle.solutionMoves.push("LEFT");
				}
			}
		}
	}

	if (puzzle.solvingRow && !puzzle.solvingRowTopDown) {

		// Tile is in row above our in progress row
		if (tile.row === puzzle.rowInProgress - 1) {

			// Not in last column
			if (tile.col !== puzzle.rightColProgress) {

				// Blank is to the left and/or above the value -> Go up and to the right
				if (puzzle.blankCol <= tile.col && puzzle.blankRow <= tile.row) {
					moveBlankToRow(puzzle, tile.row - 1);
					moveBlankToCol(puzzle, tile.col + 1);
				}
			} else {
				// If value is in last column and we're solving the row, these are the last two pieces
				// Don't move down by default, go right first and then down
				// If values happen to already be in place, going up will displace solved tiles
				moveBlankToCol(puzzle, tile.col - 1);
				moveBlankToRow(puzzle, tile.row);
			}
		}
	}

	// If blank is above the value, move left or right (within bounds)
	if (puzzle.blankRow < tile.row && puzzle.blankCol === tile.col) {
		moveBlankLeftOrRight(puzzle);
	}

	// Move blank below the value and swap
	moveBlankToRow(puzzle, tile.row + 1);
	moveBlankToCol(puzzle, tile.col);
	puzzle.slideUp();
	puzzle.solutionMoves.push("UP");
};

// Helper method for moving tile up/down when blank is in same col as tile (above/below)
const moveBlankLeftOrRight = (puzzle) => {

	// If blank is in a column in progress, move it out
	if (puzzle.blankCol === puzzle.rightColProgress) {
		puzzle.slideLeft();
		puzzle.solutionMoves.push("LEFT");
	} else if (puzzle.blankCol === puzzle.leftColProgress) {
		puzzle.slideRight();
		puzzle.solutionMoves.push("RIGHT");
	} else {
		// Move blank in the default direction we're solving
		// Unsolved inner puzzle is towards the direction where blank is on goal puzzle
		// This guarentees we won't displace any already solved tiles
		if (puzzle.solvingColLeftRight) {
			puzzle.slideRight();
			puzzle.solutionMoves.push("RIGHT");
		} else {
			puzzle.slideLeft();
			puzzle.solutionMoves.push("LEFT");
		}
	}
};

// Helper method for moving tile left/right when blank is in same row as tile (left/right)
const moveBlankUpOrDown = (puzzle) => {

	// If blank is in a row in progress, move it out
	if (puzzle.blankRow === puzzle.topRowProgress) {
		puzzle.slideDown();
		puzzle.solutionMoves.push("DOWN");
	} else if (puzzle.blankRow === puzzle.botRowProgress) {
		puzzle.slideUp();
		puzzle.solutionMoves.push("UP");
	} else {
		// Move blank in the default direction we're solving
		// Unsolved inner puzzle is towards the direction where blank is on goal puzzle
		// This guarentees we won't displace any already solved tiles
		if (puzzle.solvingRowTopDown) {
			puzzle.slideDown();
			puzzle.solutionMoves.push("DOWN");
		} else {
			puzzle.slideUp();
			puzzle.solutionMoves.push("UP");
		}
	}
};

// Loop until blank is in the target column
const moveBlankToCol = (puzzle, targetCol) => {
	while (puzzle.blankCol !== targetCol) {
		if (puzzle.blankCol < targetCol) {
			puzzle.slideRight();
			puzzle.solutionMoves.push("RIGHT");
		} else {
			puzzle.slideLeft();
			puzzle.solutionMoves.push("LEFT");
		}
	}
};

// Loop until blank is in the target row
const moveBlankToRow = (puzzle, targetRow) => {
	while (puzzle.blankRow !== targetRow) {
		if (puzzle.blankRow < targetRow) {
			puzzle.slideDown();
			puzzle.solutionMoves.push("DOWN");
		} else {
			puzzle.slideUp();
			puzzle.solutionMoves.push("UP");
		}
	}
};

// NOTE: Not needed, but makes things more readable in conditions
const moreThanTwoUnsolvedRows = (puzzle) => {
	return puzzle.botRowProgress + 1 - puzzle.topRowProgress > 2;
};

const moreThanTwoUnsolvedCols = (puzzle) => {
	return puzzle.rightColProgress + 1 - puzzle.leftColProgress > 2;
};

const moreUnsolvedRowsThanCols = (puzzle) => {
	return puzzle.botRowProgress - puzzle.topRowProgress + 1 >= puzzle.rightColProgress + 1 - puzzle.leftColProgress;
};

const moreUnsolvedColsThanRows = (puzzle) => {
	return puzzle.rightColProgress + 1 - puzzle.leftColProgress > puzzle.botRowProgress + 1 - puzzle.topRowProgress;
};

const colFinishedAndNotInGoalCol = (goalPuzzle, puzzle) => {
	return Puzzle.isColEqual(goalPuzzle, puzzle, puzzle.colInProgress) && puzzle.colInProgress !== goalPuzzle.blankCol;
};

const rowFinishedAndNotInGoalRow = (goalPuzzle, puzzle) => {
	return Puzzle.isRowEqual(goalPuzzle, puzzle, puzzle.rowInProgress) && puzzle.rowInProgress !== goalPuzzle.blankRow;
};

const unsolvedPuzzleIsTwoByTwo = (puzzle) => {
    return puzzle.botRowProgress + 1 - puzzle.topRowProgress === 2 && puzzle.rightColProgress + 1 - puzzle.leftColProgress === 2;
}

class Puzzle {
    static slideDirections = {
        "INITIAL": 0,
        "UP": 1,
        "DOWN": 2,
        "LEFT": 3,
        "RIGHT": 4,
    }

    constructor(rows, cols, genRandomPuzzle=true, solvable=true) {
        if (genRandomPuzzle) {
            this.matrix = this.generateRandomPuzzle(rows, cols, solvable);
        } else {
            // Fill matrix with default goal state (in order tiles)
            this.matrix = Array(rows).fill().map(() => Array(cols));
            let value = 1;
            for(let row = 0; row < rows; row++) {
                for(let col=0; col < cols; col++) {
                    this.matrix[row][col] = value === rows * cols ? 0 : value;
                    value++;
                }
            }

            // For custom goal states that aren't visually solvable
            if (!solvable) {
                // Swap last two tiles that aren't the blank space
                // This will make the inversions even/odd making a solvable puzzle unsolvable
                const tmp = this.matrix[rows - 3][col - 3];
                this.matrix[rows - 3][col - 3] = this.matrix[rows - 2][col - 2];
                this.matrix[rows - 2][col - 2] = tmp;
            }
        }
        this.lastSlideDirection = 0;
        this.manhattanSum = 0; // No need to calculate manhatten sum on initial puzzle state
        this.cameFrom = null; // Last puzzle state
        this.costFromStart = 0;
        this.rows = rows;
        this.cols = cols;
    }

    // Create deep copy of another puzzle
    static fromPuzzle(puzzle) {
        let copy = new Puzzle(puzzle.matrix.length, puzzle.matrix[0].length, false);

        for(let row = 0; row < puzzle.matrix.length; row++) {
            for(let col = 0; col < puzzle.matrix[0].length; col++) {
                copy.matrix[row][col] = puzzle.matrix[row][col];
            }
        }
        copy.blankRow = puzzle.blankRow;
        copy.blankCol = puzzle.blankCol;
        copy.manhattanSum = puzzle.manhattanSum;
        copy.costFromStart = puzzle.costFromStart;
        return copy;
    }

    static fromMatrix(matrix) {
        let puzzle = new Puzzle(matrix.length, matrix[0].length, false);

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[0].length; col++) {
                puzzle.matrix[row][col] = matrix[row][col];
                if (!matrix[row][col]) {
                    puzzle.blankRow = row;
                    puzzle.blankCol = col;
                }
            }
        }
        return puzzle;
    }

    static fromArr(arr, rows, cols) {
        const puzzle = new Puzzle(rows, cols, false);

        let arrIndex = 0;
        for (let row = 0; row < puzzle.matrix.length; row++) {
            for (let col = 0; col < puzzle.matrix[row].length; col++) {
                puzzle.matrix[row][col] = arr[arrIndex];
                if (!arr[arrIndex]) {
                    puzzle.blankRow = row;
                    puzzle.blankCol = col;
                }
                arrIndex++;
            }
        }
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
    generateRandomPuzzle(row, col, solvable) {
        // [1 ... N - 1, 0]
        const values = Array.from(Array((row*col)).keys()).slice(1);
        values.push(0);
        let puzzle_arr = [];

        // Default to generating a traditionally "solvable" puzzle, which is 1/2 total possible puzzle states
        // Use flag to generate the other half for allowing custom goal states
        // An "unsolvable" puzzle can be solved if the initial state is also "unsolvable"
        // This allows for custom goal states and showing the solvability of the other half of the puzzle states
        if (solvable) {
            do {
                puzzle_arr = Puzzle.shuffleArray(values);
            } 
            while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr, row, col));
        } else {
            do {
                puzzle_arr = Puzzle.shuffleArray(values);
            } 
            while (Puzzle.isPuzzleSolvable1Darr(puzzle_arr, row, col));
        }


        // Turn 1D array into our Puzzle Matrix from last to first to use arr.pop()
        let puzzle_matrix = Array(row).fill().map(() => Array(col));
        for (let row = 0; row < puzzle_matrix.length; row++) {
            for (let col = 0; col < puzzle_matrix[row].length; col++) {
                const value = puzzle_arr.shift();
                if (!value) {
                    this.blankRow = row;
                    this.blankCol = col;
                }
                puzzle_matrix[row][col] = value;
            }
        }

        return puzzle_matrix;
    }


    canSlideLeft() {
        // Edge guarding on left side
        if (this.blankCol <= 0) {
            return false;
        } else {
            return true;
        }
    }

    canSlideRight() {
        // Edge guarding on current row
        if (this.blankCol >= this.matrix[this.blankRow].length - 1) {
            return false;
        } else {
            return true;
        }
    }

    canSlideUp() {
        // Edge guarding on left side
        if (this.blankRow <= 0) {
            return false;
        } else {
            return true;
        }
    }

    canSlideDown() {
        // Edge guarding on left side
        if (this.blankRow >= this.matrix.length - 1) {
            return false;
        } else {
            return true;
        }
    }
    

    slideLeft() {
        // Edge guarding on left side
        if (this.blankCol <= 0) {
            return false;
        }

        this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow][this.blankCol - 1];
        this.matrix[this.blankRow][this.blankCol - 1] = 0;
        this.blankCol--;
    }


    slideRight() {
        // Edge guarding on current row
        if (this.blankCol >= this.matrix[this.blankRow].length - 1) {
            return false;
        }

        this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow][this.blankCol + 1];
        this.matrix[this.blankRow][this.blankCol + 1] = 0;
        this.blankCol++;
    }


    slideUp() {
        // Edge guarding on left side
        if (this.blankRow <= 0) {
            return false;
        }

        this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow - 1][this.blankCol];
        this.matrix[this.blankRow - 1][this.blankCol] = 0;
        this.blankRow--;
    }

    slideDown() {
        // Edge guarding on left side
        if (this.blankRow >= this.matrix.length - 1) {
            return false;
        }

        this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow + 1][this.blankCol];
        this.matrix[this.blankRow + 1][this.blankCol] = 0;
        this.blankRow++;
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
    static getMatrixMapping(goal_state) {
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

    isInGoalState(goalState) {
        return this.isEqualToPuzzle()
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

    static isRowEqual(puzzle1, puzzle2, rowToCheck) {
        // TODO: Type checks, size checks, etc
        for (let col = 0; col < puzzle1.matrix[rowToCheck].length; col++) {
            if (puzzle1.matrix[rowToCheck][col] !== puzzle2.matrix[rowToCheck][col]) {
                return false;
            }
        }
        return true;
    }

    static isColEqual(puzzle1, puzzle2, colToCheck) {
        // TODO: Type checks, size checks, etc
        for (let row = 0; row < puzzle1.matrix.length; row++) {
            if (puzzle1.matrix[row][colToCheck] !== puzzle2.matrix[row][colToCheck]) {
                return false;
            }
        }
        return true;
    }

    // TODO: Add unit tests!  Does this work for an odd N?  Does this work for NxM?
    /**
    * Takes a 1D array and counts the inversions, returns false if inversions is odd and true if even.
    * Assumes that the solution has the blank tile in the bottom row.
    * 
    * 
    * Inversions the number of preceding tile values that are greater than any value following it left->right + top->down of puzzle
    * A left or right move by the blank does not change inversions count
    * For a puzzle with an odd number of columns, a move by the blank leave the evenness or oddness of inversions unchanged
    * If the number of columns is even, an up or down move by the blank changes inversions by an odd number
    * https://www.cs.mcgill.ca/~newborn/nxp_puzzleOct9.htm
    * 
    * 
    * For my own sanity, including the three example cases here as this math as seemed iffy during development
    * These prove some theoroms that should hold true as they scale out to infinity
    * The odd row, even col case contradicts the above source, but seems to hold true through testing
    * Works well enough for me, and maybe they are wrong ¯\_(ツ)_/¯
    * 
    * 
    * ODD COLS [2x3] (holds true for even and/or odd rows)
    *    [1, 2, 3] == Inversions: 0    even inversions: puzzle is solved
    *    [4, 5, 0]
    * 
    * 1. Up / down:
    *    [1, 2, 0] == Inversions: 2    even inversions: is solvable
    *    [4, 5, 3]
    * 
    * 2. Left / right:
    *    [1, 2, 3] == Inversions: 0    even inversions: is solvable
    *    [4, 0, 5]
    * 
    * 3. Unsolvable state:
    *    [1, 3, 2] == Inversions: 1    odd inversions: is unsolvable
    *    [4, 5, 0]
    * 
    * 
    * 
    * EVEN ROWS AND COLS [2x2]:
    *    [1, 2] == Row of blank: 0   Inversions: 0    0+0 == 0: puzzle is solved
    *    [3, 0]
    * 
    * 1. Up / down:
    *    [1, 0] == Row of blank: 1   Inversions: 1    1+1 == 2: even is solvable
    *    [3, 2]
    * 
    * 2. Left / Right:
    *    [1, 2] == Row of blank: 0   Inversions: 0    0+0 == 0: even is solvable
    *    [0, 3]
    * 
    * 3. Unsolvable state:
    *    [1, 0] == Row of blank: 1   Inversions: 0    1+0 == 1: odd is unsolvable
    *    [2, 3]
    * 
    * 
    * 
    * ODD ROWS AND EVEN COLS EXAMPLE [3x2]:
    *    [1, 2] == Row of blank: 0   Inversions: 0     0+0 == 0: puzzle is solved
    *    [3, 4]
    *    [5, 0]
    * 
    * 1. Up / down: 
    *    [1, 2] == Row of blank: 1   Inversions: 1     1+1 == 2: even is solvable
    *    [3, 0]
    *    [5, 4]
    * 
    * 2. Left / Right: 
    *    [1, 2] == Row of blank: 0   Inversions: 0     0+0 == 0: even is solvable
    *    [3, 4]
    *    [0, 5]
    * 
    * 3. Unsolvable state:
    *    [1, 2] == Row of blank: 0   Inversions: 1     0+1 == 1: odd is unsolvable
    *    [4, 3]
    *    [5, 0]
    **/
    static isPuzzleSolvable1Darr(arr, rows, cols) {
        let inversions = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                // Neither value is blank, and previous value is greater than next
                if ((arr[i] && arr[j]) && (arr[i] > arr[j])) {
                    inversions++;
                }
            }
        }

        // Odd columns: Number of inversions must be even
        if (cols % 2) {
            return !(inversions % 2);
        } else {
            // Even columns and odd/even rows: (inversions + rowOfBlankFromBottom) must be even
            // NOTE: Contradictory to source on odd col and even row case, but seems to hold true through testing
            const indexOfBlank = arr.indexOf(0);
            const rowOfBlankFromBottom = rows - (Math.floor(indexOfBlank / cols) + 1);
            return !((inversions + rowOfBlankFromBottom) % 2);
        }
    }

    static isPuzzleSolvable2Darr(matrix) {
        console.log("isPuzzleSolvable2Darr ")
        const arr = [];

        // Need blank row for determining solvable state
        let blankRow = undefined;

        // Turn into 1D array
        for(let row = 0; row < matrix.length; row++){
            for(let col = 0; col < matrix[row].length; col++) {
                arr.push(matrix[row][col]);
            }
        }

        console.log(arr, matrix.length, matrix[0].length);

        return Puzzle.isPuzzleSolvable1Darr(arr, matrix.length, matrix[0].length);
    }
    
    // Modern Fisher–Yates shuffle:
    // https://en.wikipedia.org/wiki/Fisher-Yates_shuffle
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1)); // random from 0 -> i
            const temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    printPuzzle() {
        let string = "[";
        for (const row of this.matrix) {
            string += "["
            for (const tile of row) {
                string += tile + ", ";;
            }
            string += "],\n";
        }
        string += "]\n";
        console.log(string)
    }
}









// new Puzzle(5, 8, false).printPuzzle();
// exit();


log = true;


let puzzle1 = Puzzle.fromMatrix(
    [[24, 16, 19, 34, 2, 18, 0, 9, ],
    [1, 29, 12, 32, 5, 27, 8, 30, ],
    [13, 6, 35, 22, 20, 33, 11, 17, ],
    [7, 23, 26, 3, 39, 31, 25, 4, ],
    [37, 21, 28, 36, 14, 10, 38, 15, ],
    ]
);

let puzzle2 = Puzzle.fromMatrix(
    [[26, 38, 4, 3, 0, 1, 7, 34, ],
    [37, 28, 15, 14, 17, 11, 18, 20, ],
    [9, 2, 30, 31, 24, 22, 23, 16, ],
    [6, 10, 27, 33, 19, 35, 12, 25, ],
    [36, 39, 32, 29, 21, 13, 5, 8, ],
    ]
);

// let puzzle1 = new Puzzle(9, 2, true);
// let puzzle2 = new Puzzle(9, 2, true);

puzzle1.printPuzzle();
puzzle2.printPuzzle();

console.log(solvePuzzleStrategically(puzzle1, puzzle2.matrix))
// exit();



let row = 5;
let col = 8;
const batch = `${row}x${col}`;
const solvable = false;
let solved = 0;
for (let i = 0; i < 100000000; i++) {
    const start = new Puzzle(row, col, true, solvable);
    const goal = new Puzzle(row, col, false, solvable);
    const original = Puzzle.fromPuzzle(start);

    try {
        if(!solvePuzzleStrategically(start, goal.matrix)) {
            console.log("FOUND A BAD CASE");
            original.printPuzzle();
            goal.printPuzzle();
            exit();
        } else {
            solved++;
    
            if (!(solved % 100000)) {
                console.log(batch, "solvable", solvable, solved);
            }
        }
    } catch (e) {
        console.log("RAN INTO AN EXCEPTION :-(", e)
        original.printPuzzle();
        goal.printPuzzle();
        throw new Error(e);
    }
}

console.log("Congratulations Jake :-)");
throw new Error("Jake is awesome")



let rows = 3;
let cols = 3;
let goalArray = []
const goalState = Array(rows).fill().map(() => Array(cols));
let value = 1;
for(let row = 0; row < rows; row++) {
    for(let col=0; col < cols; col++) {
        goalState[row][col] = value === rows * cols ? 0 : value;
        goalArray.push(value === rows * cols ? 0 : value);
        value++;
    }
}
console.log(goalArray);

const arrs = permute(goalArray);
console.log(arrs.length);
const solvablePuzzles = [];
const unsolvablePuzzles = [];

for(const arr of arrs) {
    if (Puzzle.isPuzzleSolvable1Darr(arr, rows, cols)) {
        solvablePuzzles.push(Puzzle.fromArr(arr, rows, cols));
    } else {
        unsolvablePuzzles.push(Puzzle.fromArr(arr, rows, cols));
    }
}

console.log("TOTAL STATES:", arrs.length)
console.log("TOTAL SOLVABLE", solvablePuzzles.length)
console.log("TOTAL UNSOLVABLE", unsolvablePuzzles.length)


// Solve all with regular goal state

// let comparisonsSolvable = 0;
// for(let i = 0; i < solvablePuzzles.length; i++) {
//     comparisonsSolvable++;
//     original = Puzzle.fromPuzzle(solvablePuzzles[i]);
//     if (!solvePuzzleStrategically(solvablePuzzles[i], goalState)) {
//         console.log("FOUND A BAD CASE");
//         original.printPuzzle();
//         exit();
//     }

//     console.log(comparisonsSolvable)
// }


// console.log("FINISHED COMPARING THE REGULAR GOAL STATES");

// exit();

let comparisonsSolvable = 0;
for(let i = 0; i < solvablePuzzles.length; i++) {
    for (let j = i + 1; j < solvablePuzzles.length; j++) {
        try {
            comparisonsSolvable++;
        
            const original = Puzzle.fromPuzzle(solvablePuzzles[i]);

            if (!solvePuzzleStrategically(solvablePuzzles[i], solvablePuzzles[j].matrix)) {
                console.log("FOUND A BAD CASE");
                original.printPuzzle();
                solvablePuzzles[j].printPuzzle();
                exit();
            }

            if (!(comparisonsSolvable % 100000)) {
                console.log("3x3 solvable comparisons", comparisonsSolvable)
            }
        } catch (e) {
            console.log("RAN INTO AN EXCEPTION :-(", e)
            original.printPuzzle();
            solvablePuzzles[j].printPuzzle();
            exit();
        }
    }
}

console.log("FINISHED COMPARING SOLVABLE 3x3 PUZZLES, TOTAL COMPARISONS:", comparisonsUnsolvable);
console.log("Congratulations Jake :-)");
throw new Error("Jake is awesome")

// let comparisonsUnsolvable = 0;
// for(let i = 0; i < unsolvablePuzzles.length; i++) {
//     for (let j = i + 1; j < unsolvablePuzzles.length; j++) {
//         try {
//             comparisonsUnsolvable++;
        
//             const original = Puzzle.fromPuzzle(unsolvablePuzzles[i]);

//             if (!solvePuzzleStrategically(unsolvablePuzzles[i], unsolvablePuzzles[j].matrix)) {
//                 console.log("FOUND A BAD CASE");
//                 original.printPuzzle();
//                 solvablePuzzles[j].printPuzzle();
//                 exit();
//             }

//             if (!(comparisonsUnsolvable % 100000)) {
//                 console.log("3x3 unsolvable comparisons", comparisonsUnsolvable)
//             }
//         } catch (e) {
//             console.log("RAN INTO AN EXCEPTION :-(", e)
//             original.printPuzzle();
//             solvablePuzzles[j].printPuzzle();
//             exit();
//         }
//     }
// }

// console.log("FINISHED COMPARING UNSOLVABLE 3x3 PUZZLES, TOTAL COMPARISONS:", comparisonsUnsolvable);


// let loop = 0;
// let run = true;
// while (loop < 100000000 && run) {
//     let puzzle = new Puzzle(rows, cols, true);
//     let originalState = Puzzle.fromPuzzle(puzzle);

//     try {
//         if (!solvePuzzleStrategically(puzzle, goalState)) {
//             console.log("HERE'S A BAD ONE");
//             originalState.printPuzzle();
//             run = false;
//         }
//     } catch (e) {
//         console.log(e);
//         originalState.printPuzzle();
//         run = false;
//     }

//     loop++;
//     if (!(loop % 10000))
//         console.log(loop);
// }





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

// Overall strategy derived from: https://www.wikihow.com/Solve-Slide-Puzzles
// Actual algorithm needs to check lots of things when moving tiles that a human could just "see"
//
// If the puzzle is non-square, solve rows or columns first until remaining unsolved puzzle is square
// Then alternate between solving rows and columns until it's a 2x2
// Once a tile has been solved, never touch it again: each solved row/col reduces the effective problem space
const solvePuzzleStrategically = (puzzle, goalState) => {
    const startTime = performance.now();
    const goalPuzzle = Puzzle.fromMatrix(goalState);
    const goalMapping = Puzzle.getMatrixMapping(goalState); // {0: {row: 2, col: 2}}

    if (goalPuzzle.isEqualToPuzzle(puzzle)) {
        return {
            "solutionPuzzle": puzzle,
            "runtimeMs": 0,
            "solutionMoves": [],
            "maxPuzzlesInMemory": 1,
        };
    }

    let rowInProgress = 0;
    let colInProgress = 0;
    let rowProgressCol = 0; // Solve row left to right
    let colProgressRow = 0; // Solve column top to bottom
    const solutionMoves = [];
    while (!goalPuzzle.isEqualToPuzzle(puzzle)) {
        
        // While there are more or equal unsolved rows than columns, solve rows.  Stop at 2x2
        while ((puzzle.rows - rowInProgress > 2) && (puzzle.rows - rowInProgress >= puzzle.cols - colInProgress)) {

            // If the row is solved, then move on
            // Handles pre-solved rows and allows us to loop on unsolved rows/cols and increment after finishing
            if (Puzzle.isRowEqual(goalPuzzle, puzzle, rowInProgress)) {
                rowInProgress++;
                rowProgressCol = 0;
            } else {
                let rowIteration = 0;
                targetValue = goalState[rowInProgress][rowProgressCol];
                while (!(Puzzle.isRowEqual(goalPuzzle, puzzle, rowInProgress))) {

                    // Guard against infinite loops if they may occur
                    // NOTE: Likely not needed, but feels better having it in since I can't test every single starting Puzzle state
                    if (rowIteration > 1) {
                        return false;
                    }

                    if (rowIteration > 0) {
                        console.log("ROW EQUAL?", Puzzle.isColEqual(goalPuzzle, puzzle, rowInProgress))
                        console.log("ROW ITERATION", rowIteration)
                        console.log("TARGET VALUE:", targetValue);
                        puzzle.printPuzzle();
                        // return false;
                    }

                    // We are not on the last two tiles of the row, solve normally and increment across the row
                    if (targetValue !== goalState[rowInProgress][puzzle.cols - 2]) {
                        const puzzleState = { puzzle: puzzle, rowInProgress, colInProgress, solutionMoves, solvingRow: true, movingLastTwoTiles: false };
                        moveTile(puzzleState, targetValue, goalMapping[targetValue].row, goalMapping[targetValue].col);
                        rowProgressCol++;
                        targetValue = goalState[rowInProgress][rowProgressCol];
                    } else {
                        /*
                          We are on the last two values of the row
                          These are special and need to be moved together
                          
                          1. Move last value two row below its goal
                             At least two rows out of the way will guarentee it won't get in a bad position
                          2. Move our 2nd to last value into the last value's goal position (corner)
                          3. Move our last value to below the 2nd to last value
                        */ 
                        const puzzleState = { puzzle, rowInProgress, colInProgress, solutionMoves, solvingRow: true , movingLastTwoTiles: true };
                        const lastValue = goalState[rowInProgress][puzzle.cols - 1];
                        moveTile(puzzleState, lastValue, goalMapping[lastValue].row + 2, goalMapping[lastValue].col)
                        moveTile(puzzleState, targetValue, goalMapping[lastValue].row, goalMapping[lastValue].col)
                        moveTile(puzzleState, lastValue, goalMapping[lastValue].row + 1, goalMapping[lastValue].col)

                        /* 
                          Move to left of our 2nd to last value and slide into place
                          [ 1, 0, 2 ]
                          [ x, x, 3 ]
                          [ x, x, x ]
                        */
                        moveBlankToCol(puzzleState, goalMapping[lastValue].col - 1);
                        moveBlankToRow(puzzleState, goalMapping[lastValue].row);
                        puzzle.slideRight();
                        puzzle.slideDown();
                        solutionMoves.push("RIGHT");
                        solutionMoves.push("DOWN");

                        // Reset the target in case we somehow got into a bad state
                        rowIteration++;
                        rowProgressCol = 0;
                        targetValue = goalState[rowInProgress][rowProgressCol];
                    }
                }
            }
        }

        // While there are more unsolved columns than rows, solve columns.  Stop at 2x2
        while ((puzzle.cols - colInProgress > puzzle.rows - rowInProgress) && (puzzle.cols - colInProgress > 2)) {

            // If the col is solved, then move on
            // Handles pre-solved columns and allows us to loop on unsolved rows/cols and increment after finishing
            if (Puzzle.isColEqual(goalPuzzle, puzzle, colInProgress)) {
                colInProgress++;
                colProgressRow = 0;
            } else {
                let colIteration = 0;
                targetValue = goalState[rowInProgress][colInProgress];
                while (!Puzzle.isColEqual(goalPuzzle, puzzle, colInProgress)) {

                    // Guard against infinite loops if they may occur
                    // NOTE: Likely not needed, but feels better having it in since I can't test every single starting Puzzle state
                    if (colIteration > 1) {
                        return false;
                    }

                    if (colIteration > 0) {
                        console.log("COL EQUAL?", Puzzle.isColEqual(goalPuzzle, puzzle, rowInProgress))
                        console.log("COL ITERATION", colIteration)
                        console.log("TARGET VALUE:", targetValue);
                        puzzle.printPuzzle();
                        // return false;
                    }
        
                    // We are not moving the last two tiles of the column, solve normally and increment down the col
                    if (targetValue !== goalState[puzzle.rows - 2][colInProgress]) {
                        const puzzleState = { puzzle, rowInProgress, colInProgress, solutionMoves, solvingRow: false, movingLastTwoTiles: false };
                        moveTile(puzzleState, targetValue, goalMapping[targetValue].row, goalMapping[targetValue].col)
                        colProgressRow++;
                        targetValue = goalState[colProgressRow][colInProgress];
                    } else {
        
                        /*
                          We are on the last two values of the column
                          These are special and need to be moved together
                          
                          1. Move last value two cols right of its goal
                             At least two cols out of the way will guarentee it won't get in a bad position
                          2. Move our 2nd to last value into the last value's goal position (corner)
                          3. Move our last value to the right of the 2nd to last value
                        */ 
                        const lastValue = goalState[puzzle.rows - 1][colInProgress]
                        const puzzleState = { puzzle, rowInProgress, colInProgress, solutionMoves, solvingRow: false, movingLastTwoTiles: true };
                        moveTile(puzzleState, lastValue, goalMapping[lastValue].row, goalMapping[lastValue].col + 2)
                        moveTile(puzzleState, targetValue, goalMapping[lastValue].row, goalMapping[lastValue].col)
                        moveTile(puzzleState, lastValue, goalMapping[lastValue].row, goalMapping[lastValue].col + 1)
        
                        /*
                         Move above of our 2nd to last value and slide into place 
                         [ 1, x, x ]
                         [ 0, x, x ]
                         [ 4, 7, x ]
                        */ 
                        moveBlankToRow(puzzleState, goalMapping[lastValue].row - 1);
                        moveBlankToCol(puzzleState, goalMapping[lastValue].col);
                        puzzle.slideDown();
                        puzzle.slideRight();
                        solutionMoves.push("DOWN");
                        solutionMoves.push("RIGHT");
        
                        // Reset the target in case we somehow got into a bad state
                        colIteration++;
                        colProgressRow = 0;
                        targetValue = goalState[rowInProgress][colInProgress];
                    }
                }
            }
        }

        // When down to a 2x2, rotate blank in circles until in goal state
        // Alternate between vertical and horizontal slides while staying in bounds
        // Assuming that the 2x2 is the bottom right corner - TODO: Any goal state?  Stay within bounds of blank's goal row+col
        if (puzzle.rows - rowInProgress === 2 && puzzle.cols - colInProgress === 2) {
            let iterations = 0;
            let slideVertically = true;
            
            // Should be finished after moving 12 times.  Use 20 to be safe
            while(!goalPuzzle.isEqualToPuzzle(puzzle) && iterations < 20) {
                if (slideVertically) {
                    if (puzzle.canSlideDown()) {
                        puzzle.slideDown();
                        solutionMoves.push("DOWN");
                        
                    } else {
                        puzzle.slideUp();
                        solutionMoves.push("UP");
                    }

                    slideVertically = false;
                } else {
                    if (puzzle.canSlideRight()) {
                        puzzle.slideRight();
                        solutionMoves.push("RIGHT");
                    } else {
                        puzzle.slideLeft();
                        solutionMoves.push("LEFT");
                    }
                    slideVertically = true;
                }

                iterations++;
            }

            const endTime = performance.now();
            return {
                "solutionPuzzle": puzzle,
                "runtimeMs": endTime - startTime,
                "solutionMoves": solutionMoves,
                "maxPuzzlesInMemory": 1,
            };
        }
    }
}


// Moves tile into it's goal state with different logic depending if we're solving a row or column
// 
// puzzleState { puzzle: Puzzle, int: rowInProgress, int: colInProgress, bool: solvingRow, bool: movingLastTwoPieces }
// value:   Int
// goalRow: Int
// goalCol: Int
const moveTile = (puzzleState, value, goalRow, goalCol) => {
    const matrixMapping = Puzzle.getMatrixMapping(puzzleState.puzzle.matrix);
    valueRow = matrixMapping[value].row
    valueCol = matrixMapping[value].col

    // Tile already in it's correct position
    if (valueRow === goalRow && valueCol === goalCol) {
        return;
    }


    // When solving rows, position tile column first (left/right), then row (up/down)
    // Keeps tiles away from already solved rows
    const tile = { value, row: valueRow, col: valueCol, goalRow, goalCol }
    const puzzle = puzzleState.puzzle;
    if (puzzleState.solvingRow) {

        // Left
        while (tile.col > goalCol) {
            moveTileLeft(puzzleState, tile);
            tile.col--;
        }

        // Right
        while (tile.col < goalCol) {
            moveTileRight(puzzleState, tile)
            tile.col++;
        }

        // Up
        while (tile.row > goalRow) {
            moveTileUp(puzzleState, tile)
            tile.row--;
        }

        // Down
        while (tile.row < goalRow) {
            moveTileDown(puzzleState, tile)
            tile.row++;
        }
    }
    else {
        // When solving col, position tile's row first (up/down), then col (left/right) 
        // Keep it away from already solved cols

        // Up
        while (tile.row > goalRow) {
            moveTileUp(puzzleState, tile)
            tile.row--;
        }

        // Down
        while (tile.row < goalRow) {
            moveTileDown(puzzleState, tile)
            tile.row++;
        }

        // Left
        while (tile.col > goalCol) {
            moveTileLeft(puzzleState, tile)
            tile.col--;
        }

        // Right
        while (tile.col < goalCol) {
            moveTileRight(puzzleState, tile)
            tile.col++;
        }
    }
}


// Two JSON objects to hold all info for the current state of the strategy
// puzzleState { Puzzle: puzzle, int: rowInProgress, int: colInProgress, bool: movingLastTwoTiles }
// Tile { int: value, int: valueRow, int: valueCol, int: goalRow, int: goalCol}
const moveTileLeft = (puzzleState, tile) => {
    const puzzle = puzzleState.puzzle;

    // Solving column logic
    if (!puzzleState.solvingRow) {

        // Tile is one right of our column in progress
        if (tile.col === puzzleState.colInProgress + 1) {

            // Tile not in last row
            if (tile.row !== puzzle.rows - 1) {

                // Blank is to the right and or above our value, and value not in last row
                // Go right and then down
                if (puzzle.blankCol >= tile.col && puzzle.blankRow <= tile.row) {
                    moveBlankToCol(puzzleState, tile.col + 1);
                    moveBlankToRow(puzzleState, tile.row + 1);
                }
            }
            else {
                // If we're in the last row, we're moving the last two pieces
                // Go above it and let default move to left
                moveBlankToRow(puzzleState, tile.row - 1);
                moveBlankToCol(puzzleState, tile.col);
            }
        }
    
    }
    
    // Blank tile is to the right of value and in the same row, avoid going up (solve rows are above)
    if (puzzle.blankCol > tile.col && tile.row === puzzle.blankRow) {

        // If our blank is in the last row, we have to go up since going down is impossible
        if (puzzle.canSlideDown()) {
            puzzle.slideDown();
            puzzleState.solutionMoves.push("DOWN");
        } else {
            puzzle.slideUp();
            puzzleState.solutionMoves.push("UP");
        }
    }

    // Move to left of tile
    // Since our value is greater than the goal col, there should always be a col to the left of it to move to
    moveBlankToCol(puzzleState, tile.col - 1);
    moveBlankToRow(puzzleState, tile.row);
    puzzle.slideRight();
    puzzleState.solutionMoves.push("RIGHT");
}

const moveTileRight = (puzzleState, tile) => {
    const puzzle = puzzleState.puzzle;
    if (puzzleState.solvingRow) {
        // Tile needs to go right, and our blank is in the row in progress
        // If tile is not underneath our blank, then slide the blank down first to get out of our solving row
        if (puzzle.blankRow === puzzleState.rowInProgress && (puzzle.blankRow + 1 !== tile.row || puzzle.blankCol !== tile.col)) {
            if (puzzle.canSlideDown()) {
                puzzle.slideDown();
                puzzleState.solutionMoves.push("DOWN");
            }
        }
    }

    // Blank tile is to the left of value and in the same row, avoid going up (solve rows are above)
    if (puzzle.blankCol < tile.col && tile.row === puzzle.blankRow) {

        // If our blank is in the last row, we have to go up since going down is impossible
        if (puzzle.canSlideDown()) {
            puzzle.slideDown();
            puzzleState.solutionMoves.push("DOWN")
        } else {
            puzzle.slideUp();
            puzzleState.solutionMoves.push("UP")
        }
    }

    // Move to right of tile
    // Since our value is less than the goal col, there should always be a col to the right of it to move to
    moveBlankToCol(puzzleState, tile.col + 1);
    moveBlankToRow(puzzleState, tile.row);
    puzzle.slideLeft();
    puzzleState.solutionMoves.push("LEFT");
}

const moveTileUp = (puzzleState, tile) => {
    const puzzle = puzzleState.puzzle;
    if (puzzleState.solvingRow) {
        // Tile is in row below our in progress row
        if (tile.row === puzzleState.rowInProgress + 1) {

            // Not in last column
            if (tile.col !== puzzle.cols - 1) {

                // Blank is to the left and/or under the value -> Go down and to the right
                if(puzzle.blankCol <= tile.col && puzzle.blankRow >= tile.row) {
                    moveBlankToRow(puzzleState, tile.row + 1);
                    moveBlankToCol(puzzleState, tile.col + 1)
                }
            } else {
                // If value is in last column and we're solving the row, these are the last two pieces
                // Don't move up by default, go right first and then up
                // If values happen to already be in place, going up will displace solved tiles
                moveBlankToCol(puzzleState, tile.col - 1);
                moveBlankToRow(puzzleState, tile.row);
            }
        }
    }

    // If blank is under the value, move left or right (within bounds)
    if (puzzle.blankRow > tile.row && puzzle.blankCol === tile.col) {
        if (puzzle.canSlideRight()) {
            puzzle.slideRight();
            puzzleState.solutionMoves.push("RIGHT");
        } else {
            puzzle.slideLeft();
            puzzleState.solutionMoves.push("LEFT");
        }
    }

    // Move blank above the value and swap
    moveBlankToRow(puzzleState, tile.row - 1);
    moveBlankToCol(puzzleState, tile.col);
    puzzle.slideDown();
    puzzleState.solutionMoves.push("DOWN");
}

const moveTileDown = (puzzleState, tile) => {
    const puzzle = puzzleState.puzzle;
    if (!puzzleState.solvingRow){
        // Tile needs to go down, and the blank is in the column in progress
        // If tile is to the right of the blank, then slide the blank right first to get out of the half-solved column
        if (puzzle.blankCol === puzzleState.colInProgress && (puzzle.blankCol + 1 !== tile.col || puzzle.blankRow !== tile.row)) {
            // Go right instead of left to avoid displacing tiles
            if (puzzle.canSlideRight()) {
                puzzle.slideRight();
                puzzleState.solutionMoves.push("RIGHT");
            }
        }
    }

    // If blank is above the value, move left or right (within bounds)
    if ((puzzle.blankRow < tile.row || puzzleState.movingLastTwoTiles) && puzzle.blankCol === tile.col) {
        if (puzzle.canSlideRight()) {
            puzzle.slideRight();
            puzzleState.solutionMoves.push("RIGHT");
        } else {
            puzzle.slideLeft();
            puzzleState.solutionMoves.push("LEFT");
        }
    }

    // Move blank below the value and swap
    moveBlankToRow(puzzleState, tile.row + 1);
    moveBlankToCol(puzzleState, tile.col);
    puzzle.slideUp();
    puzzleState.solutionMoves.push("UP");
}

const moveBlankToCol = (puzzleState, targetCol) => {
    const puzzle = puzzleState.puzzle;
    while (puzzle.blankCol !== targetCol) {
        if (puzzle.blankCol < targetCol) {
            puzzle.slideRight();
            puzzleState.solutionMoves.push("RIGHT")
        } else {
            puzzle.slideLeft();
            puzzleState.solutionMoves.push("LEFT")
        }
    }
}

const moveBlankToRow = (puzzleState, targetRow) => {
    const puzzle = puzzleState.puzzle;
    while (puzzle.blankRow !== targetRow) {
        if (puzzle.blankRow < targetRow) {
            puzzle.slideDown();
            puzzleState.solutionMoves.push("DOWN")
        } else {
            puzzle.slideUp();
            puzzleState.solutionMoves.push("UP")
        }
    }
}
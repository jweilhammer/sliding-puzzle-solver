const solvePuzzle = (algorithm, puzzle, goal_state) => {
    console.log("INSIDE SOLVE PUZZLE")

    let solution = algorithm(puzzle, goal_state);

    // let solution = algorithm(puzzle, goal_state, false);
    let solutionPuzzle = solution['solutionPuzzle'];
    let solutionMoves = [];
    while (solutionPuzzle) {
        solutionMoves.push(Object.keys(Puzzle.slideDirections)[Object.values(Puzzle.slideDirections).indexOf(solutionPuzzle.lastSlideDirection)]);
        solutionPuzzle = solutionPuzzle.cameFrom;
    }

    if (solutionMoves.length === 1 && solution['solutionMoves']) {
        console.log("I GOT MY SOLUTION MOVES ALREADY");
        solutionMoves = solution['solutionMoves'];
    } else {
        solutionMoves = solutionMoves.reverse();
    }

    console.log(algorithm.name, "SOLUTION:", solutionMoves.length - 1, solutionMoves);

    return {
        "solutionMoves": solutionMoves,
        "runtimeMs": solution["runtimeMs"],
        "maxPuzzlesInMemory": solution["maxPuzzlesInMemory"]
    }
}


const solvePuzzleForFunzies = async (htmlMatrix) => {
    const startingPuzzle = getPuzzleFromGridHTML(htmlMatrix);

    console.log("STARTING PUZZLE:", startingPuzzle);

    if (!startingPuzzle) {
        return;
    }

    // Rows and cols tracked in UI utils to resize puzzle grid
    const goalState = Array(puzzleRows).fill().map(() => Array(puzzleCols));
    let value = 1;
    for(let row = 0; row < puzzleRows; row++) {
        for(let col=0; col < puzzleCols; col++) {
            goalState[row][col] = value === puzzleRows * puzzleCols ? 0 : value;
            value++;
        }
    }

    // Unselect any tiles before sorting
    resetClickSourceElement();

    const algorithmMappings = {
        "Strategic": solvePuzzleStrategically,
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
    solution = solvePuzzle(algorithm, startingPuzzle, goalState);

    console.log("RUNTIME:", solution['runtimeMs'], "ms. MAX PUZZLES IN MEM:", solution['maxPuzzlesInMemory']);
    console.log("APPROXIMATE MEMORY USAGE", (solution['maxPuzzlesInMemory']*112 / (1024 * 1024)), "MB");

    solutionOutput.innerHTML = `RUNTIME: ${solution['runtimeMs']}ms<br />
                                MAX PUZZLES IN MEM: ${solution['maxPuzzlesInMemory']}<br />
                                APPROXIMATE MEMORY USAGE ${(solution['maxPuzzlesInMemory']*112 / (1024 * 1024))}MB
                                `;
    
    for(move of solution['solutionMoves']) {
        // console.log("[", sliderRow, "x", sliderCol, "]", move);

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

        await new Promise(r => setTimeout(r, 0));
    }


}

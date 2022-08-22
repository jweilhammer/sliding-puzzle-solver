const solvePuzzle = (algorithm, puzzle, goal_state) => {
    // Stop animation of previous solution if user clicks solve again mid-way through
    solutionAnimating = false;

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

    // Don't do anything if user is spamming solve button
    if (solutionAnimating) {
        return;
    }

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

    const selectedAlgorithm = document.getElementById("algorithmsDropdown").value
    const algorithm = algorithmMappings[selectedAlgorithm];
    let sliderPosition = Puzzle.getBlankTilePosition(startingPuzzle);
    let sliderRow = sliderPosition[0];
    let sliderCol = sliderPosition[1];

    htmlMatrix[sliderRow][sliderCol].style.opacity = '0';
    const solution = solvePuzzle(algorithm, startingPuzzle, goalState);
    const solutionMoves = solution['solutionMoves'];

    console.log("RUNTIME:", solution['runtimeMs'], "ms. MAX PUZZLES IN MEM:", solution['maxPuzzlesInMemory']);
    console.log("APPROXIMATE MEMORY USAGE", (solution['maxPuzzlesInMemory']*112 / (1024 * 1024)), "MB");


    // Get only first 3 decimal places for runtime
    summaryOutput.value = '';
    summaryOutput.value += `Runtime: ${solution['runtimeMs'].toFixed(3)}ms\n`;
    summaryOutput.value += `Moves: ${solutionMoves.length} ${selectedAlgorithm !== "Strategic" ? "(optimal)" : "(not optimal)"}\n`;
    summaryOutput.value += `Max puzzles in memory: ${solution['maxPuzzlesInMemory']}`;
    summaryOutput.mou


    solutionOutput.value = solutionMoves.length > 20000 ? 'See console for full move list...\n' : '';
    let moveList = "";
    for(const [index, move] of solutionMoves.slice(0, 20000).entries()) {
        moveList += `${index+1}: ${move}\n`;
    }

    solutionOutput.value += moveList;
                                  
    // 200 ms for 3x3 (9 tiles).  Get faster as the puzzle scales up
    let moveDelayMs = 1800 / (puzzleRows * puzzleCols);
    solutionAnimating = true;
    for(move of solution['solutionMoves']) {

        // Only move tiles if our solution is allowed to animate
        if (!solutionAnimating) {
            return;
        }

        if (move === "RIGHT") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow][sliderCol+1]);
            sliderCol++;
        } else if (move === "LEFT") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow][sliderCol-1]);
            sliderCol--;
        } else if (move === "UP") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow-1][sliderCol]);
            sliderRow--;
        } else if (move === "DOWN") {
            swapHtmlTiles(htmlMatrix[sliderRow][sliderCol], htmlMatrix[sliderRow+1][sliderCol]);
            sliderRow++;
        }

        await new Promise(r => setTimeout(r, moveDelayMs));
    }

    solutionAnimating = false;
}

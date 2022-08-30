const solvePuzzle = (algorithm, startPuzzle, goalPuzzle, options=null) => {
    // Stop animation of previous solution if user clicks solve again mid-way through
    solutionAnimating = false;

    let solution = algorithm(startPuzzle, goalPuzzle, options);


    let solutionMoves = [];
    if (solution['solutionMoves']) {
        // Strategic algorithm keeps track of solution moves for us
        solutionMoves = solution['solutionMoves'];
    } else {
        // Extract solution moves from the Puzzle states
        let solutionPuzzle = solution['solutionPuzzle'];
        while (solutionPuzzle) {
            solutionMoves.push(Object.keys(Puzzle.slideDirections)[Object.values(Puzzle.slideDirections).indexOf(solutionPuzzle.lastSlideDirection)]);
            solutionPuzzle = solutionPuzzle.cameFrom;
        }

        // Started from end to finish, so reverse moves
        solutionMoves = solutionMoves.reverse();
    }

    console.log(algorithm.name, "SOLUTION:", solutionMoves.length - 1, solutionMoves);

    return {
        "solutionMoves": solutionMoves,
        "runtimeMs": solution["runtimeMs"],
        "maxPuzzlesInMemory": solution["maxPuzzlesInMemory"]
    }
}


const solvePuzzleForFunzies = async () => {

    // Don't do anything if user is spamming solve button
    if (solutionAnimating) {
        return;
    }

    // Hide our input elements so the output is clear to see
    setGoalEditMode(false);
    setPlayMode(true);
    resetClickSourceElement();
    hideOutputTextAreas();

    let startingPuzzle = getPuzzleFromGridHTML();
    if (Puzzle.isPuzzleSolvable2Darr(startingPuzzle.matrix) !== Puzzle.isPuzzleSolvable2Darr(goalPuzzle.matrix)) {
        let errorMessage = "Puzzle is not solvable with current goal state!  Would you like to auto-fix it?\n\n";
        errorMessage += "Auto-fix will swap two adjacent non-blank tiles on the bottom right";

        let answer = confirm(errorMessage);
        if (answer) {
            autoFixPuzzle();
            startingPuzzle = getPuzzleFromGridHTML();
        }
    }

    const algorithmMappings = {
        "Strategic": solvePuzzleStrategically,
        "IDA*": solvePuzzleIDAStar,
        "A*": solvePuzzleAStar,
        "A*closedSet": solvePuzzleAStar,
        "BFS": solvePuzzleBFS
    }

    const selectedAlgorithm = document.getElementById("algorithmsDropdown").value
    const algorithm = algorithmMappings[selectedAlgorithm];
    let sliderPosition = Puzzle.getBlankTilePosition(startingPuzzle);
    let sliderRow = sliderPosition[0];
    let sliderCol = sliderPosition[1];

    htmlMatrix[sliderRow][sliderCol].style.opacity = '0';

    goalPuzzle.printPuzzle();
    console.log(goalPuzzle.blankRow);
    console.log(goalPuzzle.blankCol);

    let options = null;
    if (selectedAlgorithm === "A*closedSet") {
        options = { closedSet: true }
    }
    
    const solution = solvePuzzle(algorithm, startingPuzzle, goalPuzzle, options);
    const solutionMoves = solution['solutionMoves'];

    console.log("RUNTIME:", solution['runtimeMs'], "ms. MAX PUZZLES IN MEM:", solution['maxPuzzlesInMemory']);

    // Get only first 3 decimal places for runtime
    summaryOutput.value = '';
    summaryOutput.value += `Runtime: ${solution['runtimeMs'].toFixed(3)}ms\n`;
    summaryOutput.value += `Moves: ${solutionMoves.length} ${(selectedAlgorithm !== "Strategic" ||
     (solutionMoves.length === 0 || solutionMoves.length===1) ) ? "(optimal)" : "(nonoptimal)"}\n`;
    summaryOutput.value += `Max puzzles in memory: ${solution['maxPuzzlesInMemory']}`;

    let moveList = "Move list:\n";
    for(const [index, move] of solutionMoves.slice(0, 20000).entries()) {
        moveList += `${index+1}: ${move}\n`;
    }

    solutionOutput.value = moveList;
    solutionOutput.value += solutionMoves.length > 20000 ? 'See console for full move list...\n' : '';

    showOutputTextAreas();
                                  
    // 200 ms for 3x3 (9 tiles).  Get faster as the puzzle scales up
    // Apparently 4ms will run slightly faster than 0 since the min timeout is 4ms by default
    let moveDelayMs = Math.max(1800 / (puzzleRows * puzzleCols), 4);
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

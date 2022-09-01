import { Puzzle } from "./Puzzle.js";
import { State } from "./State.js";
import {
    getPuzzleFromGrid,
    resetClickSourceElement,
    hideEditElements,
    hideOutputTextAreas,
    showOutputTextAreas,
    animateMoveList,
    autoFixPuzzle } from "./uiUtils.js";
import { solvePuzzleBFS, solvePuzzleAStar, solvePuzzleIDAStar } from './searchAlgorithms.js';
import { solvePuzzleStrategically } from './strategicSolve.js';
export { solvePuzzle };

const state = State.get();

const solve = (algorithm, startPuzzle, goalPuzzle, options=null) => {
    // Stop animation of previous solution if user clicks solve again mid-way through
    state.solutionAnimating = false;

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


const solvePuzzle = async () => {

    // Don't do anything if user is spamming solve button
    if (state.solutionAnimating) {
        return;
    }

    if (state.editingGoalPuzzle) {
        setGoalEditMode(false);
    }
    

    let startingPuzzle = getPuzzleFromGrid();
    if (Puzzle.isPuzzleSolvable2Darr(startingPuzzle.matrix) !== Puzzle.isPuzzleSolvable2Darr(state.goalPuzzle.matrix)) {
        let errorMessage = "Puzzle is not solvable with current goal state!  Would you like to auto-fix it?\n\n";
        errorMessage += "Auto-fix will swap two adjacent non-blank tiles on the bottom right";

        let answer = confirm(errorMessage);
        if (answer) {
            autoFixPuzzle();
            startingPuzzle = getPuzzleFromGrid();
        } else {
            setPlayMode(false);
            return;
        }
    }

    const originalPuzzle = Puzzle.fromPuzzle(startingPuzzle);

    // Hide our input elements so the output is clear to see
    resetClickSourceElement();
    hideEditElements();
    hideOutputTextAreas();

    const algorithmMappings = {
        "Strategic": solvePuzzleStrategically,
        "IDA*": solvePuzzleIDAStar,
        "A*": solvePuzzleAStar,
        "A*closedSet": solvePuzzleAStar,
        "BFS": solvePuzzleBFS
    }

    const selectedAlgorithm = document.getElementById("algorithmsDropdown").value
    const algorithm = algorithmMappings[selectedAlgorithm];

    let options = null;
    if (selectedAlgorithm === "A*closedSet") {
        options = { closedSet: true }
    }
    
    const solution = solve(algorithm, startingPuzzle, state.goalPuzzle, options);
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
    await animateMoveList(originalPuzzle, solution['solutionMoves']);
}

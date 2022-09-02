import { Puzzle, slideDirections } from "./Puzzle.js";
import { state } from "./State.js";
import { solvePuzzleStrategically } from "./strategicSolve.js";
import { solvePuzzleBFS, solvePuzzleAStar, solvePuzzleIDAStar } from "./searchAlgorithms.js";
import { animateMoveList, checkPuzzleBeforeAnimating, initializeUiElements } from "./uiUtils.js";

// Maps dropdown values to our solver functions
const algorithmMappings = {
	Strategic: solvePuzzleStrategically,
	"IDA*": solvePuzzleIDAStar,
	"A*": solvePuzzleAStar,
	"A*closedSet": solvePuzzleAStar,
	BFS: solvePuzzleBFS,
};

// When page is finished loading
document.addEventListener("DOMContentLoaded", (e) => {
	// Initialize UI, buttons, css toggles, initial Puzzle state
	initializeUiElements();
	document.getElementById("solveBtn").addEventListener("click", solvePuzzle);
});


// Solve puzzle using selected algorithm, output result, and start animation
const solvePuzzle = async () => {
	if (state.solutionAnimating) {
		return;
	}

	// Lock our state for solving/animating the puzzle solution
	state.solutionAnimating = true;

	const startingPuzzle = checkPuzzleBeforeAnimating();
	if (!startingPuzzle) {
		return;
	}

	// Get our algorithm
	const selectedAlgorithm = document.getElementById("algorithmsDropdown").value;
	const algorithm = algorithmMappings[selectedAlgorithm];
	let options = null;
	if (selectedAlgorithm === "A*closedSet") {
		options = { closedSet: true };
	}

	// Solve using algorithm
	const originalPuzzle = Puzzle.fromPuzzle(startingPuzzle);
	let solution = algorithm(startingPuzzle, state.goalPuzzle, options);
	let solutionMoves = [];
	if (solution["solutionMoves"]) {

		// Strategic algorithm keeps track of solution moves for us
		solutionMoves = solution["solutionMoves"];
	} else {

		// Get inverse of our slide Directions so we can get the key from the value
		let solutionPuzzle = solution["solutionPuzzle"];
		Object.keys(slideDirections).forEach((key) => {
			slideDirections[slideDirections[key]] = key;
		});

		// Build move list from Puzzle state working backwards
		while (solutionPuzzle) {
			solutionMoves.push(slideDirections[solutionPuzzle.lastSlideDirection]);
			solutionPuzzle = solutionPuzzle.cameFrom;
		}

		// Started from end to finish, so reverse moves and remove INITIAL state
		solutionMoves = solutionMoves.reverse();
		solutionMoves.shift();
	}

	// Output summary to screen
	summaryOutput.value = "";
	summaryOutput.value += `Runtime: ${solution["runtimeMs"].toFixed(3)}ms\n`;
	summaryOutput.value += `Moves: ${solutionMoves.length} ${
		selectedAlgorithm !== "Strategic" || solutionMoves.length === 0 || solutionMoves.length === 1
			? "(optimal)"
			: "(nonoptimal)"
	}\n`;
	summaryOutput.value += `Max puzzles in memory: ${solution["maxPuzzlesInMemory"]}`;
	console.log(algorithm.name, "SOLUTION:", solutionMoves.length - 1, solutionMoves);

	// Output move list to screen
	let moveList = "Move list:\n";
	for (const [index, move] of solutionMoves.slice(0, 20000).entries()) {
		moveList += `${index + 1}: ${move}\n`;
	}
	solutionOutput.value = moveList;
	solutionOutput.value += solutionMoves.length > 20000 ? "See console for full move list...\n" : "";

	// Animate the solution
	await animateMoveList(originalPuzzle, solutionMoves);
};
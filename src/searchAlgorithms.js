import { Puzzle } from "./Puzzle.js";

// Breadth first search
// Search all possible states until we find the solution
const solvePuzzleBFS = (puzzle, goalPuzzle, options = null) => {
	const startTime = performance.now();

	// Un-explored states, and previously visited states
	const openList = [];
	const closedSet = {};
	let curPuzzle = puzzle;
	while (!goalPuzzle.isEqualToPuzzle(curPuzzle)) {
		const neighboringPuzzleStates = curPuzzle.generateNeighbors();
		for (const neighbor of neighboringPuzzleStates) {

			// Only explore new states, if we've already explored then don't add to open list
			if (!closedSet[JSON.stringify(neighbor.matrix)]) {
				neighbor.cameFrom = curPuzzle;
				openList.push(neighbor);
			}
		}

		closedSet[JSON.stringify(curPuzzle.matrix)] = 1;
		curPuzzle = openList.shift();
	}

	const endTime = performance.now();
	return {
		solutionPuzzle: curPuzzle,
		runtimeMs: endTime - startTime,
		maxPuzzlesInMemory: Object.keys(closedSet).length + openList.length,
	};
};

// A Star algorithm, with optional flage options: { closedSet: bool }
// Closed set improves runtime, but increases memory usage
// NOTE: Closed set is not necessary with admissable heuristic
const solvePuzzleAStar = (puzzle, goalPuzzle, options = null) => {
	const startTime = performance.now();

	let closedSet = null;
	if (options && options.closedSet) {
		closedSet = {};
	}

    // Un-explored states as an array, insertions treat it as a priority queue
	const openList = []
	const goalMapping = Puzzle.getMatrixMapping(goalPuzzle.matrix);
	puzzle.updateManhattanSum(goalMapping);
    priorityEnqueue(openList, puzzle, puzzle.manhattanSum)
	let curPuzzle = puzzle;
	while (!goalPuzzle.isEqualToPuzzle(curPuzzle)) {

		if (closedSet) closedSet[JSON.stringify(curPuzzle.matrix)] = 1;

		const neighboringPuzzleStates = curPuzzle.generateNeighbors(goalMapping);
		const costToNeighbor = curPuzzle.costFromStart + 1;
		for (const neighbor of neighboringPuzzleStates) {

			// If on the closed list, don't explore that path again
			if (closedSet && closedSet[JSON.stringify(neighbor.matrix)]) {
				continue;
			}

			// If on the open list, check if we found a better way
			const openNeighorIndex = openList.findIndex((element) => element.puzzle.isEqualToPuzzle(neighbor));
			if (openNeighorIndex !== -1) {
				const puzzleToMaybeUpdate = openList[openNeighorIndex].puzzle;
				if (puzzleToMaybeUpdate.costFromStart > costToNeighbor) {

                    // Remove from queue to re-enqueue with new cost
					openList.splice(openNeighorIndex, 1);

					neighbor.cameFrom = curPuzzle;
					neighbor.updateManhattanSum(goalMapping);
					neighbor.costFromStart = costToNeighbor;
                    priorityEnqueue(openList, neighbor, neighbor.manhattanSum + neighbor.costFromStart)
				}
			} else {
				// Add to open list for further exploration
				neighbor.cameFrom = curPuzzle;
				neighbor.updateManhattanSum(goalMapping);
				neighbor.costFromStart = costToNeighbor;
                priorityEnqueue(openList, neighbor, neighbor.manhattanSum + neighbor.costFromStart)
			}
		}

        // Get front of queue/lowest cost un-explored puzzle state
		curPuzzle = openList.shift().puzzle;
	}

	const endTime = performance.now();

	const maxPuzzlesInMemory = closedSet
		? Object.keys(closedSet).length + openList.length
		: openList.length;

	return {
		solutionPuzzle: curPuzzle,
		runtimeMs: endTime - startTime,
		maxPuzzlesInMemory: maxPuzzlesInMemory,
	};
};

const priorityEnqueue = (openList, puzzle, cost) => {
	// Make open list a priority queue by inserting elements in order
	for (var i = 0; i < openList.length; i++) {
        if (openList[i].cost > cost) {
            openList.splice(i, 0, { puzzle, cost });
            return;
        }
    }

    // Puzzle cost is greater than all others, add to end of queue
    openList.push({ puzzle, cost });
}

// Will recursively search and prune baths based on cost threshold
// Restarts at beginning node and explores paths that don't cost more than our highest estimate
const solvePuzzleIDAStar = (puzzle, goalPuzzle, options = null) => {
	const startTime = performance.now();

    // Use empty object to return the solved puzzle easily from max recursive depth
    let solution = { solvedPuzzle: null }

    // Initialize puzzle
	const goalMapping = Puzzle.getMatrixMapping(goalPuzzle.matrix); 
	puzzle.updateManhattanSum(goalMapping);
	let threshold = puzzle.manhattanSum;

    // Explore states till we find solution
	while (threshold !== 0) {
        // Set the new threshold to the lowest of all the paths explored and restart the search
		threshold = iterativeDeepeningSearch(puzzle, 0, threshold, goalMapping, solution);

        // Explored all states and none led to a better path, infinite looping
		if (threshold === Infinity) {
			return false;
		}
	}

	const endTime = performance.now();

	return {
		solutionPuzzle: solution.solvedPuzzle,
		runtimeMs: endTime - startTime,
		maxPuzzlesInMemory: solution.solvedPuzzle.costFromStart,
	};
};

// Recursively loop through neighboring paths and prune branches based on bounding threshold
// Will return the minimum threshold from all neighboring state paths (sum of heuristsics + cost to traverse to neighbor)
const iterativeDeepeningSearch = (curPuzzle, costToCurPuzzle, boundingThreshold, goalMapping, solution) => {
	let costToSolution = costToCurPuzzle + curPuzzle.manhattanSum;

    // Don't explore paths if they exceed our threshold
	if (costToSolution > boundingThreshold) {
		return costToSolution;
	}

    // State is solved
	if (curPuzzle.manhattanSum === 0) {
        // Save our solved Puzzle to be retured
        solution.solvedPuzzle = curPuzzle;
		return 0;
	}

	let minThreshold = Infinity;
	for (const neighbor of curPuzzle.generateNeighbors(goalMapping)) {
		neighbor.cameFrom = curPuzzle;
		const threshold = iterativeDeepeningSearch(
			neighbor,
			costToCurPuzzle + 1,
			boundingThreshold,
			goalMapping,
            solution
		);

		if (threshold == 0) return threshold;
		if (threshold < minThreshold) minThreshold = threshold;
	}

	return minThreshold;
};

export { solvePuzzleBFS, solvePuzzleAStar, solvePuzzleIDAStar };
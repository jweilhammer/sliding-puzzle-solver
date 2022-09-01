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
	let specialCustomGoal = false;

	// If the goal state has odd rows and even cols
	// Seems to be some bug around the heuristic for some custom goal states
	// Likely some special cases where manahattan isn't admissible for the non-default goal state
	// In this case, we let it re-explore previous neighbors for the threshold get high enough that it finds the optimal solution
	// Need to make sure start and goal are both in either "solvable" or "unsolvable" states or this will infinite loop
	// TODO: Look into this more, or get a better heuristic?
	if (puzzle.rows % 2 && !(puzzle.cols % 2)) {

		// Get default goal state of starting puzzle with same solvability
		const defaultGoalPuzzle = new Puzzle(
			puzzle.rows,
			puzzle.cols,
			false,
			Puzzle.isPuzzleSolvable2Darr(puzzle.matrix)
		);

		if (!defaultGoalPuzzle.isEqualToPuzzle(goalPuzzle)) {
			specialCustomGoal = true;
		}
	}

	const startTime = performance.now();

	let curPuzzle = puzzle;
	const goalMapping = Puzzle.getMatrixMapping(goalPuzzle.matrix); 
	curPuzzle.updateManhattanSum(goalMapping);
	let threshold = curPuzzle.manhattanSum;
	const solutionPath = [curPuzzle]; // Stack of Puzzles up to our current state
	while (!goalPuzzle.isEqualToPuzzle(curPuzzle)) {

        // Set the new threshold to the lowest of all the paths explored and restart the search
		threshold = iterativeDeepeningSearch(solutionPath, 0, threshold, goalMapping, specialCustomGoal);

        // Explored all states and none led to a better path, infinite looping
		if (threshold === Infinity) {
			return false;
		}

        // Get top of stack
		curPuzzle = solutionPath[solutionPath.length - 1];
	}

	const endTime = performance.now();

	return {
		solutionPuzzle: curPuzzle,
		runtimeMs: endTime - startTime,
		maxPuzzlesInMemory: solutionPath.length,
	};
};

// Recursively loop through neighboring paths and prune branches based on bounding threshold
// Will return the minimum threshold from all neighboring state paths (sum of heuristsics + cost to traverse to neighbor)
const iterativeDeepeningSearch = (solutionPath, costToCurPuzzle, boundingThreshold, goalMapping, specialCustomGoal) => {
	let curPuzzle = solutionPath[solutionPath.length - 1]; // Get top of stack
	let costToSolution = costToCurPuzzle + curPuzzle.manhattanSum;

    // Don't explore paths if they exceed our threshold
	if (costToSolution > boundingThreshold) {
		return costToSolution;
	}

    // State is solved
	if (curPuzzle.manhattanSum === 0) {
		return 0;
	}

	let minThreshold = Infinity;
	for (const neighbor of curPuzzle.generateNeighbors(goalMapping)) {
		// If neighbor is already on our solution path, don't re-explore to prevent loops
		const neighborSolutionIndex = solutionPath.findIndex((puzzle) => puzzle.isEqualToPuzzle(neighbor));
		if (neighborSolutionIndex === -1 || specialCustomGoal) {
			neighbor.cameFrom = curPuzzle;
			solutionPath.push(neighbor);
			const threshold = iterativeDeepeningSearch(
				solutionPath,
				costToCurPuzzle + 1 + neighbor.manhattanSum,
				boundingThreshold,
				goalMapping,
				specialCustomGoal
			);
			if (threshold == 0) return threshold;
			if (threshold < minThreshold) minThreshold = threshold;
			solutionPath.pop();
		}
	}

	return minThreshold;
};

export { solvePuzzleBFS, solvePuzzleAStar, solvePuzzleIDAStar };
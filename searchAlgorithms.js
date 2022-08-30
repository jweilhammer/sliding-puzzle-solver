// Breadth first search
const solvePuzzleBFS = (puzzle, goalPuzzle, options=null) => {
    const startTime = performance.now();

    const openList = [];   // Un-explored states
    const closedSet = {}; // Previously visited states
    let curPuzzle = puzzle;
    while (!goalPuzzle.isEqualToPuzzle(curPuzzle)) {
        neighboringPuzzleStates = curPuzzle.generateNeighbors();
        for(neighbor of neighboringPuzzleStates) {
            // Only explore new states, if we've already explored then don't add to open list
            if (!closedSet[JSON.stringify(neighbor.matrix)]) {
                neighbor.cameFrom = curPuzzle;
                // neighbor.printPuzzle();
                openList.push(neighbor);    
            }
        }

        closedSet[JSON.stringify(curPuzzle.matrix)] = 1;
        curPuzzle = openList.shift();
    }
    
    const endTime = performance.now();
    return {
        "solutionPuzzle": curPuzzle,
        "runtimeMs": endTime - startTime,
        "maxPuzzlesInMemory": Object.keys(closedSet).length + openList.length,
    };
}


// Note:  Since our heuristics are admissasble we don't need to keep track of a closed set
//        Hashing on a closed set and checking if we've visited before could improve runtime, but also increase memory usage
//        Using a closed set is only viable if our heuristic is also consistent: https://en.wikipedia.org/wiki/A*_search_algorithm
const solvePuzzleAStar = (puzzle, goalPuzzle, options=null) => {
    const startTime = performance.now();

    let closedSet = null;
    if (options && options.closedSet) {
        closedSet = {};
    }

    const openList = new PriorityQueue();   // Un-explored states as a priority queue
    const goalMapping = Puzzle.getMatrixMapping(goalPuzzle.matrix); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    puzzle.updateManhattanSum(goalMapping);
    openList.enqueue(puzzle, puzzle.manhattanSum);
    let curPuzzle = puzzle;
    while (!goalPuzzle.isEqualToPuzzle(curPuzzle)) {
        
        if (closedSet)
            closedSet[JSON.stringify(curPuzzle.matrix)] = 1;

        const neighboringPuzzleStates = curPuzzle.generateNeighbors(goalMapping);
        const costToNeighbor = curPuzzle.costFromStart + 1;
        for(neighbor of neighboringPuzzleStates) {

            // If on the closed list, don't explore that path again
            if (closedSet && closedSet[JSON.stringify(neighbor.matrix)]) {
                continue;
            }

            // If on the open list, check if we found a better way
            const openNeighorIndex = openList.items.findIndex(puzzle => puzzle.element.isEqualToPuzzle(neighbor));
            if (openNeighorIndex !== -1) {
                const puzzleToMaybeUpdate = openList.items[openNeighorIndex];
                if (puzzleToMaybeUpdate.element.costFromStart > costToNeighbor) {
                    let removed = openList.items.splice(openNeighorIndex, 1)[0]; // remove from queue to resort with new cost
                    neighbor.cameFrom = curPuzzle;
                    neighbor.updateManhattanSum(goalMapping);
                    neighbor.costFromStart = costToNeighbor;
                    openList.enqueue(neighbor, neighbor.manhattanSum + neighbor.costFromStart);
                }
            } else {
                // Add to open list for further exploration
                neighbor.cameFrom = curPuzzle;
                neighbor.updateManhattanSum(goalMapping);
                neighbor.costFromStart = costToNeighbor;
                openList.enqueue(neighbor, neighbor.manhattanSum + neighbor.costFromStart);   
            }
        }

        curPuzzle = openList.dequeue();
    }

    const endTime = performance.now();
    const maxPuzzlesInMemory = closedSet ? Object.keys(closedSet).length + openList.items.length : openList.items.length
    return {
        "solutionPuzzle": curPuzzle,
        "runtimeMs": endTime - startTime,
        "maxPuzzlesInMemory": maxPuzzlesInMemory
    };
}




const SOLVED = 0;
const NOT_SOLVED = -1;

// https://en.wikipedia.org/wiki/Iterative_deepening_A*#Pseudocode
// Will recursively search and prune baths based on threshold sum of heuristic
// Restarts at beginning node and chooses the best path each iteration
const solvePuzzleIDAStar = (puzzle, goal_state, options=null) => {
    const startTime = performance.now();

    const goalMapping = Puzzle.getMatrixMapping(goal_state); // Mapping of goal tiles' (row,col) to quickly find heuristic distance
    let curPuzzle = puzzle;
    curPuzzle.updateManhattanSum(goalMapping);
    let threshold = curPuzzle.manhattanSum;
    const solutionPath = [curPuzzle] // Stack of Puzzles up to our current state
    while (curPuzzle.manhattanSum !== 0) {
        threshold = iterativeDeepeningSearch(solutionPath, 0, threshold, goalMapping);
        if (threshold === Infinity) {
            console.log("unsolvable");
            return;
        }
        curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    }

    const endTime = performance.now();

    return {
        "solutionPuzzle": curPuzzle,
        "runtimeMs": endTime - startTime,
        "maxPuzzlesInMemory": solutionPath.length,
    };
}

// Recursively loop through neighboring paths and prune branches based on bounding threshold
// Will return the minimum threshold from all neighboring state paths (sum of heuristsics + cost to traverse to neighbor)
const iterativeDeepeningSearch = (solutionPath, costToCurPuzzle, boundingThreshold, goalMapping) => {
    let curPuzzle = solutionPath[solutionPath.length-1]; // Get top of stack
    let costToSolution = costToCurPuzzle + curPuzzle.manhattanSum

    if (costToSolution > boundingThreshold) {
        return costToSolution;
    }

    if (curPuzzle.manhattanSum === 0) {
        return SOLVED;
    }

    minThreshold = Infinity;
    for (neighbor of curPuzzle.generateNeighbors(goalMapping)) {

        // If neighbor is already on our solution path, don't re-explore to prevent loops
        const neighborSolutionIndex = solutionPath.findIndex(puzzle => puzzle.isEqualToPuzzle(neighbor));
        if (neighborSolutionIndex === -1) {
            neighbor.cameFrom = curPuzzle;
            solutionPath.push(neighbor);
            threshold = iterativeDeepeningSearch(solutionPath, costToCurPuzzle + 1 + neighbor.manhattanSum, boundingThreshold, goalMapping);
            if (threshold == SOLVED) return threshold;
            if (threshold < minThreshold) minThreshold = threshold;
            solutionPath.pop();
        }
    }

    return minThreshold;
}

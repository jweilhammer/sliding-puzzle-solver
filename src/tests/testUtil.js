import expect from "expect.js";
import { Puzzle } from "../Puzzle.js";
import { solvePuzzleStrategically } from "../strategicAlgorithm.js";

// Puzzle sizes to run tests on
// Important distinctions are odd cols and even cols as that changes the solvability rules
// Haven't done 1xN or Nx1, and anything above 3x3 is too large
const puzzleSizes = [
    { rows: 2, cols: 2 },
    { rows: 2, cols: 3 },
    { rows: 3, cols: 2 },
    { rows: 3, cols: 3 },
];


// Only need to calculate once and can be re-used in each test
const permutations = {};
const solvableStates = {};
const unsolvableStates = {};
const goalArrays = {};


// Pre-process and store results so each test doesn't have to re-caclulate
const getAllPuzzleStates = () => {
    puzzleSizes.forEach((size) => {
        const sizeKey = `${size.rows}x${size.cols}`

        // Save goal arrays [1, 2, 3, 0] 
        const goalArray = Array.from(Array(size.rows * size.cols).keys());
        goalArray.push(goalArray.splice(0, 1)[0]);
        goalArrays[sizeKey] = goalArray;

        // Save all permuations of the goal array
        permutations[sizeKey] = permute(goalArray);

        // Get all solvable/unsolvable states from permutations
        solvableStates[sizeKey] = [];
        unsolvableStates[sizeKey] = [];
        permutations[sizeKey].forEach((arr) => {
            if (Puzzle.isPuzzleSolvable1Darr(arr, size.rows, size.cols)) {
                solvableStates[sizeKey].push(arr);
            } else {
                unsolvableStates[sizeKey].push(arr);
            }
        });
    });
}

// Try to solve all states in opposite solvability space (solvable -> unsolvable / unsolvable -> solvable)
// These should all fail as this is impossible
const compareDifferentSolvabilitySpaces = (size, solvableArrs, unsolvableArrs, algorithm, solvableFirst) => {
    let comparisons = 0;
    let goalPuzzle = null;
    let startingPuzzle = null;
    const expectSolved = false;
    for(let i = 0; i < solvableArrs.length; i++) {
        for (let j = 0; j < unsolvableArrs.length; j++) {
            if (solvableFirst) {
                startingPuzzle = Puzzle.fromArr(solvableArrs[i], size.rows, size.cols);
                goalPuzzle = Puzzle.fromArr(unsolvableArrs[j], size.rows, size.cols);
            } else {
                startingPuzzle = Puzzle.fromArr(unsolvableArrs[i], size.rows, size.cols);
                goalPuzzle = Puzzle.fromArr(solvableArrs[j], size.rows, size.cols);
            }

            solvePuzzle(startingPuzzle, goalPuzzle, algorithm, expectSolved);

            comparisons++;
            if(!(comparisons % 10000)) {
                console.log(`[${size.rows} x ${size.cols}] ${algorithm.name} ${solvableFirst ? '' : 'un'}solvable comparisons:`, comparisons)
            }
        }
    }
    console.log(`[${size.rows} x ${size.cols}] Finished ${algorithm.name} ${solvableFirst ? '' : 'un'}solvable comparisons:`, comparisons)
}

// Try to solve all states in the same solvability space (solvable -> solvable / unsolvable -> unsolvable)
// These should all succeed
const compareSameSolvabilitySpace = (size, solvableArrs, algorithm, solvable) => {
    let comparisons = 0;
    const expectSolved = true;
    for(let i = 0; i < solvableArrs.length; i++) {
        for (let j = i + 1; j < solvableArrs.length; j++) {
            const startingPuzzle = Puzzle.fromArr(solvableArrs[i], size.rows, size.cols);
            const goalPuzzle = Puzzle.fromArr(solvableArrs[j], size.rows, size.cols);
            solvePuzzle(startingPuzzle, goalPuzzle, algorithm, expectSolved);
            comparisons++;
            if(!(comparisons % 10000)) {
                console.log(`[${size.rows} x ${size.cols}] ${algorithm.name} ${solvable ? '' : 'un'}solvable comparisons:`, comparisons)
            }
        }
    }
    console.log(`[${size.rows} x ${size.cols}] Finished ${algorithm.name} ${solvable ? '' : 'un'}solvable comparisons:`, comparisons)
}

const solvePuzzle = (startingPuzzle, goalPuzzle, algorithm, expectSolved) => {
    const original = Puzzle.fromPuzzle(startingPuzzle);
    try {
        const solved = algorithm(startingPuzzle, goalPuzzle);

        // Solving true will return object, as long as it's not false then it passes
        if (expectSolved) {
            if (!solved) {
                // We were somehow unsuccessful, this shouldn't happen
                console.log("FOUND A BAD CASE");
                original.printPuzzle();
                goalPuzzle.printPuzzle();
            }

            expect(solved).to.not.be(false);
        }
        else {
            expect(solved).to.be(false);
        }
    } catch (e) {
        console.log("RAN INTO AN EXCEPTION", e)
        original.printPuzzle();
        goalPuzzle.printPuzzle();

        // Fail on purpose
        expect(true).to.be(false);
    }
}

// Get all possible permutations of an array
function permute(arr) {
	let result = [];
	if (arr.length === 0) return [];
	if (arr.length === 1) return [arr];

	for (let i = 0; i < arr.length; i++) {
		const currentNum = arr[i];
		const remainingArr = arr.slice(0, i).concat(arr.slice(i + 1));
		const remainingArrPermuted = permute(remainingArr);
		for (let j = 0; j < remainingArrPermuted.length; j++) {
			const permutedArray = [currentNum].concat(remainingArrPermuted[j]);
			result.push(permutedArray);
		}
	}
	return result;
}

// Get factorial of a number
const factorial = (n) => {
	if (n == 0 || n == 1) {
		return 1;
	} else {
		return n * factorial(n - 1);
	}
};



export {
    getAllPuzzleStates,
    compareDifferentSolvabilitySpaces,
    compareSameSolvabilitySpace,
    factorial,
    puzzleSizes,
    permutations,
    solvableStates,
    unsolvableStates,
    goalArrays,
    solvePuzzle,
}

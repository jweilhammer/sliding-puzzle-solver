import { solvePuzzleStrategically } from "../src/strategicAlgorithm.js";
import { solvePuzzleBFS, solvePuzzleAStar, solvePuzzleIDAStar } from "../src/searchAlgorithms.js";
import {
    getAllPuzzleStates,
    compareSameSolvabilitySpace,
    puzzleSizes,
    solvableStates,
    unsolvableStates,
} from "./testUtil.js";


// Flag to run tests for 3x3s as well, but it will take a very long time
const runFullTests = process.env.FULL_TEST_SUITE ? process.env.FULL_TEST_SUITE : false;

// Initialize pre-processed states
getAllPuzzleStates();

const algorithms = [
    solvePuzzleStrategically,
    solvePuzzleIDAStar,
    solvePuzzleAStar,
    solvePuzzleBFS,
]

// Algorithms solve every start and goal state
// Tests whether any state in a solvability space can be reached from any starting state in the same space
// This confirms that custom goal states are possible, and a solvable puzzle can never become unsolvable
describe("Puzzle Solvability", () => {
    algorithms.forEach(algorithm => {
        describe(`Solvable States ${algorithm.name}`, () => {
            puzzleSizes.forEach(size => {
                it(`${algorithm.name} should reach any goal state from any starting state [${size.rows} x ${size.cols}]`, () =>{
                    const solvableArrs = solvableStates[`${size.rows}x${size.cols}`];

                    // Don't run 3x3 by default as it is very large space to fully test
                    if (size.rows < 3 || size.cols < 3) {
                        compareSameSolvabilitySpace(size, solvableArrs, algorithm, true)
                    } else if (runFullTests) {
                        compareSameSolvabilitySpace(size, solvableArrs, solvePuzzleStrategically, true)
                    }
                });
            });
        })

        describe(`Unsolvable States ${algorithm.name}`, () => {
            puzzleSizes.forEach((size) => {
                it(`${algorithm.name} should reach any goal state from any starting state [${size.rows} x ${size.cols}]`, () =>{
                    const unsolvableArrs = unsolvableStates[`${size.rows}x${size.cols}`];
                    
                    // Don't run 3x3 by default as it is very large space to fully test
                    if ((size.rows < 3 || size.cols < 3) || runFullTests) {
                        compareSameSolvabilitySpace(size, unsolvableArrs, algorithm, false);
                    } else if (runFullTests) {
                        compareSameSolvabilitySpace(size, unsolvableArrs, solvePuzzleStrategically, false);
                    }
                });
            });
        });
    });
});
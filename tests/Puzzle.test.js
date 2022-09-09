import expect from "expect.js";
import { solvePuzzleStrategically } from "../src/strategicAlgorithm.js";
import {
    compareDifferentSolvabilitySpaces,
    getAllPuzzleStates,
    factorial,
    puzzleSizes,
    permutations,
    solvableStates,
    unsolvableStates,
    goalArrays,
} from "./testUtil.js";

// Flag to run tests for 3x3s as well, but it will take a very long time
const runFullTests = process.env.FULL_TEST_SUITE ? process.env.FULL_TEST_SUITE : false;


// Initialize pre-processed states
getAllPuzzleStates();

// Tests to make sure out assumptions about solvability spaces are correct
describe("puzzleStates", () => {

    // Confirm total puzzles states are indeed (number of tiles)!
	describe("Total puzzle states", () => {
		puzzleSizes.forEach((size) => {
			it(`Should be a factorial of total tiles [${size.rows} x ${size.cols}]`, () => {
                const arrs = permutations[`${size.rows}x${size.cols}`];
				expect(arrs.length).to.equal(factorial(size.rows * size.cols));
			});
		});
	});

    // Confirm each solvability space is exactly half of the total puzzle states
    describe("Solvability Spaces", () => {
        describe("Solvable States", () => {
            puzzleSizes.forEach((size) => {
                it(`Should be half of the total puzzle states [${size.rows} x ${size.cols}]`, () => {
                    const states = solvableStates[`${size.rows}x${size.cols}`];
                    const totalStates = permutations[`${size.rows}x${size.cols}`];
                    expect(states.length).to.equal(totalStates.length / 2);
                });
            });
        });
        describe("Unsolvable States", () => {
            puzzleSizes.forEach((size) => {
                it(`Should be half of the total puzzle states [${size.rows} x ${size.cols}]`, () => {
                    const states = unsolvableStates[`${size.rows}x${size.cols}`];
                    const totalStates = permutations[`${size.rows}x${size.cols}`];
                    expect(states.length).to.equal(totalStates.length / 2);
                });
            });
        });
	});

    // Make sure our goal states are correct
	describe("Goal state", () => {
        describe("Goal size", () => {
            puzzleSizes.forEach((size) => {
                it(`Should have right number of tiles [${size.rows} x ${size.cols}]`, () => {
                    const goalArray = goalArrays[`${size.rows}x${size.cols}`];
                    expect(goalArray.length).to.equal(size.rows * size.cols);
                });
            });
        });

        describe("Goal tiles", () => {
            puzzleSizes.forEach((size) => {
                it(`Should be in order [${size.rows} x ${size.cols}]`, () => {
                    const goalArray = goalArrays[`${size.rows}x${size.cols}`];
                    goalArray.forEach((tile, index) => {
                        if (index > 0 && tile !== 0)
                            expect(tile).to.be.greaterThan(goalArray[index - 1]);
                    });
                });
            });
        });

        describe("Goal's blank tile", () => {
            puzzleSizes.forEach((size) => {
                const goalArray = goalArrays[`${size.rows}x${size.cols}`];
                it(`Should be at the end [${size.rows} x ${size.cols}]`, () => {
                    expect(goalArray[goalArray.length - 1]).to.be(0);
                });
            });
        });

        describe('Solvable to Unsolvable', () => {
            it(`Strategic should not be able reach any unsolvable state starting from a solvable state`, () => {
                puzzleSizes.forEach((size) => {
                    const solvableArrs = solvableStates[`${size.rows}x${size.cols}`];
                    const unsolvableArrs = unsolvableStates[`${size.rows}x${size.cols}`];
        
                    // Don't run 3x3 by default as it is very large space to fully test
                    if (size.rows < 3 || size.cols < 3) {
                        compareDifferentSolvabilitySpaces(size, solvableArrs, unsolvableArrs, solvePuzzleStrategically, true);
                    } else if (runFullTests) {
                        // Run 3x3 with strategic as it's the fastest
                        compareDifferentSolvabilitySpaces(size, solvableArrs, unsolvableArrs, solvePuzzleStrategically, true);
                    }
                });
            });
        
            it(`Strategic should not be able reach any solvable state starting from a unsolvable state`, () => {
                puzzleSizes.forEach((size) => {
                    const solvableArrs = solvableStates[`${size.rows}x${size.cols}`];
                    const unsolvableArrs = unsolvableStates[`${size.rows}x${size.cols}`];
                    
                    // Don't run 3x3 by default as it is very large space to fully test
                    if ((size.rows < 3 || size.cols < 3) || runFullTests) {
                        compareDifferentSolvabilitySpaces(size, unsolvableArrs, solvableArrs, solvePuzzleStrategically, false);
                    } else if (runFullTests) {
                        compareDifferentSolvabilitySpaces(size, unsolvableArrs, solvableArrs, solvePuzzleStrategically, false);
                    }
                });
            });
        });
	});
});
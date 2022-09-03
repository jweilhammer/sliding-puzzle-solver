import { Puzzle } from "../Puzzle.js";
import { solvePuzzleStrategically } from "../strategicAlgorithm.js";
import {
    solvePuzzle
} from "./testUtil.js";


// Flag to run tests for 3x3s as well, but it will take a very long time
const iterations = process.env.STRATEGIC_ITERATIONS ? process.env.STRATEGIC_ITERATIONS : 50000;

// These should cover all the different size cases for larger puzzles
// As they reduce they cover different sizes too [5x8] -> [5x7], [2x9] -> [2x8], etc
const puzzleSizes = [
    { rows: 4, cols: 4 },
    { rows: 5, cols: 5 },
    { rows: 6, cols: 6 },
    { rows: 5, cols: 8 },
    { rows: 8, cols: 5 },
    { rows: 4, cols: 6 },
    { rows: 6, cols: 4 },
    { rows: 2, cols: 9 },
    { rows: 9, cols: 2 },
];


// Algorithms solve every start and goal state
// Tests whether any state in a solvability space can be reached from any starting state in the same space
// This confirms that custom goal states are possible, and a solvable puzzle can never become unsolvable
describe("Solving random starting and goal state", () => {
    const expectSolved = true;
    puzzleSizes.forEach(size => {
        it(`Should solve ${iterations} of random solvable puzzles: [${size.rows} x ${size.cols}]`, () => {
            const solvable = true;
            for (let i = 0; i < iterations; i++) {
                solvePuzzle(
                    new Puzzle(size.rows, size.cols, true, solvable),
                    new Puzzle(size.rows, size.cols, true, solvable),
                    solvePuzzleStrategically,
                    expectSolved
                );

                if(!(i % 10000)) {
                    console.log(`[${size.rows} x ${size.cols}] ${solvable ? '' : 'un'}solvable puzzles: ${i}`);
                }
            }
        });

        it(`Should solve ${iterations} of random unsolvable puzzles: [${size.rows} x ${size.cols}]`, () => {
            const solvable = false;
            for (let i = 0; i < iterations; i++) {
                solvePuzzle(
                    new Puzzle(size.rows, size.cols, true, solvable),
                    new Puzzle(size.rows, size.cols, true, solvable),
                    solvePuzzleStrategically,
                    expectSolved
                );

                if(!(i % 10000)) {
                    console.log(`[${size.rows} x ${size.cols}] ${solvable ? '' : 'un'}solvable puzzles: ${i}`);
                }
            }
        });
    });
});
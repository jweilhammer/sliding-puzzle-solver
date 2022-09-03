// Static var not supported on Safari
const slideDirections = {
    INITIAL: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4,
};

class Puzzle {
	constructor(rows, cols, genRandomPuzzle = true, solvable = true) {
		if (genRandomPuzzle) {
			this.matrix = Puzzle.generateRandomPuzzle(rows, cols, solvable);
			this.matrix.forEach((row, rowIndex) => {
				row.forEach((tile, colIndex) => {
					if (!tile) {
						this.blankRow = rowIndex;
						this.blankCol = colIndex;
					}
				})
			})
		} else {
			// Fill matrix with default goal state (in order tiles)
			this.matrix = Array(rows)
				.fill()
				.map(() => Array(cols));
			let value = 1;
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					this.matrix[row][col] = value === rows * cols ? 0 : value;
					value++;
				}
			}

			// For custom goal states that aren't visually solvable
			if (!solvable) {
				// Swap last two tiles that aren't the blank space
				// This will make the inversions even/odd making a solvable puzzle unsolvable
				const tmp = this.matrix[rows - 3][cols - 3];
				this.matrix[rows - 3][cols - 3] = this.matrix[rows - 2][cols - 2];
				this.matrix[rows - 2][cols - 2] = tmp;
			}

			this.blankRow = rows - 1;
			this.blankCol = cols - 1;
		}
		this.lastSlideDirection = 0;
		this.manhattanSum = 0; // No need to calculate manhatten sum on initial puzzle state
		this.cameFrom = null; // Last puzzle state
		this.costFromStart = 0;
		this.rows = rows;
		this.cols = cols;
	}

	// Create deep copy of another puzzle
	static fromPuzzle(puzzle) {
		let copy = new Puzzle(puzzle.matrix.length, puzzle.matrix[0].length, false);

		for (let row = 0; row < puzzle.matrix.length; row++) {
			for (let col = 0; col < puzzle.matrix[0].length; col++) {
				copy.matrix[row][col] = puzzle.matrix[row][col];
			}
		}
		copy.blankRow = puzzle.blankRow;
		copy.blankCol = puzzle.blankCol;
		copy.manhattanSum = puzzle.manhattanSum;
		copy.costFromStart = puzzle.costFromStart;
		return copy;
	}

	static fromMatrix(matrix) {
		let puzzle = new Puzzle(matrix.length, matrix[0].length, false);

		for (let row = 0; row < matrix.length; row++) {
			for (let col = 0; col < matrix[0].length; col++) {
				puzzle.matrix[row][col] = matrix[row][col];
				if (!matrix[row][col]) {
					puzzle.blankRow = row;
					puzzle.blankCol = col;
				}
			}
		}
		return puzzle;
	}

	static fromArr(arr, rows, cols) {
		const puzzle = new Puzzle(rows, cols, false);

		let arrIndex = 0;
		for (let row = 0; row < puzzle.matrix.length; row++) {
			for (let col = 0; col < puzzle.matrix[row].length; col++) {
				puzzle.matrix[row][col] = arr[arrIndex];
				if (!arr[arrIndex]) {
					puzzle.blankRow = row;
					puzzle.blankCol = col;
				}
				arrIndex++;
			}
		}
		return puzzle;
	}

	// Returns random puzzle with defined solvability
	static generateRandomPuzzle(row, col, solvable) {
		// [1 ... N - 1, 0]
		const values = Array.from(Array(row * col).keys()).slice(1);
		values.push(0);
		let puzzle_arr = [];

		// Default to generating a traditionally "solvable" puzzle, which is 1/2 total possible puzzle states
		// Use flag to generate the other half for allowing custom goal states
		// An "unsolvable" puzzle can be solved if the initial state is also "unsolvable"
		// This allows for custom goal states and showing the solvability of the other half of the puzzle states
		if (solvable) {
			do {
				puzzle_arr = Puzzle.shuffleArray(values);
			} while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr, row, col));
		} else {
			do {
				puzzle_arr = Puzzle.shuffleArray(values);
			} while (Puzzle.isPuzzleSolvable1Darr(puzzle_arr, row, col));
		}

		// Turn 1D array into our Puzzle Matrix from last to first to use arr.pop()
		let puzzle_matrix = Array(row)
			.fill()
			.map(() => Array(col));
		for (let row = 0; row < puzzle_matrix.length; row++) {
			for (let col = 0; col < puzzle_matrix[row].length; col++) {
				const value = puzzle_arr.shift();
				if (!value) {
					this.blankRow = row;
					this.blankCol = col;
				}
				puzzle_matrix[row][col] = value;
			}
		}

		return puzzle_matrix;
	}

	canSlideLeft() {
		// Edge guarding on left side
		if (this.blankCol <= 0) {
			return false;
		} else {
			return true;
		}
	}

	canSlideRight() {
		// Edge guarding on current row
		if (this.blankCol >= this.matrix[this.blankRow].length - 1) {
			return false;
		} else {
			return true;
		}
	}

	canSlideUp() {
		// Edge guarding on left side
		if (this.blankRow <= 0) {
			return false;
		} else {
			return true;
		}
	}

	canSlideDown() {
		// Edge guarding on left side
		if (this.blankRow >= this.matrix.length - 1) {
			return false;
		} else {
			return true;
		}
	}

	slideLeft() {
		// Edge guarding on left side
		if (this.blankCol <= 0) {
			return false;
		}

		this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow][this.blankCol - 1];
		this.matrix[this.blankRow][this.blankCol - 1] = 0;
		this.blankCol--;
	}

	slideRight() {
		// Edge guarding on current row
		if (this.blankCol >= this.matrix[this.blankRow].length - 1) {
			return false;
		}

		this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow][this.blankCol + 1];
		this.matrix[this.blankRow][this.blankCol + 1] = 0;
		this.blankCol++;
	}

	slideUp() {
		// Edge guarding on left side
		if (this.blankRow <= 0) {
			return false;
		}

		this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow - 1][this.blankCol];
		this.matrix[this.blankRow - 1][this.blankCol] = 0;
		this.blankRow--;
	}

	slideDown() {
		// Edge guarding on left side
		if (this.blankRow >= this.matrix.length - 1) {
			return false;
		}

		this.matrix[this.blankRow][this.blankCol] = this.matrix[this.blankRow + 1][this.blankCol];
		this.matrix[this.blankRow + 1][this.blankCol] = 0;
		this.blankRow++;
	}

	// Updates manhattan sum for this puzzle state.  Takes a goal mapping from Puzzle's goal mapping static method
	updateManhattanSum(goal_mapping) {
		let manhattanSum = 0;
		for (let row = 0; row < this.matrix.length; row++) {
			for (let col = 0; col < this.matrix[row].length; col++) {
				if (this.matrix[row][col]) {
					const goalPos = goal_mapping[this.matrix[row][col]];
					manhattanSum += Math.abs(row - goalPos.row) + Math.abs(col - goalPos.col);
				}
			}
		}

		this.manhattanSum = manhattanSum;
	}

	// Map our goal state's (row, col) for each tile value to quickly find distance in manhattan method without recalcuating the mapping for each state
	// Allows us to not assume a sqaure matrix (NxN) by accounting for NxP goal states
	// {1: {row: 0, col: 0}, ...}
	static getMatrixMapping(goal_state) {
		const map = {};
		for (let row = 0; row < goal_state.length; row++) {
			for (let col = 0; col < goal_state[row].length; col++) {
				map[goal_state[row][col]] = { row, col };
			}
		}

		return map;
	}

	generateNeighbors(goal_mapping = null) {
		const neighboringPuzzleStates = [];
		if (this.canSlideUp() && this.lastSlideDirection != slideDirections["DOWN"]) {
			let newPuzzle = Puzzle.fromPuzzle(this);
			newPuzzle.slideUp();
			newPuzzle.lastSlideDirection = slideDirections["UP"];
			neighboringPuzzleStates.push(newPuzzle);
		}

		if (this.canSlideDown() && this.lastSlideDirection != slideDirections["UP"]) {
			let newPuzzle = Puzzle.fromPuzzle(this);
			newPuzzle.slideDown();
			newPuzzle.lastSlideDirection = slideDirections["DOWN"];
			neighboringPuzzleStates.push(newPuzzle);
		}

		if (this.canSlideLeft() && this.lastSlideDirection != slideDirections["RIGHT"]) {
			let newPuzzle = Puzzle.fromPuzzle(this);
			newPuzzle.slideLeft();
			newPuzzle.lastSlideDirection = slideDirections["LEFT"];
			neighboringPuzzleStates.push(newPuzzle);
		}

		if (this.canSlideRight() && this.lastSlideDirection != slideDirections["LEFT"]) {
			let newPuzzle = Puzzle.fromPuzzle(this);
			newPuzzle.slideRight();
			newPuzzle.lastSlideDirection = slideDirections["RIGHT"];
			neighboringPuzzleStates.push(newPuzzle);
		}

		if (goal_mapping) {
			for (let puzzle of neighboringPuzzleStates) {
				puzzle.updateManhattanSum(goal_mapping);
				puzzle.costFromStart += 1;
			}
		}

		return neighboringPuzzleStates;
	}

	isEqualToPuzzle(puzzle) {
		for (let row = 0; row < puzzle.matrix.length; row++) {
			for (let col = 0; col < puzzle.matrix[row].length; col++) {
				if (puzzle.matrix[row][col] !== this.matrix[row][col]) {
					return false;
				}
			}
		}

		return true;
	}

	static isRowEqual(puzzle1, puzzle2, rowToCheck) {
		for (let col = 0; col < puzzle1.matrix[rowToCheck].length; col++) {
			if (puzzle1.matrix[rowToCheck][col] !== puzzle2.matrix[rowToCheck][col]) {
				return false;
			}
		}
		return true;
	}

	static isColEqual(puzzle1, puzzle2, colToCheck) {
		for (let row = 0; row < puzzle1.matrix.length; row++) {
			if (puzzle1.matrix[row][colToCheck] !== puzzle2.matrix[row][colToCheck]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Takes a 1D array and counts the inversions, returns false if inversions is odd and true if even.
	 * Assumes that the solution has the blank tile in the bottom row.
	 *
	 *
	 * Inversions the number of preceding tile values that are greater than any value following it left->right + top->down of puzzle
	 * A left or right move by the blank does not change inversions count
	 * For a puzzle with an odd number of columns, a move by the blank leave the evenness or oddness of inversions unchanged
	 * If the number of columns is even, an up or down move by the blank changes inversions by an odd number
	 * https://www.cs.mcgill.ca/~newborn/nxp_puzzleOct9.htm
	 *
	 *
	 * For my own sanity, including the three example cases here as this math as seemed iffy during development
	 * These prove some theoroms that should hold true as they scale out to infinity
	 * The odd row, even col case contradicts the above source, but seems to hold true through testing
	 * Works well enough for me, and maybe they are wrong ¯\_(ツ)_/¯
	 *
	 *
	 * ODD COLS [2x3] (holds true for even and/or odd rows)
	 *    [1, 2, 3] == Inversions: 0    even inversions: puzzle is solved
	 *    [4, 5, 0]
	 *
	 * 1. Up / down:
	 *    [1, 2, 0] == Inversions: 2    even inversions: is solvable
	 *    [4, 5, 3]
	 *
	 * 2. Left / right:
	 *    [1, 2, 3] == Inversions: 0    even inversions: is solvable
	 *    [4, 0, 5]
	 *
	 * 3. Unsolvable state:
	 *    [1, 3, 2] == Inversions: 1    odd inversions: is unsolvable
	 *    [4, 5, 0]
	 *
	 *
	 *
	 * EVEN ROWS AND COLS [2x2]:
	 *    [1, 2] == Row of blank: 0   Inversions: 0    0+0 == 0: puzzle is solved
	 *    [3, 0]
	 *
	 * 1. Up / down:
	 *    [1, 0] == Row of blank: 1   Inversions: 1    1+1 == 2: even is solvable
	 *    [3, 2]
	 *
	 * 2. Left / Right:
	 *    [1, 2] == Row of blank: 0   Inversions: 0    0+0 == 0: even is solvable
	 *    [0, 3]
	 *
	 * 3. Unsolvable state:
	 *    [1, 0] == Row of blank: 1   Inversions: 0    1+0 == 1: odd is unsolvable
	 *    [2, 3]
	 *
	 *
	 *
	 * ODD ROWS AND EVEN COLS EXAMPLE [3x2]:
	 *    [1, 2] == Row of blank: 0   Inversions: 0     0+0 == 0: puzzle is solved
	 *    [3, 4]
	 *    [5, 0]
	 *
	 * 1. Up / down:
	 *    [1, 2] == Row of blank: 1   Inversions: 1     1+1 == 2: even is solvable
	 *    [3, 0]
	 *    [5, 4]
	 *
	 * 2. Left / Right:
	 *    [1, 2] == Row of blank: 0   Inversions: 0     0+0 == 0: even is solvable
	 *    [3, 4]
	 *    [0, 5]
	 *
	 * 3. Unsolvable state:
	 *    [1, 2] == Row of blank: 0   Inversions: 1     0+1 == 1: odd is unsolvable
	 *    [4, 3]
	 *    [5, 0]
	 **/
	static isPuzzleSolvable1Darr(arr, rows, cols) {
		let inversions = 0;
		for (let i = 0; i < arr.length; i++) {
			for (let j = i + 1; j < arr.length; j++) {
				// Neither value is blank, and previous value is greater than next
				if (arr[i] && arr[j] && arr[i] > arr[j]) {
					inversions++;
				}
			}
		}

		// Odd columns: Number of inversions must be even
		if (cols % 2) {
			return !(inversions % 2);
		} else {
			// Even columns and odd/even rows: (inversions + rowOfBlankFromBottom) must be even
			// NOTE: Contradictory to source on odd col and even row case, but seems to hold true through testing
			const indexOfBlank = arr.indexOf(0);
			const rowOfBlankFromBottom = rows - (Math.floor(indexOfBlank / cols) + 1);
			return !((inversions + rowOfBlankFromBottom) % 2);
		}
	}

	static isPuzzleSolvable2Darr(matrix) {
		const arr = [];

		// Need blank row for determining solvable state
		let blankRow = undefined;

		// Turn into 1D array
		for (let row = 0; row < matrix.length; row++) {
			for (let col = 0; col < matrix[row].length; col++) {
				arr.push(matrix[row][col]);
			}
		}

		return Puzzle.isPuzzleSolvable1Darr(arr, matrix.length, matrix[0].length);
	}

	// Modern Fisher–Yates shuffle:
	// https://en.wikipedia.org/wiki/Fisher-Yates_shuffle
	static shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1)); // random from 0 -> i
			const temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		return array;
	}

	printPuzzle() {
		let string = "[";
		for (const row of this.matrix) {
			string += "[";
			for (const tile of row) {
				string += tile + ", ";
			}
			string += "],\n";
		}
		string += "]\n";
		console.log(string);
	}
}

export { Puzzle, slideDirections };
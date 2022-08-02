class Puzzle {
    static goalState = Puzzle.fromMatrix([ [1, 2, 3], 
                                           [4, 5, 6],
                                           [7, 8, 0] ]);

    static slideDirections = {
        "INITIAL": 0,
        "UP": 1,
        "DOWN": 2,
        "LEFT": 3,
        "RIGHT": 4,
    }

    constructor(genRandomPuzzle=true) {
        if (genRandomPuzzle) this.matrix = this.generateRandomPuzzle();
        this.lastSlideDirection = 0;
        this.manhattanSum = 0; // No need to calculate manhatten sum on initial puzzle state
        this.cameFrom = null; // Last puzzle state
        this.costFromStart = 0;
    }

    // Create deep copy of another puzzle
    static fromPuzzle(puzzle) {
        let copy = new this(false);
        copy.matrix = JSON.parse(JSON.stringify(puzzle.matrix));  //  TODO: is something better here needed?  Lodash deepclone faster?
        copy.blank_row = puzzle.blank_row;
        copy.blank_col = puzzle.blank_col;
        copy.manhattanSum = puzzle.manhattanSum;
        copy.costFromStart = puzzle.costFromStart;
        return copy;
    }

    // TODO: Only working for 3x3, maybe also validate this is a valid puzzle too :-)
    static fromMatrix(matrix) {
        let puzzle = new this(false);

        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[0].length; col++) {
                if (!matrix[row][col]) {
                    puzzle.blank_row = row;
                    puzzle.blank_col = col;
                }
            }
        }
        puzzle.matrix = matrix;
        return puzzle;
    }

    static getBlankTilePosition(puzzle) {
        for (let row = 0; row < puzzle.matrix.length; row++) {
            for (let col = 0; col < puzzle.matrix[row].length; col++) {
                if (puzzle.matrix[row][col] === 0) {
                    return [row, col];
                }
            }
        }
    }

    // Gives me a random, solveable puzzle
    generateRandomPuzzle() {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let puzzle_arr = [];
        do {
            puzzle_arr = Puzzle.shuffleArray(values);
        } 
        while (!Puzzle.isPuzzleSolvable1Darr(puzzle_arr));

        // Turn 1D array into our Puzzle Matrix from last to first to use arr.pop()
        let puzzle_matrix = [[,,,], [,,,], [,,,]];
        for (let row = 0; row < puzzle_matrix.length; row++) {
            for (let col = 0; col < puzzle_matrix[row].length; col++) {
                const value = puzzle_arr.shift();
                if (!value) {
                    this.blank_row = row;
                    this.blank_col = col;
                }
                puzzle_matrix[row][col] = value;
            }
        }

        return puzzle_matrix;
    }


    canSlideLeft() {
        // Edge guarding on left side
        if (this.blank_col <= 0) {
            return false;
        } else {
            return true;
        }
    }

    canSlideRight() {
        // Edge guarding on current row
        if (this.blank_col >= this.matrix[this.blank_row].length - 1) {
            return false;
        } else {
            return true;
        }
    }

    canSlideUp() {
        // Edge guarding on left side
        if (this.blank_row <= 0) {
            return false;
        } else {
            return true;
        }
    }

    canSlideDown() {
        // Edge guarding on left side
        if (this.blank_row >= this.matrix.length - 1) {
            return false;
        } else {
            return true;
        }
    }
    

    slideLeft() {
        // Edge guarding on left side
        if (this.blank_col <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row][this.blank_col - 1];
        this.matrix[this.blank_row][this.blank_col - 1] = 0;
        this.blank_col--;
    }


    slideRight() {
        // Edge guarding on current row
        if (this.blank_col >= this.matrix[this.blank_row].length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row][this.blank_col + 1];
        this.matrix[this.blank_row][this.blank_col + 1] = 0;
        this.blank_col++;
    }


    slideUp() {
        // Edge guarding on left side
        if (this.blank_row <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row - 1][this.blank_col];
        this.matrix[this.blank_row - 1][this.blank_col] = 0;
        this.blank_row--;
    }

    slideDown() {
        // Edge guarding on left side
        if (this.blank_row >= this.matrix.length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col] = this.matrix[this.blank_row + 1][this.blank_col];
        this.matrix[this.blank_row + 1][this.blank_col] = 0;
        this.blank_row++;
    }

    // Updates manhattan sum for this puzzle state.  Takes a goal mapping from Puzzle's goal mapping static method
    updateManhattanSum(goal_mapping) {
        let manhattanSum = 0;
        for(let row = 0; row < this.matrix.length; row++) {
            for(let col = 0; col < this.matrix[row].length; col++) {
                if (this.matrix[row][col]) {
                    const goalPos = goal_mapping[this.matrix[row][col]]
                    manhattanSum += ( Math.abs(row - goalPos.row) + Math.abs(col - goalPos.col) );    
                }
            }
        }

        this.manhattanSum = manhattanSum;
    }

    // Map our goal state's (row, col) for each tile value to quickly find distance in manhattan method without recalcuating the mapping for each state
    // Allows us to not assume a sqaure matrix (NxN) by accounting for NxP goal states
    // {1: {row: 0, col: 0}, ...}
    // TODO: Make goal mapping static on Puzzle
    static getGoalMapping(goal_state) {
        const map = {};
        for (let row = 0; row < goal_state.length; row++) {
            for (let col = 0; col < goal_state[row].length; col++) {
                map[goal_state[row][col]] = {row, col};
            }
        }

        return map;
    }

    generateNeighbors(goal_mapping=null) {
        const neighboringPuzzleStates = [];
        if (this.canSlideUp() && this.lastSlideDirection != Puzzle.slideDirections["DOWN"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideUp();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["UP"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideDown() && this.lastSlideDirection != Puzzle.slideDirections["UP"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideDown();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["DOWN"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideLeft() && this.lastSlideDirection != Puzzle.slideDirections["RIGHT"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideLeft();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["LEFT"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideRight() && this.lastSlideDirection != Puzzle.slideDirections["LEFT"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideRight();
            newPuzzle.lastSlideDirection = Puzzle.slideDirections["RIGHT"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (goal_mapping) {
            for (let puzzle of neighboringPuzzleStates) {
                puzzle.updateManhattanSum(goal_mapping)
                puzzle.costFromStart += 1;
            }
        }

        return neighboringPuzzleStates;
    }

    isInGoalState() {
        return this.isEqualToPuzzle(Puzzle.goalState)
    }

    isEqualToPuzzle(puzzle) {
        // TODO: Type checks, size checks, etc
        for (let row = 0; row < puzzle.matrix.length; row++) {
            for (let col = 0; col < puzzle.matrix[row].length; col++) {
                if (puzzle.matrix[row][col] !== this.matrix[row][col]) {
                    return false;
                }
            }
        }

        return true;
    }

    // TODO: Add unit tests!  Does this work for an odd N?  Does this work for NxM?
    /**
     * Takes a 1D array and counts the inversions, returns false if inversions is odd and true if even.
     * 
     * A pair of tiles form an inversion if the values on tiles are in reverse order of their appearance in goal state
     * For example, the following instance of 8 puzzle has two inversions, (8, 6) and (8, 7). 
     * 1   2   3
     * 4   _   5
     * 8   6   7
     */
    static isPuzzleSolvable1Darr(arr) {
        let inversions = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                // Not comparing either side with the blank space (0), and greater than next value
                if (arr[i] && arr[j] && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }
        // Return true on even, false on odd inversion count
        return !(inversions % 2)
    }

    static isPuzzleSolvable2Darr(matrix) {
        const arr = [];

        for(let row = 0; row < matrix.length; row++){
            for(let col = 0; col < matrix[0].length; col++) {
                arr.push(matrix[row][col]);
            }
        }

        let inversions = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                // Not comparing either side with the blank space (0), and greater than next value
                if (arr[i] && arr[j] && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }
        // Return true on even, false on odd inversion count
        return !(inversions % 2)
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
        let string = "";
        for (const row of this.matrix) {
            for (const tile of row) {
                string += tile + " ";;
            }
            string += "\n";
        }
        string += "\n";
        console.log(string)
    }
}
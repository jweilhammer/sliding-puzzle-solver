class Tile {
    constructor(value, row, column) {
      this.value = value;
      this.row = row;
      this.column = column;
    }
}

// TODO: Static variable somehow
const slideDirections = {
    "INITIAL": 0,
    "UP": 1,
    "DOWN": 2,
    "LEFT": 3,
    "RIGHT": 4,
}

class Puzzle {
    constructor(genRandomPuzzle=true) {
        if (genRandomPuzzle) this.matrix = this.generateRandomPuzzle();
        this.lastSlideDirection = 0;
    }

    // Create deep copy of another puzzle
    static fromPuzzle(puzzle) {
        let copy = new this(false);
        copy.matrix = JSON.parse(JSON.stringify(puzzle.matrix));  //  TODO: is something better here needed?  Lodash deepclone faster?
        copy.blank_row = puzzle.blank_row;
        copy.blank_col = puzzle.blank_col;
        return copy;
    }

    // TODO: Only working for 3x3
    static fromMatrix(matrix) {
        let puzzle = new this(false);
        puzzle.matrix = [[,,,], [,,,], [,,,]]; 
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[0].length; col++) {
                if (!matrix[row][col]) {
                    console.log("BLANK TILE", row, col)
                    puzzle.blank_row = row;
                    puzzle.blank_col = col;
                }
                puzzle.matrix[row][col] = new Tile(matrix[row][col], row, col);
            }
        }
        return puzzle;
    }

    // Gives me a random, solveable puzzle
    generateRandomPuzzle() {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 0];
        let puzzle_arr = [];
        do {
            puzzle_arr = this.shuffleArray(values);
        } 
        while (!this.isPuzzleSolvable(puzzle_arr));

        // Turn 1D array into our Puzzle Matrix from last to first to use arr.pop()
        let puzzle_matrix = [[,,,], [,,,], [,,,]];
        for (let row = 0; row < puzzle_matrix.length; row++) {
            for (let col = 0; col < puzzle_matrix[row].length; col++) {
                const value = puzzle_arr.shift();
                if (!value) {
                    this.blank_row = row;
                    this.blank_col = col;
                }
                puzzle_matrix[row][col] = new Tile(value, row, col);
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

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row][this.blank_col - 1].value;
        this.matrix[this.blank_row][this.blank_col - 1].value = 0;
        this.blank_col--;
    }


    slideRight() {
        // Edge guarding on current row
        if (this.blank_col >= this.matrix[this.blank_row].length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row][this.blank_col + 1].value;
        this.matrix[this.blank_row][this.blank_col + 1].value = 0;
        this.blank_col++;
    }


    slideUp() {
        // Edge guarding on left side
        if (this.blank_row <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row - 1][this.blank_col].value;
        this.matrix[this.blank_row - 1][this.blank_col].value = 0;
        this.blank_row--;
    }

    slideDown() {
        // Edge guarding on left side
        if (this.blank_row >= this.matrix.length - 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row + 1][this.blank_col].value;
        this.matrix[this.blank_row + 1][this.blank_col].value = 0;
        this.blank_row++;
    }

    generateNeighbors() {
        const neighboringPuzzleStates = [];
        if (this.canSlideUp() && this.lastSlideDirection != slideDirections["UP"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideUp();
            newPuzzle.lastSlideDirection = slideDirections["UP"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        if (this.canSlideDown() && this.lastSlideDirection != slideDirections["DOWN"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideDown();
            newPuzzle.lastSlideDirection = slideDirections["DOWN"];
            neighboringPuzzleStates.push(newPuzzle);
    
        }

        if (this.canSlideLeft() && this.lastSlideDirection != slideDirections["LEFT"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideLeft();
            newPuzzle.lastSlideDirection = slideDirections["LEFT"];
            neighboringPuzzleStates.push(newPuzzle);
   
        }

        if (this.canSlideRight() && this.lastSlideDirection != slideDirections["RIGHT"]) {
            let newPuzzle = Puzzle.fromPuzzle(this);
            newPuzzle.slideRight();
            newPuzzle.lastSlideDirection = slideDirections["RIGHT"];
            neighboringPuzzleStates.push(newPuzzle);
        }

        return neighboringPuzzleStates;
    }

    isInGoalState(goal_matrix) {
        for (let row = 0; row < goal_matrix.length; row++) {
            for (let col = 0; col < goal_matrix[row].length; col++) {
                if (goal_matrix[row][col] !== this.matrix[row][col].value) {
                    return false;
                }
            }
        }

        return true;
    }

    isEqualToPuzzle(puzzle) {
        // TODO: Type checks, size checks, etc
        for (let row = 0; row < puzzle.matrix.length; row++) {
            for (let col = 0; col < puzzle.matrix[row].length; col++) {
                if (puzzle.matrix[row][col].value !== this.matrix[row][col].value) {
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
    isPuzzleSolvable(arr) {
        let inversions = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                // Not the blank space (0), and greater than next value
                if (arr[i] && arr[i] > arr[j]) {
                    inversions++;
                }
            }
        }
        // Return true on even, false on odd inversion count
        return !(inversions % 2)
    }
    
    // Modern Fisher–Yates shuffle:
    // https://en.wikipedia.org/wiki/Fisher-Yates_shuffle
    shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)); // random from 0 -> i
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    printPuzzle() {
        for (const row of this.matrix) {
            for (const tile of row) {
                process.stdout.write(tile.value + " ");
            }
            process.stdout.write("\n");
        }
        process.stdout.write("\n");
    }


}

module.exports = Puzzle;
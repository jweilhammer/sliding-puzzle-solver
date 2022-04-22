class Tile {
    constructor(value, row, column) {
      this.value = value;
      this.row = row;
      this.column = column;
    }
}

class Puzzle {
    constructor(size) {
        this.size = size;
        this.matrix = this.generateRandomPuzzle();
        this.blank_row;
        this.blank_col;
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
        for (let row = puzzle_matrix.length - 1; row >= 0; row--) {
            for (let col = puzzle_matrix[0].length - 1; col >= 0; col--) {
                const value = puzzle_arr.pop();
                if (!value) {
                    this.blank_row = row;
                    this.blank_col = col;
                }
                puzzle_matrix[row][col] = new Tile(value, row, col);
            }
        }
        return puzzle_matrix;
    }


    slideLeft() {
        // Edge guarding on left side
        if (this.blank_col <= 0) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row][this.blank_col - 1].value;
        this.matrix[this.blank_row][this.blank_col - 1].value = 0;
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
        if (this.blank_row >= this.matrix.length + 1) {
            return false;
        }

        this.matrix[this.blank_row][this.blank_col].value = this.matrix[this.blank_row + 1][this.blank_col].value;
        this.matrix[this.blank_row + 1][this.blank_col].value = 0;
        this.blank_row++;
    }

    isInGoalState(goal_matrix) {
        for (let row = 0; row < goal_matrix.length; row++) {
            for (let col = 0; col < goal_matrix[row].length; col++) {
                if (goal_matrix[row][col] != this.matrix[row][col].value) {
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
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
        this.puzzle = this.generateRandomPuzzle();
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
        for (let i = puzzle_matrix.length - 1; i >= 0; i--) {
            for (let j = puzzle_matrix[0].length - 1; j >= 0; j--) {
                puzzle_matrix[i][j] = new Tile(puzzle_arr.pop(), i, j);
            }
        }
        return puzzle_matrix;
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
        for (const row of this.puzzle) {
            for (const tile of row) {
                process.stdout.write(tile.value + " ");
            }
            process.stdout.write("\n");
        }
    }
}

puzzle = new Puzzle(3);
puzzle.printPuzzle();
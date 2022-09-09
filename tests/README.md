# Testing

## Possible Puzzle States
Testing here is interesting because it is not trivial to test every single sliding puzzle state, even at 3x3

This is because the amount of possible puzzle states increases by a factorial degree.  See the table below:
```
Possible puzzle states:
1x1 =  1! = 1
2x2 =  4! = 24
3x3 =  9! = 362880
4x4 = 16! = 20922790000000
5x5 = 25! = 15511210000000000000000000
...
```

### Solvable States
Of those possible states, exactly half belong to the traditionally solvable space (visually correct and numbered tiles in order).  The other belong to an "unsolvable" space where one tile will always be off if trying to solve traditionally.  It is impossible to maneuver a solvable puzzle into an "unsolvable" state.

So there are two groups for the total puzzle states:
```
Traditionally solvable:
[1,2]
[3,0]

Traditionally "unsolvable":
[2,1]
[3,0]
```

An interesting note for custom goal states is that from any starting solvable or "unsolvable" state, it is possible to maneuver the puzzle into any other state in that solvability space.  See puzzleTheory.test.js


## Running tests
Run the tests with:
```
npm test
```

To run all tests including 3x3 (which is ~16 billion comparisons for puzzle solvability).  I ran this once on a regular node process that seemed to be much faster than mocha (still took around 12 hours to run with the strategic algorithm). TODO on getting this to a reasonable runtime (use Node instead of mocha, GPU acceleration?)
```
npm testFull
```

To run just a demo of solving random large puzzles with random goal states with the strategic algorithm:
```
npm testStrategic
```

## TODO

Should add unit tests for Puzzle class, and UI utils functions

Get specific test cases for all logic in strategic algorithm

Add mechanism for tests to run faster.  They seem to be super slow in mocha rather than in a regular node process.  Run this with Node?  GPU acceleration?
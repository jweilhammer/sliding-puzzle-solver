# SlidingPuzzle

Cool sliding puzzle program that can solve puzzles for you using different algorithms

TODO:
- IDA*


# A* Heuristic

## Manhattan distance
https://en.wikipedia.org/wiki/Taxicab_geometry
> In two dimensions, the taxicab distance between two points (x1,y1) and (x2,y2) is |x1-x2|+|y1-y2|. That is, it is the sum of the absolute values of the differences between both sets of coordinates.


# Puzzle Solvability
Puzzles states are solvable based on the number of inversions in the matrix.  An inversion being defined as a number being greater than one that follows it (ignoring the blank space).

This is easiest to conceptualize by mapping the Puzzle matrix as a regular array.  In the example below, there is 1 inversion (3 > 2).  And in this case, you can see the puzzle is unsolvable to get to a goal state of [1, 2, 3, 0] (See [Square vs Non-Square Puzzle Solvability](#square-vs-non-square-puzzle-solvability) )
```
|1 3|
|0 2| =>  [1, 3, 0, 2]
```

In this case, you can see the puzzle has 1 inversion (3 > 2)


## Square vs Non-Square Puzzle Solvability
Different rules must be followed for square vs non-square puzzles [3x3] vs [2x3], [3x2] ... etc]

https://www.cs.mcgill.ca/~newborn/nxp_puzzleOct9.htm
> An NxP-puzzle with an odd number of columns can be solved only if NI is an even number.  An NxP-puzzle with an even number of columns and an even number of rows can be solved only if (NI + Row of the blank) is an even number. An NxP-puzzle with an even number of columns and an odd number of rows can be solved only if (NI + Row of the blank) is an odd number.
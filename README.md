# Sliding Puzzle Solver

For live demo see: https://jweilhammer.github.io/sliding-puzzle-solver/

For details on what a sliding puzzle is, see: https://en.wikipedia.org/wiki/Sliding_puzzle

This project aims to show differences in several common search algorithms, implement a strategic algorithm to solve any sized puzzle, allow the user to edit puzzle start/goal states to solve themselves or with an algorithm, and package it all into a mobile friendly progressive web app


# Strategic Algorithm

In order to solve puzzle that are larger than a 3x3 efficiently, a strategic algorithm has been implemented

It essentially follows a strategy that anyone can do, and is based off of this [WikiHow Algorithm for Solving Sliding Puzzles](https://www.wikihow.com/Solve-Slide-Puzzles)

In addition to the above steps to solve basic puzzles, here is the logic my algorithm follows for solving custom goal states (goal's blank tile is not in bottom right corner):
```
Rules:
1. If the puzzle is non-square, solve rows or columns first until remaining unsolved puzzle is square

2. Alternate between solving rows and columns until remaining unsolved puzzle is a 2x2
    * The remaining 2x2 puzzle should include the blank space

3. Start by solving rows top/down & columns left/right until reaching the goal's blank row/col
    * If on the goal's blank row, start solving rows bottom/up
    * If on the goal's blank col, start solving cols right/left

4. Once a tile is in its goal position, never touch it again
    * Each solved row/col reduces the effective problem space and leave an inner un-solved puzzle
    * When moving tiles on edge cases, always move blank towards the inner un-solved puzzle
```

What is interesting is that while this algorithm does not give an optimal solution, the runtime is incredibly fast and memory space is constant.  This allows it to outperform all the other search algorithms and scale to very large puzzle sizes.



# Setup
This project has no runtime dependencies.  Mocha and Webpack are included as dev dependencies for testing, minifying assets, and adding a local web server to auto-refresh assets during development 

Install the dev dependencies with:
```
npm install
```

You can run a development server locally that auto-refreshes assets with:
```
npm start
```

Output minified assets for production with:
```
npm run build
```

# Testing

For details on testing and some notes on Puzzle solvability, check out: [tests/README.md](tests/README.md)

The [Mocha testing framework](https://mochajs.org) is currently being used to run tests to make sure our assumptions on solvability are correct, each algorithm can solve custom goal states, and that the strategic algorithm works for larger puzzles.  

TODO on more detailed unit tests for all methods, but this is fine for now


# Feature list
* Solve any sized NxP sliding puzzle with any start and goal state incredibly fast with custom strategic algorithm
* Visualize and compare runtimes and memory usage common search algorithms for 3x3 sliding puzzles
  * Breadth-first Search
  * A* (with and without closed list/set)
  * IDA* (Iterative Deepening)
* UI utilities
  * Allow user to solve puzzle themselves, following regular sliding rules
  * Edit puzzle goal and start states 
    * Click/drag to swap tiles
    * Allows for all possible start and goal states
  * Resize puzzle
  * Shuffle Puzzle
  * Reset Puzzle
  * Rotate Puzzle
  * Flip puzzle tiles horizontally/vertically
  * Randomize puzzle size and state using above
  * Custom background image
    * Local image upload
    * External image URL upload
  * Flip background image horizontally/vertically
  * Toggle borders on puzzle grid
  * Toggle numbers on puzzle grid
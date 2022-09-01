# Sliding Puzzle Solver

Sliding puzzle game solver:

https://en.wikipedia.org/wiki/Sliding_puzzle


TODO: Add some details in here about Puzzles, solvability, 

# Feature list
* Solve any sized NxP sliding puzzle with any start and goal state incredibly fast with custom algorithm
  * Algorithm is not optimal, but memory usage is constant and runtime is O(nlog(n)) on average
* Visualize and compare runtimes and memory usage common search algorithms for 3x3 sliding puzzles
  * Breadth-first Search
  * A* (with and without closed list/set)
  * IDA* (Iterative Deepening)
* UI utilities
  * Edit puzzle goal and start states 
    * Click/drag to swap tiles
    * Allows for all possible start and goal states
  * Choose algorithm to solve with
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


# Setup
This project has no external depedencies, and only webpack is used as a dev dependency to minify assets and give a local web server for the dev environment.

## Webpack Setup
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
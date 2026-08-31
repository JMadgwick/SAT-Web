# SAT Web

SAT-Web is a web-based educational tool for explaining [SAT solving](https://en.wikipedia.org/wiki/SAT_solver). It provides visualisations with search trees and variable interaction graphs, and includes a DPLL solver with tracing.

## Accessing SAT Web

[SAT Web can be accessed from GitHub pages](https://jmadgwick.github.io/SAT-Web/).

## Screenshot

![Screenshot of SAT-Web](/doc/overview.png)

## Developing

### Prerequisites

Node JS (tested with version v22.14.0 & v22.8.0)

### Installing dependencies

`npm install`

### Running Preview

`npm run dev`

### Building

Generates HTML and assets and places them into a `dist` folder.

`npm run build`

### Generating API Documentation

The TypeScript source is documented with [JSDoc](https://jsdoc.app/) comments, and [TypeDoc](https://typedoc.org/) generates an HTML reference from them.

`npm run docs`

This writes the generated documentation into a `docs` folder (a build artifact, not committed to the repository).

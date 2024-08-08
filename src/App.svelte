<script lang="ts">
  import Examples from './lib/Examples.svelte'
  import Notation from './lib/Notation.svelte'
  import SearchGraph from './lib/SearchGraph.svelte'
  import VariableInteractionGraph from './lib/VariableInteractionGraph.svelte'
  import SolverLog from './lib/SolverLog.svelte'
  import eventsToSearchElements from './lib/searchGraph'
  import clausesToInteractionElements from './lib/variableInteractionGraph'
  import cytoscape from 'cytoscape'
  import {Solver, type eventType} from './lib/solver' // use export default to remove need for {}
  import { sequentialBacktrackingSolver } from './lib/sequentialBacktrackingSolver';
  let solver:Solver = new Solver("")
  let events: eventType[] = [] // Solver events
  let clauses:number[][] = [] // For storing clauses, reassignments automatically trigger UI updates
  let variableAssignments:Map<number, boolean> // For storing variable assignments
  let test = "" //placehodler testing search tree
  let searchGraphElements:cytoscape.ElementDefinition[] // Search Graph Cytoscape elements
  let variableInteractionElements:[Boolean, cytoscape.ElementDefinition[]] // Variable Interaction Graph Cytoscape elements
  let dimacsInput = ""// DIMACS input from UI (automatically updated when text input changes)
  let dimacsFile:FileList // DIMACS file input
  // This reactive statement runs whenever the value it involves changes (which happens when a new file is picked)
  $: if (dimacsFile) {
    dimacsFile[0].text().then(txt => dimacsInput = txt)
  }
  let exampleProblem:string = "" // Example problem selection
  $: if (exampleProblem != "") {
    dimacsInput = exampleProblem
    exampleProblem = ""
  }
  function parseDIMACS(){
    solver = new sequentialBacktrackingSolver(dimacsInput)
    if (solver.parse()) {
      clauses = solver.clauses
      variableAssignments = solver.getAssignments()
      searchGraphElements = []
      events = []
      variableInteractionElements = [true, clausesToInteractionElements(solver.clauses)]
    }
  }

  function solveStep(){
    if (!solver.isSolvingFinished()) {
      events = solver.solveStep()
      searchGraphElements = eventsToSearchElements(events)
      clauses = solver.clauses
      variableAssignments = solver.getAssignments()
      variableInteractionElements = [false, clausesToInteractionElements(solver.getClauses())]
    }
  }

  function solveAll(){
    let startTime = Date.now()
    while (!solver.isSolvingFinished()) {
      solver.solveStep()
    }
    events = solver.getEvents()
    searchGraphElements = eventsToSearchElements(events)
    test = JSON.stringify(searchGraphElements)
    let endTime = Date.now()
    console.log((endTime - startTime)/1000)
  }
</script>
<header></header>
<main>
  <section class="panels">
    <!-- Left Hand Side -->
    <div class="left-boxes">
      <div id="left-top">
        <div id="file-upload" style="border: 2px solid yellow;display: flex;justify-content: center;align-items: center;">
          <label for="dimacs-file">Load DIMACS from file</label>
          <input type="file" accept="text/*,.cnf" bind:files={dimacsFile} id="dimacs-file" name="dimacs">
        </div>
        <div style="border: 2px solid blue;display: flex;justify-content: center;align-items: center;">
          <h3>Example SAT problems:</h3>
          <Examples bind:selection={exampleProblem}/>
        </div>
      </div>
      <div id="left-mid">
        <div style="border: 2px solid yellow;display:flex;flex-flow:column;">
          <h3>DIMACS CNF Input:</h3>
          <!-- TODO disable parse button when box is empty -->
          <textarea id="dimacs-input" bind:value={dimacsInput}/>
        </div>
        <div style="border: 2px solid blue;">
          <h3>SAT instance in mathematical notation:</h3>
          <div id="notation">
            <!-- <button>dropdown with options for original / current (all eliminations removed) / both</button> -->
            <Notation clauses={clauses} assignments={variableAssignments}/>
          </div>
        </div>
      </div>
      <div id="left-bot">
        <VariableInteractionGraph elements={variableInteractionElements}/>
        <SearchGraph elements={searchGraphElements}/>
      </div>
    </div>
    <!-- Right Hand Side -->
    <div class="right-boxes">
      <div id="right-top">
        <div><h2>SAT solving log</h2></div>
        <div style="text-align: right;"><a href="https://example.com" target="_blank" rel="noreferrer">User instruction manual</a></div>
      </div>
      <div class="output-box-container" style="border: 5px solid aqua;">
        <SolverLog bind:events/>
      </div>
      <div>
        <button on:click={parseDIMACS}>Parse Input</button>
        <button on:click={solveStep}>Solve (Single Step)</button>
        <button on:click={solveAll}>Solve All</button>
        <h3>Learnt Clauses</h3>
      </div>
      <div class="output-box-container" style="background-color: red;">
        <textarea class="output-box" id="learnt-clauses" readonly value="{test}" />
      </div>
    </div>
  </section>
</main>
<footer>&COPY; 2024</footer>

<style>
  /* Todo: Somehow use grid and flex thing to start from scratch? */
  /* Setting 95vh on ".panels" with everything empty might be a solution, or 100vh on body or smthing? */
  footer {
    color: #888;
    text-align: center;
  }
  textarea {
    font-size: large;
    resize: none;
    overflow-y: scroll;
  }
  .output-box {
    width: 100%;
    margin: 0.5em;
  }
  .output-box-container {
    display: flex;
  }
  .panels {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    /* min-height: 95vh; */
    /* height: 100%; */
    /* gap: 4px; */
    /* align-items: center;
    display: flex; */
  }
  #dimacs-input {
    width: 95%;
    height: 15em;
    margin: 0 auto;
  }
  #notation {
    width: 98%;
    height: auto;
    border: 2px solid black;
    overflow: auto;
    max-height: 15em;
    min-height: 1.8em;
    margin: 0 auto;
    padding: 0.25em;
  }
  #right-top {
    display: grid;
    grid-template-columns: 3fr 1fr;
    /* gap: 4px; */
  }
  .right-boxes {
    display: grid;
    grid-template-rows: 4em 30em 6em 30em;/* 1fr 4fr 1fr 4fr; */
  }
  .left-boxes {
    display: grid;
    grid-template-rows: 1fr 4fr 8fr;/* 4em 30em 30em */
    border: 5px solid chocolate;
  }
  #left-top {
    display: grid;
    grid-template-columns: 2fr 6fr;
    border: 3px solid green;
    height: 100%;
    box-sizing: border-box;/* required for proper nesting */
  }
  #left-mid {
    display: grid;
    grid-template-columns: 3fr 5fr;
    border: 3px solid orchid;
    height: 100%;
    box-sizing: border-box;/* required for proper nesting */
  }
  #left-bot {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 3px solid lightseagreen;
    height: 100%;
    box-sizing: border-box;/* required for proper nesting */
  }
  #file-upload input {
    width: 0em;
    height: 0em;
  }
  button, #file-upload label {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: skyblue;
    cursor: pointer;
    transition: border-color 0.25s;
  }
  button:hover, #file-upload label:hover {
    border-color: #646cff;
  }
  button:focus, #file-upload label:focus, button:focus-visible, #file-upload label:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }
</style>

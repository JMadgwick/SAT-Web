<script lang="ts">
  import Examples from './lib/Examples.svelte'
  import Notation from './lib/Notation.svelte'
  import SearchGraph from './lib/SearchGraph.svelte'
  import VariableInteractionGraph from './lib/VariableInteractionGraph.svelte'
  import SolverLog from './lib/SolverLog.svelte'
  import eventsToSearchElements from './lib/searchGraph'
  import clausesToInteractionElements from './lib/variableInteractionGraph'
  import cytoscape from 'cytoscape'
  import { DPLLSolver } from './lib/DPLLsolver' // use export default to remove need for {}
  import { backtrackingSolver } from './lib/backtrackingsolver'
  import type { eventType } from './lib/solver'
  let solver:DPLLSolver = new DPLLSolver("")
  let events: eventType[] = [] // Solver events
  let clauses:number[][] = [] // For storing clauses, reassignments automatically trigger UI updates
  let variableAssignments:Map<number, boolean> // For storing variable assignments
  let nextSolverStep = "" // Next operation to be taken by the solver
  let searchGraphElements:cytoscape.ElementDefinition[] // Search Graph Cytoscape elements
  let variableInteractionElements:[Boolean, cytoscape.ElementDefinition[]] // Variable Interaction Graph Cytoscape elements
  let dimacsInput = ""// DIMACS input from UI (automatically updated when text input changes)
  let dimacsFile:FileList // DIMACS file input
  let basicStats = {decisions: 0, steps: 0, backtracks: 0}
  let moreStats = {remainingVariables: 0, remainingClauses: 0, pureLiterals: 0, unitPropagations: 0}
  let solverReady = false
  let solverSelection:string // Kind of solver to use
  // This reactive statement runs whenever the value it involves changes (which happens when a new file is picked)
  $: if (dimacsFile) {
    dimacsFile[0].text().then(txt => dimacsInput = txt)
  }
  let exampleProblem:string = "" // Example problem selection
  $: if (exampleProblem != "") {
    dimacsInput = exampleProblem
    exampleProblem = ""
  }
  $: if (solverSelection) {
    solverReady = false
  }
  function parseDIMACS(){
    basicStats = {decisions: 0, steps: 0, backtracks: 0}
    moreStats = {remainingVariables: 0, remainingClauses: 0, pureLiterals: 0, unitPropagations: 0}
    solver = (solverSelection == "dpll") ? new DPLLSolver(dimacsInput) : new backtrackingSolver(dimacsInput)
    if (solver.parse()) {
      clauses = solver.getInitialClauses()
      variableAssignments = solver.getAssignments()
      searchGraphElements = []
      events = []
      nextSolverStep = solver.getNextStep()
      variableInteractionElements = [true, clausesToInteractionElements(solver.getInitialClauses())]
      solverReady = true
    }
  }

  function solveStep(){
    if (!solver.isSolvingFinished()) {
      events = solver.solveStep()
      searchGraphElements = eventsToSearchElements(events)
      clauses = solver.getInitialClauses()//why call this more than once?
      variableAssignments = solver.getAssignments()
      nextSolverStep = solver.getNextStep()
      variableInteractionElements = [false, clausesToInteractionElements(solver.getCurrentClauses())]
      basicStats = {decisions: solver.decisionCount, steps: solver.stepCount, backtracks: solver.backtrackCount}
      moreStats = {remainingVariables: solver.getRemainingVariableCount(), remainingClauses: solver.getRemainingClauseCount(), pureLiterals: solver.pureLiteralEliminationCount, unitPropagations: solver.unitPropagationCount}
    }
    if (solver.isSolvingFinished()) {
      solverReady = false
    }
  }

  function solveAll(){
    let startTime = Date.now()
    while (!solver.isSolvingFinished()) {
      solver.solveStep()
    }
    events = solver.getEvents()
    searchGraphElements = eventsToSearchElements(events)
    let endTime = Date.now()
    console.log((endTime - startTime)/1000)
    basicStats = {decisions: solver.decisionCount, steps: solver.stepCount, backtracks: solver.backtrackCount}
    moreStats = {remainingVariables: 0, remainingClauses: 0, pureLiterals: solver.pureLiteralEliminationCount, unitPropagations: solver.unitPropagationCount}
    solverReady = false
  }

  function benchmark(){
    let startTime = Date.now()
    while (!solver.isSolvingFinished()) {
      solver.solveStep()
    }
    let endTime = Date.now()
    console.log((endTime - startTime)/1000)
    let assignments = solver.getAssignments()
    let text = `Time: ${(endTime - startTime)/1000} secs\nAssignments: `
    for (const [variable, value] of assignments) {
      text = text + `${variable}=${value} `
    }
    alert(text)
  }
</script>
<header></header>
<main>
  <section class="panels">
    <!-- Left Hand Side -->
    <div class="left-boxes">
      <div id="left-top">
        <div id="file-upload" style="display: flex;justify-content: center;align-items: center;">
          <label for="dimacs-file">Load DIMACS from file</label>
          <input type="file" accept="text/*,.cnf" bind:files={dimacsFile} id="dimacs-file" name="dimacs">
        </div>
        <div style="display: flex;justify-content: center;align-items: center;">
          <h3>Example SAT problems:</h3>
          <Examples bind:selection={exampleProblem}/>
        </div>
      </div>
      <div id="left-mid">
        <div style="display:flex;flex-flow:column;">
          <h3>DIMACS CNF Input:</h3>
          <!-- TODO disable parse button when box is empty -->
          <textarea id="dimacs-input" bind:value={dimacsInput}/>
        </div>
        <div style="">
          <h3>SAT instance in mathematical notation:</h3>
          <div id="notation">
            <!-- <button>dropdown with options for original / current (all eliminations removed) / both</button> -->
            <Notation clauses={clauses} assignments={variableAssignments}/>
          </div>
        </div>
      </div>
      <div id="left-bot">
        <div style="display: flex;flex-grow: 3;flex-direction: column;max-width: 40em;">
          <div style="padding-left: 0.25em;">Variable Interaction Graph</div>
          <VariableInteractionGraph elements={variableInteractionElements}/>
        </div>
        <div style="display: flex;flex-grow: 3;flex-direction: column;max-width: 40em;">
          <div style="padding-left: 0.25em;">Search Graph</div>
          <SearchGraph elements={searchGraphElements}/>
        </div>
      </div>
    </div>
    <!-- Right Hand Side -->
    <div class="right-boxes">
      <div id="right-top">
        <div><h2>SAT solving log</h2></div>
        <div style="text-align: right;"><a href="https://example.com" target="_blank" rel="noreferrer">User instruction manual</a></div>
      </div>
      <div class="output-container" style="">
        <SolverLog bind:events/>
      </div>
      <div style="padding-left: 0.5em;">
        <select id="solver-selection" bind:value={solverSelection}>
          <option value="backtracking">Backtracking</option>
          <option value="dpll" selected>DPLL</option>
        </select>
        <button on:click={parseDIMACS}>Parse Input</button>
        <button on:click={solveStep} disabled={!solverReady}>Solve (Single Step)</button>
        <button on:click={solveAll} disabled={!solverReady}>Solve All</button>
        <button on:click={benchmark} disabled={!solverReady}>Benchmark</button>
        <span>Next Step: <span style="text-transform: uppercase;">{nextSolverStep}</span></span>
        <h3>Solver Information</h3>
      </div>
      <div class="output-container" id="solver-info" style="border: 2px solid black;margin-left: 0.5em;padding: 0.25em">
        <div class={solverReady ? "hidden" : ""}>Solver not initialised. Use "Parse Input" to load a problem from input.</div>
        <div class={solverReady ? "" : "hidden"}>Decision Count: {basicStats.decisions}</div>
        <div class={solverReady ? "" : "hidden"}>Step Count: {basicStats.steps}</div>
        <div class={solverReady ? "" : "hidden"}>Backtrack Count: {basicStats.backtracks}</div>
        <div class={solverReady ? "" : "hidden"}>Remaining Clause Count: {moreStats.remainingClauses}</div>
        <div class={solverReady ? "" : "hidden"}>Remaining Variable Count: {moreStats.remainingVariables}</div>
        <div class={(solverReady && solverSelection == "dpll") ? "" : "hidden"}>Pure Literal Elimination Count: {moreStats.pureLiterals}</div>
        <div class={(solverReady && solverSelection == "dpll") ? "" : "hidden"}>Unit Propagation Count: {moreStats.unitPropagations}</div>
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
  .output-container {
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
    border: 2px solid black;
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
    /* border: 5px solid chocolate; */
  }
  #left-top {
    display: grid;
    grid-template-columns: 2fr 6fr;
    /* border: 3px solid green; */
    height: 100%;
    box-sizing: border-box;/* required for proper nesting */
  }
  #left-mid {
    display: grid;
    grid-template-columns: 3fr 5fr;
    /* border: 3px solid orchid; */
    height: 100%;
    box-sizing: border-box;/* required for proper nesting */
  }
  #left-bot {
    display: flex;
    grid-template-columns: 1fr 1fr;
    /* border: 3px solid lightseagreen; */
    height: 100%;
    box-sizing: border-box;/* required for proper nesting */
  }
  #file-upload input {
    width: 0em;
    height: 0em;
  }
  #solver-info {
    display: grid;
  }
  #solver-selection {
    font-family: inherit;
    font-size: 100%;
    height: 2.5em;
    font-weight: 500;
  }
  .hidden {
    display: none;
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
  button:disabled {
    border-color: gray;
    background-color: lightgray;
  }
  button:focus, #file-upload label:focus, button:focus-visible, #file-upload label:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }
</style>

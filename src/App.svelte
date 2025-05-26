<script lang="ts">
  import Examples from './lib/Examples.svelte'
  import Notation from './lib/Notation.svelte'
  import SearchGraph from './lib/SearchGraph.svelte'
  import VariableInteractionGraph from './lib/VariableInteractionGraph.svelte'
  import SolverLog from './lib/SolverLog.svelte'
  import ResultDialog from './lib/ResultDialog.svelte'
  import eventsToSearchElements from './lib/searchGraph'
  import clausesToInteractionElements from './lib/variableInteractionGraph'
  import cytoscape from 'cytoscape'
  import { DPLLSolver } from './lib/DPLLsolver'
  import { backtrackingSolver } from './lib/backtrackingsolver'
  import type { eventType } from './lib/solver'
  let solver: DPLLSolver = new DPLLSolver("")
  let events: eventType[] = [] // Solver events
  let clauses: number[][] = [] // For storing clauses, reassignments automatically trigger UI updates
  let variableAssignments: Map<number,boolean|undefined> // For storing variable assignments
  let nextSolverStep = "" // Next operation to be taken by the solver
  let searchGraphElements: cytoscape.ElementDefinition[] // Search Graph Cytoscape elements
  let variableInteractionElements: [Boolean, cytoscape.ElementDefinition[]] // Variable Interaction Graph Cytoscape elements
  let dimacsInput = "" // DIMACS input from UI (automatically updated when text input changes)
  let dimacsFile: FileList // DIMACS file input
  let basicStats = {decisions: 0, steps: 0, backtracks: 0}
  let moreStats = {remainingVariables: 0, remainingClauses: 0, pureLiterals: 0, unitPropagations: 0}
  let solverReady = false
  let solverSelection: string // Kind of solver to use
  let resultsDialog: ResultDialog // Reference to dialog box component
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
      clauses = solver.getInitialClauses()
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
    solverReady = false
    let endTime = Date.now()
    console.log((endTime - startTime)/1000)
    resultsDialog.setValues(`Time taken: ${(endTime - startTime)/1000} secs. Assignments:`, solver.getAssignments())
    resultsDialog.openBox()
  }

  function checkAssignments(){
    resultsDialog.setValues(`Assignments:`, solver.getAssignments())
    resultsDialog.openBox()
  }
</script>
<header>
  <ResultDialog bind:this={resultsDialog}/>
</header>
<main>
  <!-- Left Hand Side -->
  <div id="left-boxes">
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
      <div class="flex-container">
        <h3>DIMACS CNF Input:</h3>
        <textarea id="dimacs-input" bind:value={dimacsInput}/>
      </div>
      <div class="flex-container">
        <h3>SAT instance in mathematical notation:</h3>
        <div id="notation">
          <Notation clauses={clauses} assignments={variableAssignments}/>
        </div>
      </div>
    </div>
    <div id="left-bot">
      <div class="flex-container">
        <h4>Variable Interaction Graph</h4>
        <VariableInteractionGraph elements={variableInteractionElements}/>
      </div>
      <div class="flex-container">
        <h4>Search Graph</h4>
        <SearchGraph elements={searchGraphElements}/>
      </div>
    </div>
  </div>
  <!-- Right Hand Side -->
  <div id="right-boxes">
    <div class="flex-container">
      <div id="right-top">
        <div><h2>SAT solving log</h2></div>
        <div style="text-align: right;"><a href="https://example.com" target="_blank" rel="noreferrer">User instruction manual</a></div>
      </div>
      <div id="solverlog">
        <SolverLog bind:events/>
      </div>
      <div>
        <select id="solver-selection" bind:value={solverSelection}>
          <option value="backtracking">Backtracking</option>
          <option value="dpll" selected>DPLL</option>
        </select>
        <button on:click={parseDIMACS} disabled={dimacsInput==""}>Parse Input</button>
        <button on:click={solveStep} disabled={!solverReady}>Solve (Single Step)</button>
        <button on:click={solveAll} disabled={!solverReady}>Solve All</button>
        <button on:click={benchmark} disabled={!solverReady}>Benchmark</button>
        <button on:click={checkAssignments} disabled={!(solverReady || solver.isSolvingFinished())}>View Assignments</button>
        <span>Next Step: <span style="text-transform: uppercase;">{nextSolverStep}</span></span>
      </div>
    </div>
    <div class="flex-container">
      <h3>Solver Information</h3>
      <div id="solver-info">
        <div class={(solverReady || solver.isSolvingFinished()) ? "hidden" : ""}>Solver not initialised. Use "Parse Input" to load a problem from input.</div>
        <div class={(solverReady || solver.isSolvingFinished()) ? "" : "hidden"}>Decision Count: <b>{basicStats.decisions}</b></div>
        <div class={(solverReady || solver.isSolvingFinished()) ? "" : "hidden"}>Step Count: <b>{basicStats.steps}</b></div>
        <div class={(solverReady || solver.isSolvingFinished()) ? "" : "hidden"}>Backtrack Count: <b>{basicStats.backtracks}</b></div>
        <div class={(solverReady || solver.isSolvingFinished()) ? "" : "hidden"}>Remaining Clause Count: <b>{moreStats.remainingClauses}</b></div>
        <div class={(solverReady || solver.isSolvingFinished()) ? "" : "hidden"}>Remaining Variable Count: <b>{moreStats.remainingVariables}</b></div>
        <div class={((solverReady || solver.isSolvingFinished()) && solverSelection == "dpll") ? "" : "hidden"}>Pure Literal Elimination Count: <b>{moreStats.pureLiterals}</b></div>
        <div class={((solverReady || solver.isSolvingFinished()) && solverSelection == "dpll") ? "" : "hidden"}>Unit Propagation Count: <b>{moreStats.unitPropagations}</b></div>
      </div>
    </div>
  </div>
</main>
<footer>&COPY; 2025</footer>

<style>
  footer {
    color: #888;
    text-align: center;
  }
  textarea {
    font-size: large;
    resize: none;
    overflow-y: scroll;
  }
  main {
    display: grid;
    grid-template-columns: 3fr 2fr;
    flex: 1 1 auto;
    max-height: 96vh;
    min-height: inherit;
    height: 96vh;
  }
  #dimacs-input {
    width: 100%;
    box-sizing: border-box;
    height: 25vh;
    margin: 0 auto;
    border: 2px solid black;
  }
  #notation {
    width: 100%;
    border: 2px solid black;
    overflow: auto;
    height: 25vh;
    box-sizing: border-box;
    margin: 0 auto;
    padding: 0.25em;
  }
  #right-top {
    display: grid;
    grid-template-columns: 3fr 1fr;
  }
  #right-boxes {
    display: grid;
    grid-template-rows: 8fr 7fr;
    max-height: inherit;
  }
  #left-boxes {
    display: grid;
    grid-template-rows: 1fr 4fr 8fr;
    max-height: inherit;
  }
  .flex-container {
      display: flex;
      flex-flow: column;
      padding-left: 0.2em;
      padding-right: 0.2em;
  }
  #left-top {
    display: grid;
    grid-template-columns: 2fr 6fr;
    box-sizing: border-box;
  }
  #left-mid {
    display: grid;
    grid-template-columns: 3fr 5fr;
    box-sizing: border-box;
  }
  #left-bot {
    display: grid;
    grid-template-columns: 1fr 1fr;
    box-sizing: border-box;
  }
  #file-upload input {
    width: 0em;
    height: 0em;
  }
  #solverlog {
    max-height: 30vh;
    min-height: 30vh;
    display: flex;
  }
  #solver-info {
    display: grid;
    border: 2px solid black;
    padding: 0.1em;
    flex: 1 1 auto;
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

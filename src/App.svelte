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
      <div id="file-upload" class="tooltip left-top-containers">
        <span class="tooltiptext" style="top: 4em; left: 18em;">Load a SAT problem file in DIMACS format from your local computer. Note this only makes the file contents available in your browser, it does not upload anything to a remote server.</span>
        <label for="dimacs-file">Load DIMACS from file</label>
        <input type="file" accept="text/*,.cnf" bind:files={dimacsFile} id="dimacs-file" name="dimacs">
      </div>
      <div class="left-top-containers">
        <h3 class="tooltip">Example SAT problems:<span class="tooltiptext" style="top: 13em; left: 4em;">Load an example SAT problem from a prepopulated list. For larger problems the original source is detailed in the comments section.</span></h3>
        <Examples bind:selection={exampleProblem}/>
      </div>
    </div>
    <div id="left-mid">
      <div class="flex-container">
        <h3 class="tooltip">DIMACS CNF Input:<span class="tooltiptext" style="top: 13em; left: 4em;">Contains the currently SAT problem in DIMACS format. You can write, edit, or paste in a problem from the clipboard. Any changes made here only take effect after "Parse Input" has been pressed.</span></h3>
        <textarea id="dimacs-input" bind:value={dimacsInput}/>
      </div>
      <div class="flex-container">
        <h3 class="tooltip">SAT instance in mathematical notation:<span class="tooltiptext" style="top: 13em; left: 45em;">Shows the current problem in standard mathematical format. Variables are coloured green for a true assignment, red for false. Clauses which evaluate to true are highlighted in green, and those evaluating to false in red.</span></h3>
        <div id="notation">
          <Notation clauses={clauses} assignments={variableAssignments}/>
        </div>
      </div>
    </div>
    <div id="left-bot">
      <div class="flex-container">
        <h4 class="tooltip">Variable Interaction Graph<span class="tooltiptext" style="top: 55vh; left: 7.5vw;">This shows the relationships between variables across all clauses of the problem. Each variable is represented as a node, with edges drawn between variables that share the same clause.</span></h4>
        <VariableInteractionGraph elements={variableInteractionElements}/>
      </div>
      <div class="flex-container">
        <h4 class="tooltip">Search Graph<span class="tooltiptext" style="top: 55vh; left: 37.5vw;">This shows the sequence of variable assignments in a tree like format, beginning from a root node and branching downwards as variables are assigned. Red nodes represent conflicts, with a single green node indicating where satisfiability was achieved. Assignments made by unit propagation use a cyan outline, and pure literal elimination is indicated by a green outline.</span></h4>
        <SearchGraph elements={searchGraphElements}/>
      </div>
    </div>
  </div>
  <!-- Right Hand Side -->
  <div id="right-boxes">
    <div class="flex-container">
      <div id="right-top">
        <h2 class="tooltip">SAT solving log<span class="tooltiptext" style="top: 18vh; left: 70vw;">Each line in this log represents a single step of the currently selected solver algorithm. For more detail on what these steps mean, please see the user manual.</span></h2>
        <div style="text-align: right;"><a href="manual.pdf" target="_blank" rel="noreferrer">User instruction manual</a></div>
      </div>
      <div id="solverlog">
        <SolverLog bind:events/>
      </div>
      <div>
        <div class="tooltip" style="display: inline;">
          <select id="solver-selection" bind:value={solverSelection}>
            <option value="backtracking">Backtracking</option>
            <option value="dpll" selected>DPLL</option>
          </select>
          <span class="tooltiptext" style="top: 38vh; left: 65vw;">The solver algorithm to use. Either a simple backtracking algorithm, or the Davis-Putnam-Logemann-Loveland algorithm.</span>
        </div>
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
  .left-top-containers {
    display: flex;
    justify-content: center;
    align-items: center;
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
    max-height: 40vh;
    min-height: 40vh;
    margin-bottom: 0.2em;
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
  .tooltiptext {
    visibility: hidden;
    position: absolute;
    z-index: 1;
    max-width: 25em;
    max-height: 15em;
    background-color: lightblue;
    border-color: cadetblue;
    border-style: solid;
    border-width: 0.2em;
    color: black;
    text-align: center;
    border-radius: 0.5em;
    font-size: small;
    font-weight: normal;
  }
  .tooltip:hover .tooltiptext {
    visibility: visible;
  }
</style>

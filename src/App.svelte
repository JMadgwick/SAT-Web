<script lang="ts">
  import Counter from './lib/Counter.svelte'
  import Notation from './lib/Notation.svelte'
  import SearchGraph from './lib/SearchGraph.svelte'
  import VariableInteractionGraph from './lib/VariableInteractionGraph.svelte'
  import SATLog from './lib/log'
  import eventsToSearchElements from './lib/searchGraph'
  import clausesToInteractionElements from './lib/variableInteractionGraph'
  import cytoscape from 'cytoscape'
  import {solver as basicSolver} from './lib/solver' // use export default to remove need for {}
  let solver = new basicSolver("")
  let solverEventLog = "" // Output log for solver, reassignments automatically trigger UI updates
  let clauses:number[][] = [] // For storing clauses, reassignments automatically trigger UI updates
  let variableAssignments:Map<number, boolean> // For storing variable assignments
  let test = "" //placehodler testing search tree
  let searchGraphElements:cytoscape.ElementDefinition[] // Search Graph Cytoscape elements
  let variableInteractionElements:[Boolean, cytoscape.ElementDefinition[]] // Variable Interaction Graph Cytoscape elements
  let dimacs_input = // DIMACS input from UI (automatically updated when text input changes)
  `c simple_v3_c2.cnf
p cnf 3 2
-1 -3 0
2 3 -1 0
3 -1 0`//ex5 is good, NQueens10quad ok, NQueens15 times out
  function parseDIMACS(){
    solver = new basicSolver(dimacs_input)
    solver.parse()
    clauses = solver.clauses
    variableAssignments = solver.getAssignments()
    variableInteractionElements = [true, clausesToInteractionElements(solver.clauses)]
  }

  function solveStep(){
    if (!solver.isSolvingFinished()) {
      let events = solver.solveStep()
      solverEventLog = SATLog(events)
      searchGraphElements = eventsToSearchElements(events)
      clauses = solver.clauses
      variableAssignments = solver.getAssignments()
      variableInteractionElements = [false, clausesToInteractionElements(solver.processedClauses)]
    }
  }

  function solveAll(){
    let startTime = Date.now()
    while (!solver.isSolvingFinished()) {
      solver.solveStep()
    }
    let events = solver.getEvents()
    solverEventLog = SATLog(events)
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
      <div style="border: 5px solid red;">
        <div id="left-top">
          <div style="border: 2px solid yellow;align-items: center;display: flex;justify-content: center"><Counter /></div>
          <div style="border: 2px solid blue;text-align: center;"><h3>Example SAT problems: TBC</h3></div>
        </div>
      </div>
      <div id="left-mid">
        <div style="border: 2px solid yellow;"><h3>DIMACS CNF Input:</h3><textarea style="width: 95%;height: 65%;" bind:value={dimacs_input}></textarea></div>
        <div style="border: 2px solid blue;">
          <h3>SAT instance in mathematical notation:</h3>
          <div style="width: 95%;height: auto;border: 2px solid black;overflow:auto;max-height:15em">
            <!-- <textarea class="output-box" readonly value="{not}" /> -->
            <!-- <button>dropdown with options for original / current (all eliminations removed) / both</button> -->
            <Notation clauses={clauses} assignments={variableAssignments}></Notation>
          </div>
        </div>
      </div>
      <div id="left-bot">
        <VariableInteractionGraph elements={variableInteractionElements}></VariableInteractionGraph>
        <SearchGraph elements={searchGraphElements}></SearchGraph>
      </div>
    </div>
    <!-- Right Hand Side -->
    <div class="right-boxes">
      <div id="right-top">
        <div><h2>SAT solving log</h2></div>
        <div style="text-align: right;"><a href="https://example.com" target="_blank" rel="noreferrer">User instruction manual</a></div>
      </div>
      <div class="output-box-container" style="background-color: aqua;">
        <textarea class="output-box" id="sat-log" readonly value="{solverEventLog}" />                    
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
</style>

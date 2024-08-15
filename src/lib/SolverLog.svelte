<script lang="ts">
  import {afterUpdate} from 'svelte'
  import {type eventType} from "./DPLLsolver"
  export let events: eventType[]
  let logContainerElement:HTMLDivElement

  // After updating the component, scroll the logs to the bottom
  afterUpdate(() => logContainerElement.scroll({ top: logContainerElement.scrollHeight, behavior: 'smooth' }))

  function formatEvent(event:eventType): string {
    switch (event.type) {
      case "SAT":
        return "Solved (Satisfiable)"
      case "UNSAT":
        return "Could not solve (Unsatisfiable)"
      default:
        return ""
    }
  }
  function clearUndefined(map:Map<number,boolean> | undefined){
    return map!
  }
  function getLiteralColor(literal:number | boolean | undefined):string {
    if (typeof literal == 'boolean') {
      return (literal) ? "green" : "red"
    }
    if (literal != undefined && literal > 0)
      return "green"
    else
      return "red"
  }
  function getLiteralAbs(literal:number | undefined):number{
    return Math.abs(literal!)
  }
</script>

<div id="log-container" bind:this={logContainerElement}>
  {#each events as event}
    {#if event.type == "assign"}
      <span class="assign">Assigning <span style="color: {getLiteralColor(event.val)};">{event.val}</span> to <i>x{event.var}</i>{"\n"}</span>
    {:else if event.type == "unitprop"}
    <span class="dpll">Unit propagation assignments: {#each clearUndefined(event.vvmap).entries() as [literal, assignment]}
      <span style="color: {(assignment) ? "green" : "red"};"><i>x{literal}</i> </span>{/each}{"\n"}</span>
    {:else if event.type == "purelit"}
    <span class="dpll">Eliminating pure literals: {#each clearUndefined(event.vvmap).entries() as [literal, assignment]}
      <span style="color: {(assignment) ? "green" : "red"};"><i>x{literal}</i> </span>{/each}{"\n"}</span>
    {:else if event.type == "failure"}
    <span class="failure">Conflict.</span> Caused by assigning {event.var}{"\n"}
    {:else if event.type == "unitpropfailure"}
    <span class="failure">Conflict during unit propagation.</span> Caused by assignment of <span style="color: {getLiteralColor(event.var)};">{getLiteralColor(event.var) == 'green'}</span> to {getLiteralAbs(event.var)}.{"\n"}
    {:else if event.type == "unitpropfailureboth"}
    <span class="failure">Conflict during unit propagation.</span> Caused by unit literals of both <i>x{getLiteralAbs(event.var)}</i> and &not;<i>x{getLiteralAbs(event.var)}</i>.{"\n"}
    {:else if event.type == "backtrack"}
    <span class="backtrack">Backtracking{(event.var == 1) ? "" : ` (${event.var} times)`}.</span>{"\n"}
    {:else}
      <span class="{event.type}">{formatEvent(event)}</span>
    {/if}
  {/each}
</div>

<style>
  #log-container {
    white-space: pre-line;
    font-weight: bold;
    overflow: scroll;
    width: 100%;
    border: 2px solid black;
    margin: 0.5em;
    padding: 0.25em;
    color: navy;
  }
  .failure {
    color: rgb(226, 0, 0);
  }
  .backtrack {
    color: orange;
  }
  .SAT {
    color: green;
    text-decoration: underline;
  }
  .UNSAT {
    color: red;
    text-decoration: underline;
  }
</style>
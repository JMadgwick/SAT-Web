<svelte:options namespace="mathml"/>
<script lang="ts">
  import {afterUpdate} from 'svelte'
  import {type eventType} from "./solver"
  export let events: eventType[]
  let logContainerElement:HTMLDivElement

  // After updating the component, scroll the logs to the bottom
  afterUpdate(() => logContainerElement.scroll({ top: logContainerElement.scrollHeight, behavior: 'smooth' }))

  function formatEvent(event:eventType): string {
    switch (event.type) {
      case "failure":
        return "Conflict\n"
      case "backtrack":
        return "Backtracking\n"
      case "SAT":
        return "Solved (Satisfiable)"
      case "UNSAT":
        return "Could not solve (Unsatisfiable)"
      default:
        return ""
    }
  }
</script>

<div id="log-container" bind:this={logContainerElement}>
  {#each events as event}
    {#if event.type == "assign"}
      <span class="{event.type}">Assigning <span style="color: {(event.val) ? "green" : "red"};">{event.val}</span> to <math><msub><mi>x</mi><mn>{event.var}</mn></msub></math>{"\n"}</span>
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
  }
  .assign {
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
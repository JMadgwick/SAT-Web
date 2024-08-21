<svelte:options namespace="mathml"/> <!-- Workaround to fix MathML support. See: https://github.com/sveltejs/svelte/issues/6582 -->
<script lang="ts">
  export let clauses: number[][]
  export let assignments:Map<number, boolean>
  function getClauseStyle(clause:number[]){
    let unsetCount = 0
    for (let literal of clause) {
      switch (getLiteralStyle(literal)) {
        case "true-literal":
          return "true-clause"
        case "unset-literal":
          unsetCount++
      }
    }
    return (unsetCount != 0) ? "unset-clause" : "false-clause"
  }
  function getLiteralStyle(literal:number){
    let assignment = assignments.get(Math.abs(literal))
    if (assignment == undefined) {
      return "unset-literal"
    } else if ((assignment && literal > 0) || (!assignment && literal < 0)) {
      return "true-literal"
    } else {
      return "false-literal"
    }
  }
</script>

<math display="block">
  {#each clauses as clause, i}
  <mrow class={getClauseStyle(clause)}>
    <mo fence=true largeop=true>(</mo>
    {#each clause as literal, j}
    <mrow class={getLiteralStyle(literal)}>
      <msub>
        <mi>{literal > 0 ? "\u{1D465}" : "\u{00AC}\u{1D465}"}</mi>
        <mn>{Math.abs(literal)}</mn>
      </msub>
    </mrow>
    {#if j != clause.length-1}
    <mo>&or;</mo>
    {/if}
    {/each}
    <mo fence=true largeop=true>)</mo>
  </mrow>
  {#if i != clauses.length-1}
  <mo>&and;</mo>
  {/if}
  {/each}
</math>

<style>
  .true-clause {
    background-color: lightgreen;
  }
  .false-clause {
    background-color: lightsalmon;
  }
  .true-literal {
    color: darkgreen;
  }
  .false-literal {
    color: red;
  }
  math {
    color: black;
    /* ruby is a workaround as Chrome will otherwise not wrap */
    display: ruby;
  }
</style>
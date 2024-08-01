<svelte:options namespace="mathml"/> <!-- Workaround to fix MathML support. See: https://github.com/sveltejs/svelte/issues/6582 -->
<script lang="ts">
  //place notation.ts file into here potentially
  export let htmText = ""
</script>

<!-- lightgreen background for resolved clauses, darkgreen for resolved literal, red for false literal, false clause not currently shown? -->

<math display="block">
  {@html htmText}
  <!-- <mphantom>
    <mo>&and;</mo>
    <mrow class="true-clause">
      <mo fence=true largeop=true>(</mo>
      <mrow class="true-literal">
        <mo>&not;</mo>
        <msub>
          <mi>x</mi>
          <mn>1</mn>
        </msub>
      </mrow>
      <mo>&or;</mo>
      <mrow class="false-literal">
        <msub>
          <mi>x</mi>
          <mn>4</mn>
        </msub>
      </mrow>
      <mo fence=true largeop=true>)</mo>
    </mrow>
  </mphantom> -->
</math>

<!-- Non standard https://developer.mozilla.org/en-US/docs/Web/MathML/Element/menclose -->
<style>
  .true-clause {
    background-color: lightgreen;
    /* color: rebeccapurple; */
  }
  .true-literal {
    color: darkgreen;
  }
  .false-literal {
    color: red;
  }
  math {
    color: black;
    padding: 0.25em;
  }
</style>
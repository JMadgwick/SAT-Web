<script lang="ts">
  import Counter from './lib/Counter.svelte'
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
      <div style="border: 5px solid green;">
        <div id="left-mid">
          <div style="border: 2px solid yellow;"><h3>DIMACS CNF Input:</h3><textarea style="width: 95%;height: 65%;"></textarea></div>
          <div style="border: 2px solid blue;"><h3>SAT instance in mathematical notation:</h3><div style="width: 95%;height: 65%;border: 2px solid black;"></div></div>
        </div>
      </div>
      <div style="border: 5px solid blue;"></div>
    </div>
    <!-- Right Hand Side -->
    <div>
      <div class="right-boxes">
        <div id="right-top">
          <div><h2>SAT solving log</h2></div>
          <div style="text-align: right;"><a href="https://example.com" target="_blank" rel="noreferrer">User instruction manual</a></div>
        </div>
        <div class="output-box-container" style="background-color: aqua;">
          <textarea class="output-box" id="sat-log" readonly value="tbc" />                    
        </div>
        <div>
          <Counter /><Counter />
          <h3>Learnt Clauses</h3>
        </div>
        <div class="output-box-container" style="background-color: red;">
          <textarea class="output-box" id="learnt-clauses" readonly value="tbc" />
        </div>
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
</style>

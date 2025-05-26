<script lang="ts">
  let dialog:HTMLDialogElement
  let initialText:string
  let assignments:Map<number,boolean|undefined>
  export function setValues(text:string, values:Map<number,boolean|undefined>){
    initialText = text
    assignments = values
  }
  export function openBox(){
    dialog.showModal()
  }
  function closeBox(){
    dialog.close()
  }
</script>

<dialog bind:this={dialog} id="favDialog">
  <div class="dialog-inner">
    <span>{initialText}</span>
    <span id="assignments">
      {#if assignments != undefined}
      {#each assignments.entries() as [variable, assignment]}
      {#if assignment != undefined}
      <span style="color: {(assignment) ? "green" : "red"};"><i>x{variable}</i> </span>
      {/if}
      {/each}
      {/if}
    </span>
    <button on:click={closeBox}>Close</button>
  </div>
</dialog>

<style>
  dialog {
    border: 2px solid black;
    padding: 0.2em;
    border-radius: 15px;
  }
  .dialog-inner {
    color: navy;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: auto;
    max-width: 50em;
    padding: 0.5em;
  }
  dialog::backdrop {
    background: black;
    opacity: 0.5;
  }
  #assignments {
    font-weight: bold;
    text-align: center;
    margin-bottom: 0.8em;
  }
  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.5em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: skyblue;
    cursor: pointer;
    transition: border-color 0.25s;
  }
  button:hover {
    border-color: #646cff;
  }
</style>
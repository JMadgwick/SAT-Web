<script lang="ts">
    import cytoscape from 'cytoscape'
    import dagre from 'cytoscape-dagre'
    cytoscape.use( dagre );
    let cy: cytoscape.Core

    export let elements:cytoscape.ElementDefinition[]

    // Add an option to shown text with a button in the UI
    function updateGraph(elements:cytoscape.ElementDefinition[]){
        cy = cytoscape({
            container: document.getElementById('cy'), // container to render in

            elements: elements,

            style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                // 'label': 'data(lab)',
                'text-valign': 'center'
                }
            },

            {
                selector: '.var',
                style: {
                'background-opacity': 0,
                'border-color': 'black',
                'border-width': 1,
                'label': 'data(lab)'
                }
            },

            {
                selector: '.fail',
                style: {
                'background-color': 'red'
                }
            },

            {
                selector: '.solved',
                style: {
                'background-color': 'green'
                }
            },

            {
                selector: 'edge',
                style: {
                // 'label': 'data(lab)',
                'width': 3,
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
                }
            },

            {
                selector: '.true',
                style: {
                'line-color': 'green',
                'target-arrow-color': 'green'
                }
            },

            {
                selector: '.false',
                style: {
                'line-color': 'red',
                'target-arrow-color': 'red'
                }
            }
            ],

            layout: {
            name: 'dagre'
            }
        })
    }

    // This is called only after DOM for the cytoscape element has been created
    // Cytoscape will otherwise be unable to find the element to use as it will not exist yet
    function onDOMUpdate(node: HTMLElement, elements:cytoscape.ElementDefinition[]) {
        // Called when the node has been mounted in the DOM
        updateGraph(elements)

		return {
            // Called when the value has changed
			update(elements:cytoscape.ElementDefinition[]) {
				updateGraph(elements)
			},

			destroy() {
				// Called when the node has been removed from the DOM
			}
		};
    }
</script>

<div use:onDOMUpdate={elements} id="cy"></div>

<style>
    #cy {
        /* Putting 100% causes the size to expand and fill everything */
        width: 45em;
        height: 35em;
        margin: 0.5em;
        border: 3px solid black;
    }
</style>
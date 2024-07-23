<script lang="ts">
    import cytoscape from 'cytoscape'
    let cy: cytoscape.Core

    // let testData = [{"data":{"id":"100","lab":"1"}},{"data":{"source":"100","target":"101","lab":"true"}},{"data":{"id":"101","lab":"2"}},{"data":{"source":"101","target":"102","lab":"true"}},{"data":{"id":"102","lab":"fail"}},{"data":{"source":"101","target":"104","lab":"false"}},{"data":{"id":"104","lab":"fail"}},{"data":{"source":"100","target":"106","lab":"false"}},{"data":{"id":"106","lab":"solved"}}]
    export let elements:cytoscape.ElementDefinition[]

    function setBgColor(ele:cytoscape.NodeSingular):string {
        switch (ele.data('lab')) {
            case "solved":
                return 'green'
            case "fail":
                return 'red'
            default:
                return '#666'
        }
    }
    function updateGraph(elements:cytoscape.ElementDefinition[]){
        cy = cytoscape({
            container: document.getElementById('cy'), // container to render in

            elements: elements,

            style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                'background-color': setBgColor,
                'label': 'data(lab)'
                }
            },

            {
                selector: 'edge',
                style: {
                'label': 'data(lab)',
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
                }
            }
            ],

            layout: {
            name: 'grid',
            rows: 3
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
        width: 35em;
        height: 20em;
        margin: 0.5em;
        border: 3px solid black;
    }
</style>
<script lang="ts">
    import cytoscape from 'cytoscape'
    let cy: cytoscape.Core
    let initialNodes: cytoscape.NodeCollection

    export let elements:[Boolean, cytoscape.ElementDefinition[]]

    function renderGraph(elements:cytoscape.ElementDefinition[]){
        let forceDirectedLayout = {
            name: 'cose',
            idealEdgeLength: 200,
            nodeOverlap: 20,
            nodeRepulsion: 800000,
            edgeElasticity: 100,
            gravity: 80,
            refresh: 60,
            numIter: 800
        }
        cy = cytoscape({
            container: document.getElementById('cy-vig'),
            elements: elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'text-valign': 'center',
                        'background-color': 'white',
                        'border-color': 'black',
                        'border-width': 2,
                        'label': 'data(id)',
                        'shape': 'rectangle'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'line-color': 'darkblue',
                        'width': 3,
                        'curve-style': 'haystack',
                        'haystack-radius': 0.5
                    }
                }
            ],
            layout: forceDirectedLayout
        })
    }

    // This is called only after DOM for the cytoscape element has been created
    // Cytoscape will otherwise be unable to find the element to use as it will not exist yet
    function onDOMUpdate(node: HTMLElement, updatedElements:[Boolean, cytoscape.ElementDefinition[]]) {
		return {
            // Called when the value has changed
			update(updatedElements:[Boolean, cytoscape.ElementDefinition[]]) {
                if (updatedElements[0]) {
                    renderGraph(updatedElements[1])
                    initialNodes = cy.nodes()
                } else {
                    processElementChanges(updatedElements[1])
                }
			},
			destroy() {
				// Called when the node has been removed from the DOM
			}
		};
    }

    function processElementChanges(updatedElements: cytoscape.ElementDefinition[]) {
        let nodesToKeep:string[] = []
        let edgesToAdd: cytoscape.ElementDefinition[] = []
        for (let element of updatedElements) {
            let id = element.data.id
            if (id != undefined) {
                nodesToKeep.push(id)
            } else {
                edgesToAdd.push(element)
            }
        }
        cy.elements().remove()
        nodesToKeep.forEach(val => initialNodes.getElementById(val).restore())
        cy.add(edgesToAdd)
    }
</script>

<div use:onDOMUpdate={elements} id="cy-vig"></div>

<style>
    #cy-vig {
        min-width: 90%;
        min-height: 90%;
        flex-grow: 1;
        margin: 0.25em 0.25em 0em 0em;
        border: 2px solid black;
    }
</style>
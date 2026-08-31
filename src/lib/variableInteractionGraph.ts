import cytoscape from 'cytoscape'

/**
 * Convert a set of clauses into Cytoscape elements for the variable interaction graph.
 *
 * Creates a node for each variable and an edge between any two variables that
 * appear together in a clause, giving a visual of which variables interact.
 * @param clauses The clauses as arrays of literals.
 * @returns The Cytoscape element definitions (nodes and edges) for the interaction graph.
 */
export default function process(clauses: number[][]){
    // Get a list of all variables (ie without sign)
    let uniqueVariables: number[] = []
    for (let clause of clauses) {
        for (let literal of clause) {
            let variable = Math.abs(literal)
            if (!uniqueVariables.includes(variable)) {
                uniqueVariables.push(variable)
            }
        }
    }
    uniqueVariables.sort()

    // Create a node for each variable
    let nodes: cytoscape.ElementDefinition[] = []
    let edges: Set<string> = new Set
    for (let variable of uniqueVariables) {
        nodes.push({ data: { id: `${variable}` } })
    }
    // For each variable, loop through all clauses looking for it and create links to all others in that clause.
    for (let variable of uniqueVariables) {
        for (let clause of clauses) {
            if (clause.includes(variable) || clause.includes(0-variable)) {
                let newClause = clause.filter((clit) => ((clit != 0-variable) && (clit != variable)))
                for (let literal of newClause) {
                    let clauseVariable = Math.abs(literal)
                    // Only use lower number as source to avoid making duplicate edges
                    if (variable > clauseVariable) {
                        edges.add(`${clauseVariable}-${variable}`)
                    } else {
                        edges.add(`${variable}-${clauseVariable}`)
                    }
                    
                }
            }
        }
    }
    let finalEdges:cytoscape.ElementDefinition[] = []
    edges.forEach(edge => {
        let a = edge.match(new RegExp('(\\d+)-(\\d+)'))
        finalEdges.push({ data: { source: a![1], target: a![2]} })
    })

    return nodes.concat(finalEdges)
}
var node = {
    data: { id: 'a-1', lab: 'a' }
}
var edge = {
    data: { lab: 'ab', source: 'a', target: 'b' }
}
// We want to create an array of the above objects using decisions data
// The decisions data can be a step by step result returned by the solver, like the log text
// When processing decsions data into graph, we need to keep track of search varibles in order of assignment to allow stepping back
// Could also process this data into current assignments and use it for varible interaction graph - to save needing to also extract clauses from the solver

// Result "events"
var events2 = [
    {
        type: "assign",
        var: 1,
        val: true
    },
    {
        type: "assign",
        var: 2,
        val: true
    },
    {
        type: "failure"
    },
    {
        type: "assign",
        var: 2,
        val: false
    },
    {
        type: "failure"
    },
    {
        type: "backtrack"
    },
    {
        type: "assign",
        var: 1,
        val: false
    },
    {
        type: "solved"
    }
]

import {type eventType} from "./solver"
import cytoscape from 'cytoscape'
// export type elementType = {data: {id?:string,lab:string,source?:string,target?:string}}

export function process(events: eventType[]):cytoscape.ElementDefinition[] {
    let assignmentTree: string[] = []
    let count = 100 //Used as a unique id for nodes
    let elements:cytoscape.ElementDefinition[] = []
    for (let event of events) {
        if (count == 100) { //Root node
            elements.push({ data: { id: `${count}`, lab: `${event.var}` } })
            elements.push({ data: { source: `${count}`, target: `${count+1}`, lab: `${event.val}` } })//link
            assignmentTree.push(`${count}`)
            count++
        } else {
            switch (event.type) {
                case "assign":
                    if (event.val) {//true
                        elements.push({ data: { id: `${count}`, lab: `${event.var}` } })
                        elements.push({ data: { source: `${count}`, target: `${count+1}`, lab: `${event.val}`} })//link
                        assignmentTree.push(`${count}`)
                        count++
                    } else {//false
                        elements.push({ data: { source: assignmentTree.at(-1), target: `${count+1}`, lab: `${event.val}` } })//link
                        // assignmentTree.push(`${count}`)
                        count++
                    }
                    break;

                case "failure":
                    elements.push({ data: { id: `${count}`, lab: "fail" } })
                    // assignmentTree.push(count)
                    count++
                    break;

                case "backtrack":
                    assignmentTree.pop()
                    break;

                case "solved":
                    elements.push({ data: { id: `${count}`, lab: "solved" } })
                    // assignmentTree.push(count)
                    // count++
                    break;

                default:
                    break;
            }
        }
    }
    //In case of incomplete search, put a TBD node at the end to avoid dangling edge
    if ((elements.at(-1)?.data.lab != "solved") && (elements.at(-1)?.data.lab != "fail")){
        elements.push({ data: { id: `${count}`, lab: "TBD" } })
    }
    return elements
}
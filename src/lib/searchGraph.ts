import {type eventType} from "./solver"
import cytoscape from 'cytoscape'

export default function process(events: eventType[]):cytoscape.ElementDefinition[] {
    let assignmentTree: string[] = []
    let count = 100 //Used as a unique id for nodes
    let elements:cytoscape.ElementDefinition[] = []
    for (let event of events) {
        if (count == 100) { //Root node
            elements.push({ data: { id: `${count}`, lab: `${event.var}` }, classes: 'var' })
            elements.push({ data: { source: `${count}`, target: `${count+1}`, lab: `${event.val}` }, classes: 'true' })//link
            assignmentTree.push(`${count}`)
            count++
        } else {
            switch (event.type) {
                case "assign":
                    if (event.val) {//true
                        elements.push({ data: { id: `${count}`, lab: `${event.var}` }, classes: 'var' })
                        elements.push({ data: { source: `${count}`, target: `${count+1}`, lab: `${event.val}`}, classes: 'true' })//link
                        assignmentTree.push(`${count}`)
                        count++
                    } else {//false
                        elements.push({ data: { source: assignmentTree.at(-1), target: `${count+1}`, lab: `${event.val}` }, classes: 'false' })//link
                        count++
                    }
                    break;

                case "failure":
                    elements.push({ data: { id: `${count}`, lab: 'fail' }, classes: 'fail' })
                    count++
                    break;

                case "backtrack":
                    assignmentTree.pop()
                    break;

                case "SAT":
                    elements.push({ data: { id: `${count}`, lab: 'solved' }, classes: 'solved' })
                    break;

                default:
                    break;
            }
        }
    }
    //In case of incomplete search, put a TBD node at the end to avoid dangling edge
    if ((elements.at(-1)?.data.lab != "solved") && (elements.at(-1)?.data.lab != "fail")){
        elements.push({ data: { id: `${count}`, lab: "?" }, classes: 'var' })
    }
    return elements
}
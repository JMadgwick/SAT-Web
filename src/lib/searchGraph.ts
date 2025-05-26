import {type eventType} from "./solver"
import cytoscape from 'cytoscape'

export default function process(events: eventType[]):cytoscape.ElementDefinition[] {
    let assignmentTree: string[] = [] // History of assignments used to track node id for backtracking
    let count = 100 // Provides a unique id for nodes
    let elements:cytoscape.ElementDefinition[] = []
    for (let event of events) {
        switch (event.type) {
            case "assign":
                if (event.val) { // Successful assignment
                    elements.push({ data: { id: `${count}`, lab: `${event.var}` }, classes: 'var' })
                    elements.push({ data: { source: `${count}`, target: `${count+1}`, lab: `${event.val}` }, classes: 'true' })
                    assignmentTree.push(`${count}`)
                    count++
                } else { // Failed assignment (conflict)
                    elements.push({ data: { source: assignmentTree.at(-1), target: `${count+1}`, lab: `${event.val}` }, classes: 'false' })
                    count++
                }
                break;

            case "purelitfailure":
            case "unitpropfailure":
            case "unitpropfailureboth":
            case "failure":
                elements.push({ data: { id: `${count}`, lab: 'fail' }, classes: 'fail' })
                count++
                break;

            case "backtrack":
                for (let i = 0; i < event.var!; i++)
                    assignmentTree.pop()   
                break;

            case "SAT":
                elements.push({ data: { id: `${count}`, lab: 'solved' }, classes: 'solved' })
                break;
            
            case "unitprop":
                elements.push({ data: { id: `${count}`, lab: processVariableAssignmentMap(event.vvmap!) }, classes: ['dpll','unitprop'] })
                elements.push({ data: { source: `${count}`, target: `${count+1}` }, classes: 'dpll' })
                count++
                break

            case "purelit":
                elements.push({ data: { id: `${count}`, lab: processVariableAssignmentMap(event.vvmap!) }, classes: ['dpll','purelit'] })
                elements.push({ data: { source: `${count}`, target: `${count+1}` }, classes: 'dpll' })
                count++
                break

            default:
                break;
        }
    }
    // In case of incomplete search, put a TBD node at the end to avoid dangling edge
    if ((elements.at(-1)?.data.lab != "solved") && (elements.at(-1)?.data.lab != "fail")){
        elements.push({ data: { id: `${count}`, lab: "?" }, classes: 'var' })
    }
    return elements
}

function processVariableAssignmentMap(unitVariableAssignments:Map<number,boolean>):string {
    let eventText = ""
    for (const [literal, assignment] of unitVariableAssignments.entries()) {
        eventText = eventText + `${assignment ? "" : "\u{00AC}"}\u{1D639}${toSubscript(literal)}, `
    }
    return eventText.slice(0,-2)
}

function toSubscript(numberToConvert:number){
    let newText = ""
    for (let char of numberToConvert.toString()){
        switch (char) {
            case "0":
                newText = newText + "\u2080"
                break;
            case "1":
                newText = newText + "\u2081"
                break;
            case "2":
                newText = newText + "\u2082"
                break;
            case "3":
                newText = newText + "\u2083"
                break;
            case "4":
                newText = newText + "\u2084"
                break;
            case "5":
                newText = newText + "\u2085"
                break;
            case "6":
                newText = newText + "\u2086"
                break;
            case "7":
                newText = newText + "\u2087"
                break;
            case "8":
                newText = newText + "\u2088"
                break;
            case "9":
                newText = newText + "\u2089"
                break;
            default:
                break;
        }
    }
    return newText
}
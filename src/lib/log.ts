import {type eventType} from "./solver"
export default function eventsToLog(events: eventType[]): string {
    let log = ""
    for (let event of events){
        switch (event.type) {
            case "assign":
                log = log + `Assigning ${event.val} to ${event.var}.\n`
                break;

            case "failure":
                log = log + "Conflict.\n"
                break;

            case "backtrack":
                log = log + "Backtracking.\n"
                break;

            case "solved":
                log = log + "Solved."
                break;

            default:
                break;
        }
    }
    return log
}
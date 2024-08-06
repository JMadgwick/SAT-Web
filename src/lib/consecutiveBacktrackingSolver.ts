import {Solver, type eventType} from "./solver"
export class consecutiveBacktrackingSolver extends Solver {
    protected solveOneStep(){
        let nextProcessedClauses: number[][] = []
        let variable: number
        let lit: number
        let varBool: boolean

        let events:eventType[] = []

        if (!this.backtrack) {
            // Take next available variable
            variable = Math.abs(this.processedClauses[0][0])
            lit = variable
            varBool = true
        } else {
            let previousVariableA = this.variableAssignments.pop()//TODO ensure a check so that variable cannot be undefined, couldn't really happen
            if (previousVariableA![1] == false) { // If already backtracked then it will be false, in this case need to remove prior assignments until one can be tried with false
                for (let i = this.variableAssignments.length-1; i >= 0; i--) {
                    events.push({ type: "backtrack" })
                    if (this.variableAssignments[i][1] == true) { //use this
                        previousVariableA = this.variableAssignments[i]
                        break
                    } else {this.variableAssignments.pop()}//remove it
                }
                if (this.variableAssignments.length == 0) { // If variableAssignments is empty then we are at root node and cannot backtrack - can set failed flag and end
                    this.complete = true
                    events.push({ type: "UNSAT" })
                    return events
                } else { //then regenerate the processed clauses and continue
                    this.variableAssignments.pop()// remove the prior assignment
                    this.regenerateProcessedClauses()
                }
            }
            variable = previousVariableA![0]
            lit = 0-variable
            varBool = false
        }

        let negLit = 0-lit
        events.push({ type: "assign", var: variable, val: varBool })
        this.variableAssignments.push([variable, varBool])

        // Remove this literal from clauses
        for (let clause of this.processedClauses) {
            if (!clause.includes(lit)) { // If it doesn't include this literal (if it does then eliminated)
                let newClause = clause.filter((clit) => clit != negLit) // Remove negated version of the variable
                if (newClause.length == 0) { // Check if the clause is now empty
                    this.backtrack = true // Set flag to backtrack on next step
                    events.push({ type: "failure" })
                    return events
                }
                nextProcessedClauses.push(newClause) // Add to processed list
            }
        }
        this.backtrack = false //reset backtrack
        
        this.processedClauses = nextProcessedClauses
        if (this.processedClauses.length == 0) {
            this.complete = true
            events.push({ type: "SAT" })
            return events
        }
        return events
    }

    private regenerateProcessedClauses() {
        this.setup() // Reset existing clause list
        // Recreate using current assignments
        for (let variable of this.variableAssignments) {
            let nextProcessedClauses: number[][] = []
            let lit = (variable[1] == true) ? variable[0] : 0-variable[0]
            let negLit = 0-lit
            for (let clause of this.processedClauses) {
                if (!clause.includes(lit)) { // If it doesn't include this literal (if it does then eliminated)
                    let newClause = clause.filter((clit) => clit != negLit) // Remove negated version of the variable
                    if (newClause.length == 0) { // Check if the clause is now empty
                        //This shouldn't ever happen
                    }
                    nextProcessedClauses.push(newClause) // Add to processed list
                }
            }
            this.processedClauses = nextProcessedClauses
        }
    }
}
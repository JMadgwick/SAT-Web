import {Solver, type eventType} from "./solver"
export class sequentialBacktrackingSolver extends Solver {
    protected variables:Array<number> = new Array //could combine this with variableAssignments from the base class?
    protected currentVariablePosition = 0
    protected currentVariableAssignment = true
    protected processedClauseHistory: number[][][] = [] //Would this be better as an array of Sets of Maps?
    protected stepEvents:eventType[] = []

    private populateVariableList() {
        let uniqueVariables:Set<number> = new Set
        for (let clause of this.clauses) {
            for (let variable of clause) {
                uniqueVariables.add(Math.abs(variable))
            }
        }
        this.variables = Array.from(uniqueVariables).sort()
    }
    protected setup() {
        this.populateVariableList()
        this.processedClauseHistory.push(this.clauses)
    }

    public getClauses(){
        return this.processedClauseHistory[this.processedClauseHistory.length-1]
    }

    // Backtrack until a varible to try is found (return true) or no longer possible to backtrack (return false)
    protected applyBacktrack():boolean {
        this.currentVariableAssignment = false // Use false assignment instead
        // If it was false then further backtracking to a previous variable is required
        for (let backtrackedVariable = this.variableAssignments.pop(); this.variableAssignments.length > 0; backtrackedVariable = this.variableAssignments.pop()) {
            if (backtrackedVariable![1] == true) { // If a variable which has not yet been assigned to false is found
                return true // Stop searching
            }
            this.stepEvents.push({ type: "backtrack" }) // Add event to indicate backtracking up the search tree
            this.currentVariablePosition--
            this.processedClauseHistory.pop()
        }
        return false // VariableAssignments is now empty, therefore the root node has been reached and further backtracking is not possible
    }

    // Apply the new variable assignment, by removing all instances of the variable and its negated version and eliminating any clauses where this causes them to be satisifed
    protected applyAssign():boolean {
        let clausesAfterElimination: number[][] = []
        let variable = this.variables[this.currentVariablePosition]
        let literal = (this.currentVariableAssignment) ? variable : 0-variable
        let pureLiteral = 0-literal

        this.stepEvents.push({ type: "assign", var: variable, val: this.currentVariableAssignment })
        this.variableAssignments.push([variable, this.currentVariableAssignment])

        for (let clause of this.processedClauseHistory[this.processedClauseHistory.length-1]) {
            if (clause.includes(literal)) { // If the clause contains the assigned literal
                // Eliminate this clause (by omitting it from the new clause list)
            }
            else if (clause.includes(pureLiteral)) { // If the clause contains the negated version of this literal
                let filteredClause = clause.filter((clit) => clit != pureLiteral) // Remove negated literal from this clause
                if (filteredClause.length == 0) { // If this clause is now empty
                    this.backtrack = true // Next step needs to be backtracking
                    this.stepEvents.push({ type: "failure" })
                    return false
                }
                clausesAfterElimination.push(filteredClause)
            } else { // Else the given clause does not involve this variable
                clausesAfterElimination.push(clause)
            }
        }
        this.backtrack = false
        this.currentVariablePosition++
        this.processedClauseHistory.push(clausesAfterElimination)
        if (clausesAfterElimination.length == 0) { // If all clauses have been eliminated then SAT
            return true
        } else {
            return false
        }
        
    }
    protected solveOneStep(){
        this.stepEvents = []
        if (this.backtrack) {
            if (!this.applyBacktrack()) {
                this.complete = true
                this.stepEvents.push({ type: "UNSAT" })
                return this.stepEvents
            }
        } else {
            this.currentVariableAssignment = true
        }
        if (this.applyAssign()) {
            this.complete = true
            this.stepEvents.push({ type: "SAT" })
        }
        return this.stepEvents
    }
}
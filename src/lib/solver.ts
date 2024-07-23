//TODO If implementing more than one algorithm, then make this a parent class
export type eventType = {type:string,var?:number,val?:boolean}//|{type:string,var?:undefined,val?: undefined}
export class solver {
    private dimacs: string
    public clauses: number[][] = []
    private processedClauses: number[][] = []
    private variableAssignments: [number, boolean][] = []
    private backtrack = false
    private complete = false
    private events:eventType[] = []

    public constructor(dimacs: string) {
        this.dimacs = dimacs
    }

    public parse(): void {
        let p = this.dimacs.match(new RegExp('^p cnf (\\d+) (\\d+)$', 'm')) //TODO use this problem information?
        if (p == null) { // If problem line is missing
            alert("missing problem line"); //TODO proper error handling
        }
        let cnfInput = this.dimacs.replaceAll(new RegExp('^(p|c).*$', 'mg'), "").trim() // Remove any comment lines and trim remaining whitespace
        
        let clause: number[] = []
        let clauseList: number[][] = []

        if (!cnfInput.endsWith('0')) { // If final clause is not terminated with a zero
            console.log("CNF not terminated with 0");
            cnfInput = cnfInput + " 0" // Add whitespace and terminal zero
        }
        for (let i = 0, buffer = "", literal: number; i < cnfInput.length; i++){
            if (cnfInput[i].match(new RegExp('\\s'))) { // Whitespace signifies boundary between literals or clause terminating 0
                if (buffer != "") { // If buffer contains a literal
                    literal = Number(buffer) //TODO if this is zero then bad input of "00" or if NaN then other invalid input
                    // console.log(`Adding literal ${literal} to clause`)
                    clause.push(literal) // Add literal to clause
                    buffer = ""
                }
                if (cnfInput[i+1] == '0') { // Reached end of clause
                    // console.log(`Adding clause: ${clause}`)
                    clauseList.push(clause)//TODO in microsat an empty clause is checked here and also single literal clause is assigned/checked
                    clause = []
                    i++
                }
            } else {
                buffer = buffer + cnfInput[i]
                // console.log(`Adding ${cnfInput[i]} to buffer. buffer=${buffer}`)
            }
        }
        this.clauses = clauseList
        this.setup()
    }

    private setup() {
        this.processedClauses = this.clauses
    }

    public getAssignments(){
        // Returns only variables which are assigned. When solved some might not have been assigned, they can take either value without impacting the solution
        // This can be improved on to find unassigned varibles and highlight these or return multiple sets of results
        return this.variableAssignments
    }
    
    // In future split this out into separate methods to: 1 run a step with no events, 2 a step with step results, 3 step will all results so far
    public solveStep(): eventType[] {
        let stepResult = this.solveOneStep()
        if (stepResult != undefined) {
            this.events = this.events.concat(stepResult)
        }
        return this.events
    }

    private solveOneStep(){
        //TODO move out to another method to call this one, can be just in parent class
        if (this.complete) {
            return
        }
        let logText = ""
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
            //events.push({type: "backtrack"})// console.log(`Popped previous variable=${previousVariableA}`)
            if (previousVariableA![1] == false) { // If already backtracked then it will be false, in this case need to remove prior assignments until one can be tried with false
                // console.log(`This is false, so going up`)
                for (let i = this.variableAssignments.length-1; i >= 0; i--) {
                    events.push({ type: "backtrack" })// console.log(`Checking variable=${this.variableAssignments[i]}`)
                    if (this.variableAssignments[i][1] == true) { //use this
                        // console.log(`Using variable=${this.variableAssignments[i]}`)
                        previousVariableA = this.variableAssignments[i]
                        break
                    } else {this.variableAssignments.pop()}//remove it
                }
                if (this.variableAssignments.length == 0) { // If variableAssignments is empty then we are at root node and cannot backtrack - can set failed flag and end
                    this.complete = true
                    return //failed
                } else { //then regenerate the processed clauses and continue
                    this.variableAssignments.pop()// remove the prior assignment
                    // console.log(`Assignments prior to regen=${this.variableAssignments}`)
                    this.regenerateProcessedClauses()
                }
            }
            variable = previousVariableA![0]
            lit = 0-variable
            varBool = false
        }

        let negLit = 0-lit
        logText = `Assigning ${varBool} to ${variable}`
        events.push({ type: "assign", var: variable, val: varBool })
        this.variableAssignments.push([variable, varBool])
        logText = logText + "\nAll assignments: "+this.variableAssignments

        // Remove this literal from clauses
        for (let clause of this.processedClauses) {
            if (!clause.includes(lit)) { // If it doesn't include this literal (if it does then eliminated)
                let newClause = clause.filter((clit) => clit != negLit) // Remove negated version of the variable
                if (newClause.length == 0) { // Check if the clause is now empty
                    logText = logText + `\nRemoving ${negLit} causes an empty clause, will try to backtrack`
                    this.backtrack = true // Set flag to backtrack on next step
                    events.push({ type: "failure" })
                    return events//logText
                }
                nextProcessedClauses.push(newClause) // Add to processed list
            }
        }
        this.backtrack = false //reset backtrack
        
        this.processedClauses = nextProcessedClauses
        if (this.processedClauses.length == 0) {
            this.complete = true
            events.push({ type: "solved" })
            return events//logText + "\nSolved"
        }
        logText = logText + `\nClauses: ${nextProcessedClauses}, count: ${nextProcessedClauses.length}`
        return events//logText
    }

    private regenerateProcessedClauses() {
        this.setup() // Reset existing clause list
        // Recreate using current assignments
        for (let variable of this.variableAssignments) {
            let nextProcessedClauses: number[][] = []
            let lit = (variable[1] == true) ? variable[0] : 0-variable[0]
            let negLit = 0-lit
            console.log(`Eliminate ${lit} and ${negLit}`)
            for (let clause of this.processedClauses) {
                console.log(`Examine ${clause}`)
                if (!clause.includes(lit)) { // If it doesn't include this literal (if it does then eliminated)
                    let newClause = clause.filter((clit) => clit != negLit) // Remove negated version of the variable
                    if (newClause.length == 0) { // Check if the clause is now empty
                        //This shouldn't ever happen
                    }
                    console.log(`Replaced with ${newClause}`)
                    nextProcessedClauses.push(newClause) // Add to processed list
                } else {console.log(`eliminated`)}
            }
            this.processedClauses = nextProcessedClauses
        }
        // console.log(`Eliminate Done`)
    }
}
//TODO If implementing more than one algorithm, then make this a parent class
export type eventType = {type:string,var?:number,val?:boolean}
export class Solver {
    private dimacs: string
    public clauses: number[][] = []
    public processedClauses: number[][] = []
    protected variableAssignments: [number, boolean][] = []
    protected backtrack = false
    protected complete = false
    protected events:eventType[] = []

    //TODO - Add statistics such as number of steps, backtracks etc.
    //TODO - Add automatic abort timeout

    public constructor(dimacs: string) {
        this.dimacs = dimacs
    }

    public parse(): boolean {
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
                    literal = Number(buffer)
                    if (Number.isNaN(literal)) {
                        alert(`Invalid DIMACS CNF ('${buffer}' is not a number)`)
                        return false
                    } else if (literal === 0) {
                        alert(`Invalid DIMACS CNF ('${buffer}' is not a valid literal)`)
                        return false
                    }
                    clause.push(literal) // Add literal to clause
                    buffer = ""
                }
                if (cnfInput[i+1] == '0') { // Reached end of clause
                    if (clause.length == 0) {
                        alert("Invalid DIMACS CNF (empty clause)")
                        return false
                    }
                    clauseList.push(clause)
                    clause = []
                    i++
                }
            } else {
                buffer = buffer + cnfInput[i]
            }
        }
        this.clauses = clauseList
        this.setup()
        return true
    }

    protected setup() {
        this.processedClauses = this.clauses
    }

    public isSolvingFinished(){
        return this.complete
    }

    public getAssignments(){
        // Returns only variables which are assigned. When solved some might not have been assigned, they can take either value without impacting the solution
        // This can be improved on to find unassigned varibles and highlight these or return multiple sets of results
        // Returns a Map to allow easy lookup
        return new Map(this.variableAssignments)
    }
    
    public getEvents(){
        return this.events
    }

    // In future option to return incremental events?
    public solveStep(): eventType[] {
        if (!this.complete) {
            let stepResult = this.solveOneStep()
            if (stepResult != undefined) {
                this.events = this.events.concat(stepResult)
            }
        }
        return this.events
    }

    protected solveOneStep():eventType[] {
        return this.events
    }
}
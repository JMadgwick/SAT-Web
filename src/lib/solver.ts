export class solver {
    private dimacs: string
    public clauses: number[][] = []

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
    }

    protected solve(){}

    public solveOneStep(){}
}
export type eventType = {type:string,var?:number,val?:boolean,vvmap?:Map<number,boolean>}
export abstract class solver{
  private dimacs: string
  protected originalProblemClauses: number[][] = []
  protected variableAssignmentsHistory: Array<Map<number,boolean|undefined|null>> = new Array // Array to store history of variable assignments
  protected nextStepType = "" // Next step type
  protected events: eventType[] = []

  // Statistics
  public stepCount = 0

  public constructor(dimacs: string) {
    this.dimacs = dimacs
  }

  public parse(): boolean {
    let p = this.dimacs.match(new RegExp('^p cnf (\\d+) (\\d+)$', 'm')) //TODO use this problem information?
    if (p == null) { // If problem line is missing
        alert("missing problem line");
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
    if (clauseList.length == 0) {
      alert("No clauses found")
      return false
    }
    this.originalProblemClauses = clauseList
    this.setup()
    return true
  }

  // Find all the unique variables used in the problem and add them to a Map in ascending order
  private populateVariableAssignments(): Map<number,boolean|undefined|null> {
    let uniqueVariables:Set<number> = new Set
    for (let clause of this.originalProblemClauses) {
        for (let variable of clause) {
            uniqueVariables.add(Math.abs(variable))
        }
    }
    let variableAssignments:Map<number,boolean|undefined|null> = new Map
    Array.from(uniqueVariables).sort((a, b) => a - b).forEach(variable => variableAssignments.set(variable,undefined))
    return variableAssignments
}

  protected setup(): void {
    this.variableAssignmentsHistory.push(this.populateVariableAssignments())
  }

  public isSolvingFinished(){
    return this.nextStepType == "none"
  }

  public abstract getAssignments(): Map<number, boolean>

  public getInitialClauses(){
    return this.originalProblemClauses
  }

  public abstract getCurrentClauses(): number[][]

  public getNextStep() {
    return this.nextStepType
  }

  public getEvents(){
    return this.events
  }

  public solveStep(): eventType[] {
      if (this.nextStepType != "none") {
          let stepResult = this.solveOneStep()
          if (stepResult != undefined) {
              this.events = this.events.concat(stepResult)
              this.stepCount++
          }
      }
      return this.events
  }

  protected abstract solveOneStep(): eventType[]
}
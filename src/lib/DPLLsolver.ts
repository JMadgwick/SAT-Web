export type eventType = {type:string,var?:number,val?:boolean,vvmap?:Map<number,boolean>}
export class newDPLLSolver{
  private dimacs: string
  protected originalProblemClauses: number[][] = []
  protected remainingClausesHistory: number[][][] = [] //clause history
  protected variableAssignmentsHistory:Array<Map<number,boolean|undefined|null>> = new Array //variable history
  protected variableAssignmentOrder: number[] = [] // Stores the order/history of variables which have been assigned in 'applyAssign'. Used for backtracking.
  protected lastFailedVariableAssignments:Map<number,boolean|undefined|null> = new Map//variable histroy for failed
  protected nextStepType = "dpll" //next step type, initially dpll
  protected events:eventType[] = []


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
    this.originalProblemClauses = clauseList
    this.setup()
    return true
  }

  // Find all the unique variables used in the problem and add them to a Map in ascending order
  private populateVariableAssignments():Map<number,boolean|undefined|null> {
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

  protected setup() {
    this.variableAssignmentsHistory.push(this.populateVariableAssignments())
    this.remainingClausesHistory.push(this.originalProblemClauses)
  }

  public isSolvingFinished(){
    return this.nextStepType == "none"
  }

  public getAssignments(){
    if (this.lastFailedVariableAssignments.size!=0) {
      return this.tmptransform(this.lastFailedVariableAssignments)
    } else {
      return this.tmptransform(this.variableAssignmentsHistory.at(-1)!)
    }
  }

  private tmptransform(input:Map<number,boolean|undefined|null>):Map<number,boolean> {
    let tmp:Map<number,boolean> = new Map
        for (let [key,value] of input) {
            if ((value == true) || (value ==false)) {
                tmp.set(key,value)
            }
        }
        return tmp
  }

  public getInitialClauses(){
    return this.originalProblemClauses
  }

  public getCurrentClauses() {
    return this.remainingClausesHistory.at(-1)!
  }

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
          }
      }
      return this.events
  }

  protected solveOneStep():eventType[] {
    switch (this.nextStepType) {
      case "dpll":
        return this.runDPLL()

      case "assign":
        return this.doAssign()

      case "backtrack":
        return this.doBacktrack()

      default:
        return this.events
    }
  }

  protected runDPLL():eventType[] {
    let dpllEvents:eventType[] = [] // Stores events generated during this step
    //TODO count number of iterations and add to output

    // Pure Literal Elimination
    let runPureLiteralElimination = true
    let allPureAssignments: Map<number,boolean> = new Map // List of pure literal assignments, added to on each iteration of recursion
    while (runPureLiteralElimination) {
      runPureLiteralElimination = this.runPureLiteralElimination(allPureAssignments, dpllEvents)
    }

    // Unit Literal Propagation
    let runUnitPropagation = true
    let allUnitLiteralAssignments: Map<number,boolean> = new Map
    let clausesForUnitPropagationElimination: number[][] = Array.from(this.remainingClausesHistory.at(-1)!)
    let dpllObjects = {allUnitLiteralAssignments, clausesForUnitPropagationElimination} // Array of numbers is not an object and needs to be wrapped one object or it will be passed by value
    while (runUnitPropagation) {
      runUnitPropagation = this.runUnitPropagation(dpllObjects, dpllEvents)
    }

    if (this.nextStepType == "dpll")//if dpll stages did not change next step then use assign
      this.nextStepType = "assign"
    return dpllEvents
  }

  protected doAssign():eventType[] {
    let assignEvents:eventType[] = [] // Stores events generated during this step
    let variable:number = -99
    let value:boolean = true
    // Determine the variable to assign
    let previouslyAssignedVariable = this.variableAssignmentOrder.at(-1) ?? -99 // get the last assigned variable if it exists, otherwise use zero get first variable in for below
    let previouslyAssignedVariableValue = this.lastFailedVariableAssignments.get(previouslyAssignedVariable) //get the failed assignment
    if (previouslyAssignedVariableValue == true) { //if true has already been tried for this variable then try again with false
      variable = previouslyAssignedVariable
      value = false
    } else { //otherwise pick a new variable
      for (let [histVariable,histValue] of this.variableAssignmentsHistory.at(-1)!.entries()) {//loop through
        if ((histVariable > previouslyAssignedVariable) && (histValue == undefined)) {
          variable = histVariable
          value = true
          break
        }
      }
      if (variable == -99) {
        this.nextStepType = "none"
        console.log("Error: Could not find a new variable")
        return assignEvents
      }
      this.variableAssignmentOrder.push(variable) //add to assignment order
    }

    let newVariableAssignments = new Map(this.variableAssignmentsHistory.at(-1)!).set(variable,value) //Next variable assignment Map, to add onto end if sucess, or to fail history if not
    let clausesAfterElimination: number[][] = [] //next clauses to add onto end if success

    let literal = (value) ? variable : 0-variable
    let oppositeLiteral = 0-literal

    assignEvents.push({ type: "assign", var: variable, val: value })

    for (let clause of this.remainingClausesHistory.at(-1)!) {
      if (clause.includes(literal)) { // If the clause contains the assigned literal
          // Eliminate this clause (by omitting it from the new clause list)
      }
      else if (clause.includes(oppositeLiteral)) { // If the clause contains the negated version of this literal
        let filteredClause = clause.filter((clit) => clit != oppositeLiteral) // Remove negated literal from this clause
        if (filteredClause.length == 0) { // If this clause is now empty we have a conflict
          this.lastFailedVariableAssignments = newVariableAssignments // Store this set of failed assinments
          // If we are trying true then we can try again with false
          if (value) {
            this.nextStepType = "assign"
          } else { //otherwise we have tried true and false and need to backtrack
            this.nextStepType = "backtrack" // Next step needs to be backtracking
          }
          assignEvents.push({ type: "failure", var: oppositeLiteral }) // sending the literal here makes no sense, remove it
          return assignEvents
        }
        clausesAfterElimination.push(filteredClause)
      } else { // Else the given clause does not involve this variable
        clausesAfterElimination.push(clause)
      }
    }
    // Assignment was successful
    this.remainingClausesHistory.push(clausesAfterElimination)
    this.variableAssignmentsHistory.push(newVariableAssignments)
    this.lastFailedVariableAssignments = new Map //Remove failed set
    if (clausesAfterElimination.length == 0) { // If all clauses have been eliminated then SAT
      this.nextStepType = "none"
      assignEvents.push({ type: "SAT" })
    } else {
      this.nextStepType = "dpll"
    }
    return assignEvents
  }

  protected doBacktrack():eventType[] {
    let backtrackCount = 0 // Stores a count for number of backtrack events performed during this step
    while (this.variableAssignmentOrder.length > 0) { // While variables exist to backtrack to
      backtrackCount++ // Add event to indicate backtracking up the search tree
      this.variableAssignmentOrder.pop() // Remove the last assigned variable which has already had false tried
      this.remainingClausesHistory.pop()
      this.variableAssignmentsHistory.pop()
      if (this.lastFailedVariableAssignments.get(this.variableAssignmentOrder.at(-1)!)) { // Can false be tried on the next available variable (if so it will have last been assigned true)
        this.nextStepType = "assign" // next step is to try assigning this variable as false
        return [{ type: "backtrack", var:backtrackCount }]
      }
    }
    // VariableAssignments is now empty, therefore the root node has been reached and further backtracking is not possible
    this.nextStepType = "none"
    return [{ type: "UNSAT" }]
  }

  protected runPureLiteralElimination(allPureAssignments:Map<number,boolean>, dpllEvents:eventType[]):boolean {
    let allLiterals: Set<number> = new Set
    let pureLiterals: Array<number> = new Array
    //find set of all literals
    //TODO this be initialised in the level above and cached, it only needs to be run once each time Pure Literal Elimination is done
    for (let clause of this.remainingClausesHistory.at(-1)!) {
      for (let literal of clause) {
        allLiterals.add(literal)
      }
    }
    //for each literal in the set, check if pure (no counterpart in the set), if it is then add to list to get assigned
    for (let literal of allLiterals) {
      if (!allLiterals.has(0-literal)) { // If the counterpart for this literal doesn't exist in the problem, then it is pure
        pureLiterals.push(literal)
      }
    }

    // if no (or no further) pure then add events and return
    if (pureLiterals.length == 0) {
      if (allPureAssignments.size != 0) {
        dpllEvents.push({ type: "purelit", vvmap: allPureAssignments })
      }  
      return false
    }

    //do elimination
    let clausesAfterElimination = this.remainingClausesHistory.pop()!
    for (let literal of pureLiterals) {
        clausesAfterElimination = clausesAfterElimination.filter(clause => !clause.includes(literal))
    }

    this.remainingClausesHistory.push(clausesAfterElimination)

    // Create variables assignments for pure literals
    for (let literal of pureLiterals) {
      if (literal < 0) { // Assignments which must be false to satisfy
        allPureAssignments.set(Math.abs(literal),false)
      } else { // Assignments which must be true to satisfy
        allPureAssignments.set(literal,true)
      }
    }

    // Update Current Variable Assignments to add these pure literal assignments
    for (const [literal, assignment] of allPureAssignments.entries()) {
      this.variableAssignmentsHistory.at(-1)!.set(literal,assignment)
    }

    if (clausesAfterElimination.length == 0) { // If all clauses have now been eliminated then SAT
      this.nextStepType = "none"
      dpllEvents.push({ type: "purelit", vvmap: allPureAssignments })
      dpllEvents.push({ type: "SAT" })
      return false
    }
    return true
  }

  protected runUnitPropagation(dpll:{allUnitLiteralAssignments:Map<number,boolean>; clausesForUnitPropagationElimination:number[][]}, dpllEvents:eventType[]):boolean {
    let unitLiterals: Set<number> = new Set // Set to store each unit literal only once
    
    // find all unit clauses (those with length of one)
    for (let clause of dpll.clausesForUnitPropagationElimination) {
        if (clause.length == 1) {
            unitLiterals.add(clause[0]) // add unit literals to Set
        }
    }
    // If no (or no further) unit propagation was possible then return
    if (unitLiterals.size == 0) {
      if (dpll.allUnitLiteralAssignments.size != 0) { //If some unit propagation assignments were made
        // Replace current assignments and clauses (clausesForUnitPropagationElimination)

        let unitPropagationVariableAssignments = this.variableAssignmentsHistory.at(-1)!
        // Update Current Variable Assignments to add these propagated units
        for (const [literal, assignment] of dpll.allUnitLiteralAssignments.entries()) {
          unitPropagationVariableAssignments.set(literal,assignment)
        }
        this.variableAssignmentsHistory.pop()
        this.variableAssignmentsHistory.push(unitPropagationVariableAssignments)

        // Update Current Clauses to remove any eliminated during propagation
        this.remainingClausesHistory.pop()
        this.remainingClausesHistory.push(dpll.clausesForUnitPropagationElimination)

        dpllEvents.push({ type: "unitprop", vvmap: dpll.allUnitLiteralAssignments }) // Add Unit Propagation event

        if (dpll.clausesForUnitPropagationElimination.length == 0) { // If all clauses have now been eliminated then SAT
          this.nextStepType = "none"
          dpllEvents.push({ type: "SAT" })
        }
      }
      return false
    }

    // Check there are no conflicts within the set of unit literals - if so then flag backtrack and abort (return false)
    for (let literal of unitLiterals) {
      if (unitLiterals.has(0-literal)) { // If the counterpart for this literal is also a unit, then resolution is impossible
        dpllEvents.push({ type: "unitpropfailureboth", var: literal })
        this.handleUnitPropagationFailure(dpllEvents)
        return false
      }
    }

    // apply elimination of these unit literals
    let clausesAfterElimination: number[][] = []
    for (let literal of unitLiterals) {
      let pureLiteral = 0-literal
      for (let clause of dpll.clausesForUnitPropagationElimination) {
        if (clause.includes(literal)) { // If the clause contains the assigned literal
          // Eliminate this clause (by omitting it from the new clause list)
        }
        else if (clause.includes(pureLiteral)) { // If the clause contains the negated version of this literal
          let filteredClause = clause.filter((clit) => clit != pureLiteral) // Remove negated literal from this clause
          if (filteredClause.length == 0) { // If this clause is now empty
            dpllEvents.push({ type: "unitpropfailure", var: literal }) // event only lists conflict and not other assignments made before it was found - see pidgeon example
            this.handleUnitPropagationFailure(dpllEvents)
            return false
          }
          clausesAfterElimination.push(filteredClause)
        } else { // Else the given clause does not involve this variable
          clausesAfterElimination.push(clause)
        }
      }
      dpll.clausesForUnitPropagationElimination = clausesAfterElimination
      clausesAfterElimination = []
    }

    // Create satisfying variable assignments for unit literals and add to assignments already made
    for (let literal of unitLiterals) {
        if (literal < 0) { // Assignments which must be false to satisfy
          dpll.allUnitLiteralAssignments.set(Math.abs(literal),false)
        } else { // Assignments which must be true to satisfy
          dpll.allUnitLiteralAssignments.set(literal,true)
        }
    }

    // Return true to indicate that Unit Propagation can be run again
    return true
  }
  private handleUnitPropagationFailure(dpllEvents:eventType[]) {
    let previouslyAssignedVariable = this.variableAssignmentOrder.at(-1) // Get the last assigned variable, or undefined if there isn't one
    if (previouslyAssignedVariable == undefined) { // If no variables have been assigned then we are at the root node and the problem is UNSAT
      this.nextStepType = "none"
      dpllEvents.push({ type: "UNSAT" })
    } else if (this.variableAssignmentsHistory.at(-1)!.get(previouslyAssignedVariable)) { // If the last assigned variable was true
      this.lastFailedVariableAssignments = this.variableAssignmentsHistory.pop()! // Set the current assignments as failed and remove from variable assignment history
      this.remainingClausesHistory.pop() // Remove clause history for this assignment
      // Next step is assign by default - where false will be tried
    } else { // If the last assigned variable was false
      this.lastFailedVariableAssignments = this.variableAssignmentsHistory.pop()! // Set the current assignments as failed
      this.remainingClausesHistory.pop() // Remove clause history for this assignment
      this.nextStepType = "backtrack" // Next step needs to be backtracking
    }
  }
}
/**
 * A single event emitted by a solver while it steps through a problem.
 *
 * Events are the unit of communication between the solver and the UI:
 * each call to {@link solver.solveStep} appends zero or more events to the
 * solver's event log, which the visualisations consume to render the search
 * tree and variable interaction graph.
 */
export type eventType = {
  /** The kind of event. One of: `assign`, `failure`, `backtrack`, `SAT`, `UNSAT`, `purelit`, `unitprop`, `purelitfailure`, `unitpropfailure`, `unitpropfailureboth`. */
  type: string
  /** The variable involved in this event (e.g. the variable being assigned or the literal that caused a conflict). */
  var?: number
  /** The boolean value being assigned, or the value that led to a conflict. */
  val?: boolean
  /** A map of variable assignments produced by a DPLL stage (pure literal elimination or unit propagation). */
  vvmap?: Map<number, boolean>
}

/**
 * Abstract base class for SAT solvers.
 *
 * A solver is driven step by step: {@link solver.parse} loads and validates a
 * DIMACS CNF problem, and {@link solver.solveStep} advances the search by a
 * single step, appending the resulting {@link eventType events} to the log.
 * Concrete solvers implement {@link solver.solveOneStep} to describe how one
 * step is performed.
 */
export abstract class solver{
  /** The raw DIMACS CNF text supplied to the solver. */
  private dimacs: string
  /** The clauses of the original problem, as arrays of literals. */
  protected originalProblemClauses: number[][] = []
  /** History of variable assignments; each entry is the assignment map after one step. */
  protected variableAssignmentsHistory: Array<Map<number,boolean|undefined>> = new Array // Array to store history of variable assignments
  /** The kind of step to perform next (e.g. `dpll`, `assign`, `backtrack`, `none`). */
  protected nextStepType = "" // Next step type
  /** The accumulated log of events emitted so far. */
  protected events: eventType[] = []

  // Statistics
  /** The total number of steps the solver has taken. */
  public stepCount = 0

  /**
   * Create a new solver for the given DIMACS CNF problem.
   * @param dimacs The DIMACS CNF text to solve.
   */
  public constructor(dimacs: string) {
    this.dimacs = dimacs
  }

  /**
   * Parse and validate the DIMACS CNF input.
   *
   * Extracts the problem header, reads the clauses, and initialises the
   * solver's internal state via {@link solver.setup}.
   * @returns `true` if the input was valid and the solver is ready, `false` otherwise.
   */
  public parse(): boolean {
    let problemInfo = this.dimacs.match(new RegExp('^p cnf (\\d+) (\\d+)$', 'm')) // Extract problem information from DIMACS header
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
    if (problemInfo == null) { // Show the determined problem header if it is missing
      alert(`Problem header missing. It should be: p cnf ${this.variableAssignmentsHistory.at(0)?.size} ${this.originalProblemClauses.length}`);
    }
    return true
  }

  /**
   * Find all the unique variables used in the problem and add them to a Map in ascending order.
   * @returns A map from each variable to `undefined` (unassigned).
   */
  private populateVariableAssignments(): Map<number,boolean|undefined> {
    let uniqueVariables:Set<number> = new Set
    for (let clause of this.originalProblemClauses) {
        for (let variable of clause) {
            uniqueVariables.add(Math.abs(variable))
        }
    }
    let variableAssignments:Map<number,boolean|undefined> = new Map
    Array.from(uniqueVariables).sort((a, b) => a - b).forEach(variable => variableAssignments.set(variable,undefined))
    return variableAssignments
}

  /**
   * Initialise the solver's internal state after the problem has been parsed.
   * Subclasses may override this to add their own initialisation.
   */
  protected setup(): void {
    this.variableAssignmentsHistory.push(this.populateVariableAssignments())
  }

  /**
   * Check whether the solver has finished (reached SAT/UNSAT or exhausted the search).
   * @returns `true` if no further steps will be taken.
   */
  public isSolvingFinished(){
    return this.nextStepType == "none"
  }

  /**
   * Get the current variable assignments.
   * @returns A map from each variable to its assigned value, or `undefined` if unassigned.
   */
  public abstract getAssignments(): Map<number,boolean|undefined>

  /**
   * Get the clauses of the original problem.
   * @returns The original clauses as arrays of literals.
   */
  public getInitialClauses(){
    return this.originalProblemClauses
  }

  /**
   * Get the clauses remaining at the current point in the search.
   * @returns The remaining clauses as arrays of literals.
   */
  public abstract getCurrentClauses(): number[][]

  /**
   * Get the kind of step that will be performed next.
   * @returns The next step type (e.g. `dpll`, `assign`, `backtrack`, `none`).
   */
  public getNextStep() {
    return this.nextStepType
  }

  /**
   * Get the full log of events emitted so far.
   * @returns The accumulated {@link eventType event} log.
   */
  public getEvents(){
    return this.events
  }

  /**
   * Advance the solver by one step, appending the resulting events to the log.
   * @returns The full {@link eventType event} log after this step.
   */
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

  /**
   * Perform a single step of the search.
   * Implemented by concrete solvers to advance the search and return the events produced.
   * @returns The events produced by this step.
   */
  protected abstract solveOneStep(): eventType[]
}
import { DPLLSolver } from "./DPLLsolver"
import type { eventType } from "./solver"

/**
 * A plain backtracking SAT solver.
 *
 * Extends {@link DPLLSolver} but skips the DPLL simplification stages
 * (pure literal elimination and unit propagation), performing only decision
 * assignments and backtracking. Useful for demonstrating basic backtracking
 * search without the DPLL optimisations.
 */
export class backtrackingSolver extends DPLLSolver{
  /** The kind of step to perform next; initially `assign`. */
  protected nextStepType = "assign" // Next step type, initially assign

  /**
   * Create a new backtracking solver for the given DIMACS CNF problem.
   * @param dimacs The DIMACS CNF text to solve.
   */
  public constructor(dimacs: string) {
    super(dimacs)
  }

  /**
   * Perform a decision assignment, keeping the next step as an assignment
   * rather than a DPLL simplification step.
   * @returns The events produced by this assignment step.
   */
  protected doAssign(): eventType[] {
    let superEvents:eventType[] = super.doAssign()
    if (this.nextStepType == "dpll") // Do assignment instead of DPLL
      this.nextStepType = "assign"
    return superEvents
  }

}
import { DPLLSolver } from "./DPLLsolver"
import type { eventType } from "./solver"
export class backtrackingSolver extends DPLLSolver{
  protected nextStepType = "assign" // Next step type, initially assign

  public constructor(dimacs: string) {
    super(dimacs)
  }

  protected doAssign(): eventType[] {
    let superEvents:eventType[] = super.doAssign()
    if (this.nextStepType == "dpll") // Do assignment instead of DPLL
      this.nextStepType = "assign"
    return superEvents
  }

}
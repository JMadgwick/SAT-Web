// Take array of clauses and literals, put into a more readable format
export default function convertToNotation(clauses: number[][], assignments:[number, boolean][]):string {
    let overallMML = ""
    // for (let clause of clauses) {
    for (let i = 0; i < clauses.length; i++) {
        let clauseMML = '<mrow style=""><mo fence=true largeop=true>(</mo>'
        for (let j = 0; j < clauses[i].length; j++) {
        // for (let literal of clause) {
            let literal = clauses[i][j]
            let literalMML = '<mrow style="color:black">'
            if (literal < 0) {
                literalMML = literalMML + `<mo>&not;</mo><msub><mi>x</mi><mn>${Math.abs(literal)}</mn></msub></mrow>`
            } else {
                literalMML = literalMML + `<msub><mi>x</mi><mn>${literal}</mn></msub></mrow>`
            }

            let assignment = assignments.find(element => element[0] == Math.abs(literal))
            if (assignment != undefined) {
                if ((assignment[1] == true && literal > 0) || (assignment[1] == false && literal < 0)) {
                    literalMML = literalMML.replace("black","darkgreen")
                } else {
                    literalMML = literalMML.replace("black","red")
                }
            }
            if (j != clauses[i].length-1) {
                literalMML = literalMML + '<mo>&or;</mo>'
            }
            clauseMML = clauseMML + literalMML
        }

        if (clauseMML.includes("darkgreen")) { // if any true, whole clause true
            clauseMML = clauseMML.replace('style=""','style="background-color:lightgreen"')
        } else if (clauseMML.includes("red") && !clauseMML.includes("black")) { // if all false, whole clause false
            clauseMML = clauseMML.replace('style=""','style="background-color:lightsalmon"')
        }
        clauseMML = clauseMML + '<mo fence=true largeop=true>)</mo></mrow>'
        if (i != clauses.length-1) {
            clauseMML = clauseMML + '<mo>&and;</mo>'
        }
        overallMML = overallMML + clauseMML
    }
    return overallMML
}
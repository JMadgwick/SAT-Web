// Take array of clauses and literals, put into a more readable format
//TODO make this a Svelte component that includes maths notation visualisation, value is just passed into the component with "val={not}"
export default function convertToNotation(clauses: number[][]):string {
    let notation:string = "("
    for (let clause of clauses) {
        for (let literal of clause) {
            notation = notation + String(literal).replace('-', '~') + " or "
        }
        notation = notation.slice(0, -4) + ") and ("
    }
    return notation.slice(0, -6)
}
//TODO ability to colour in red or strikethrough clauses and variables that have been eliminated
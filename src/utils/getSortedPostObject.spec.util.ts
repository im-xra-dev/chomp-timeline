import {SortedPost} from "../modules/t-line/utils/types";

export default (id: number, score: number, sec?: string): SortedPost => {
    return {
        id: `MOCK${id}`,
        sec: sec ?? `tests${id}`,
        score: score,
        seen: false,
        vote: 0,
    }
}

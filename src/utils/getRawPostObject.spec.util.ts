import {RawPost} from "./types";

export default (id: number, sec?: string): RawPost => {
    return {
        id: `MOCK${id}`,
        sec: sec ?? `tests${id}`,
        authorsPersonalScore: 10,
        postPersonalScore: 10,
        thrRelationalScore: 10,
        secRelationalScore: 10,
        autRelation: {follows: false, muted: true, score: 10},
        postState: {weight: 10, vote: 0, seen: false},
    }
}

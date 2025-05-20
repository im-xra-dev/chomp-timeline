import { RawPost } from './types';

export default (
    id: number,
    sec?: string,
    authMuted: boolean = false,
    commMuted: boolean = false,
): RawPost => {
    return {
        id: `MOCK${id}`,
        sec: sec ?? `tests${id}`,
        authorsPersonalScore: 10,
        postPersonalScore: 10,
        thrRelationalScore: 10,
        secPersonalScore: 10,
        autRelation: { follows: false, muted: authMuted, score: 10 },
        secRelation: { follows: false, muted: commMuted, score: 10 },
        postState: { weight: 10, vote: 0, seen: false, sess: 'sess' },
    };
};

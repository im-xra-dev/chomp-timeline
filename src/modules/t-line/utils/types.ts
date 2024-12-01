const DiscoveryModes = import('../utils/DiscoveryModes');

export type UserRelation = { follows: boolean, muted: boolean, score: number }
export type PostState = { weight: number, seen: boolean, vote: number }

export type SortedPost = {
    id: string,
    sec: string,
    seen: boolean,
    vote: number,
    score: number,
}

export type ConcurrentBatch = Promise<SortedPost[]>

export type JobListing = {
    readonly jobid: string,
    readonly userid: string,
    readonly mode: keyof typeof DiscoveryModes,
    readonly query: number,//how many posts from neo
    readonly cache: number,//how many am I hoping for
    readonly serve: number,//how many to give to the final Q
    readonly broadcast: unknown,
    concurrentJobs: number,
}

export type RawPost = {
    id: string,
    sec: string,
    secRelationalScore: number,
    postPersonalScore: number,
    authorsPersonalScore: number,
    thrRelationalScore: number,
    autRelation: UserRelation,
    postState: PostState
}
const DiscoveryModes = import('../utils/DiscoveryModes')


export type UserRelation = { follows: boolean, muted: boolean, score: number }
export type PostState = { weight: number, seen: boolean, vote: number }

/* maybe userid should be tlineid
tline:[userid]:pool -> id[]
tline:[userid]:pool:[postid] -> hash of values
tline:[userid]:seen -> hash or set of flags
tline:[userid]:follow:sec -> id[]
tline:[userid]:follow:sec:[secid] -> hash of score, normalizedScore and totalPosts
tline:[userid]:follow:user -> id[]
tline:[userid]:follow:user:[uid] -> hash of score, normalizedScore and totalPosts
 */

// export type PooledPost = {id:string, score:number, voteData:number, addedOn:number}

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

// export type DiscoverParams = { mode: DiscoveryModes, count: number };
// export type CacheState = {
//     pool: PooledPost[],
//     seen: {[key:string]: boolean},
//     followedSec:[] //normalized:number
//     followedUser:[]
// }
import {DiscoveryModes} from 'DiscoveryModes';
import {JobTypes} from 'JobTypes';

export type UserRelation = { follows: boolean, muted: boolean, score: number }
export type PostState = { weight: number, seen: boolean, vote: number }

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

export type SortedPost = {
    id: string,
    sec: string,
    seen: boolean,
    vote: number,
    score: number,
}

export type ConcurrentBatch = Promise<SortedPost[]>

//generic job listing
export type GenericJobListing = {
    readonly jobid: string,
    readonly userid: string,
    readonly broadcast?: unknown,
}

export type CacheClearJobListing = {
    readonly jobType: JobTypes.CLEAR_CACHE,
} & GenericJobListing

export type QueryJobListing = {
    readonly jobType: JobTypes.QUERY,
    //mode for the query
    readonly mode: DiscoveryModes,
    //how large should the queried input be
    readonly query: number,
    //how large should the cache // output be
    readonly cache: number,
} & GenericJobListing;

export type LoadJobListing = {
    readonly jobType: JobTypes.LOAD,
    //The total qty of posts to publish to the user
    readonly publish: number,
} & GenericJobListing;

export type QueryLoadJobListing = {
    readonly jobType: JobTypes.QUERY_LOAD,
} & LoadJobListing & QueryJobListing;

export type InitJobListing = {
    readonly jobType: JobTypes.INIT,
} & QueryLoadJobListing;


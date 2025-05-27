import { DiscoveryModes } from './DiscoveryModes';
import { JobTypes } from './JobTypes';

export type UserRelation = Readonly<{
    follows: boolean;
    muted: boolean;
    score: number;
}>;

export type CommunityRelation = UserRelation;

export type PostState = Readonly<{
    weight: number;
    seen: boolean;
    vote: number;
    sess: string;
}>;

export type RawPost = Readonly<{
    id: string;
    sec: string;
    secPersonalScore: number;
    postPersonalScore: number;
    authorsPersonalScore: number;
    thrRelationalScore: number;
    secRelation: CommunityRelation;
    autRelation: UserRelation;
    postState: PostState;
}>;

export type SortedPost = Readonly<{
    id: string;
    sec: string;
    seen: boolean;
    vote: number;
    score: number;
}>;

export type ConcurrentBatch = Promise<readonly SortedPost[]>;
export type QueryData = { [jobMode: string]: readonly SortedPost[] };

export type CASCADE = JobTypes.QUERY_LOAD | JobTypes.INIT;
export type JobResult = JobTypes.ABORT | JobTypes.CONTINUE;

//generic job listing
export interface GenericJobListing {
    readonly jobType: unknown;
    readonly jobid: string;
    readonly userid: string;
    readonly broadcast?: unknown;
}

export interface CacheClearJobListing extends GenericJobListing {
    readonly jobType: JobTypes.CLEAR_CACHE;
}

export interface QueryJobListing extends GenericJobListing {
    readonly jobType: JobTypes.QUERY | CASCADE;
    //modes for the query
    readonly modes: DiscoveryModes[];
    //how large should the queried input be
    readonly query?: number;
    //how large should the cache // output be
    readonly cache: number;
}

export interface LoadJobListing extends GenericJobListing {
    readonly jobType: JobTypes.LOAD | CASCADE;
    //what pools of data should be loaded
    readonly modes: DiscoveryModes[];
    //The total qty of posts to publish to the user
    readonly publish: number;
}

export interface QueryLoadJobListing extends LoadJobListing, QueryJobListing {
    readonly jobType: JobTypes.QUERY_LOAD;
}

export interface InitJobListing extends LoadJobListing, QueryJobListing {
    readonly jobType: JobTypes.INIT;
}

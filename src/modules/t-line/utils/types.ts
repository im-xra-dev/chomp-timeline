import {DiscoveryModes} from "./DiscoveryModes";

export type UserRelation = { follows: boolean, muted: boolean, score: number }
export type PostState = { weight: number, seen: boolean, vote: number }

/*
tline:[userid]:pool -> id[]
tline:[userid]:pool:[postid] -> hash of values
tline:[userid]:seen -> hash or set of flags
tline:[userid]:follow:sec -> id[]
tline:[userid]:follow:sec:[secid] -> hash of score, normalizedScore and totalPosts
tline:[userid]:follow:user -> id[]
tline:[userid]:follow:user:[uid] -> hash of score, normalizedScore and totalPosts
 */

export type PooledPost = {id:string, score:number, voteData:number, addedOn:number}


export type RawPost = {

}

// export type DiscoverParams = { mode: DiscoveryModes, count: number };
// export type CacheState = {
//     pool: PooledPost[],
//     seen: {[key:string]: boolean},
//     followedSec:[] //normalized:number
//     followedUser:[]
// }
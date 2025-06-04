import { DiscoveryModes } from '../../utils/DiscoveryModes';

export function GET_SESSION_KEY(userId:string){return `tline:${userId}:sessid`}
export function GET_METADATA_KEY(userId:string, postId:string) {return `tline:${userId}:metadata:${postId}`}
export function GET_PER_CATEGORY_KEY(userId:string, postCommunity:string) {return `tline:${userId}:percategory:${postCommunity}`}
export function GET_PER_CACHE_LIMIT_KEY(userId:string, cacheId:DiscoveryModes) {return `tline:${userId}:limit:${cacheId}`}
export function GET_PER_CACHE_SKIP_KEY(userId:string, cacheId:DiscoveryModes) {return `tline:${userId}:skip:${cacheId}`}
export function GET_PRE_CACHE_KEY(userId:string, cacheId:DiscoveryModes) {return `tline:${userId}:precache:${cacheId}`}
export function GET_PRE_CACHE_LOCK_KEY(userId:string, cacheId:DiscoveryModes) {return `tline:${userId}:precachelock:${cacheId}`}
export function GET_FINAL_POOL_KEY(userId:string,) {return `tline:${userId}:finalpool`}

/** The system gets called
 *
 * generator
 *  - generates feed context for user
 *  - - Posts by followed user [cache scores on init]
 *  - - Posts by related user
 *
 *  - - Posts by followed sec [cache scores on init]
 *  - - Posts by related sec
 *  - - Posts by thread [cache scores on init]
 *
 *  - stored in cache as feed object
 *  - child feeds
 *  - populates ~50 posts initially
 *  - as supplier consumes posts, more posts are added to the queye
 *  - manages the cache object
 *
 * supplier
 *  - if no cacheobj then setup generator
 *  - return the next x IDs for user, user then gets content
 *
 */

import {Injectable} from '@nestjs/common';

export type UserRelation = { follows: boolean, muted: boolean, score: number }
export type PostState = { weight: number, seen: boolean, vote: number }

@Injectable()
export class TLineService {
    calculateRelevanceScore(secScore: number, postScore: number,
                            autScore: number, thrScore: number,
                            autRelation: UserRelation,
                            postState: PostState): number {
        //if authRel->muted then negative score
        return 1;
    }

    rankPosts(){
        //data in: raw post data
        //for each post call calculateRelevanceScore; drop -ve posts then calculateTotalSeenWeight
        //put in cache Q in ranked position && update sections cache
    };

    decideMode(){
        //decides what mode to load posts for
    }

    calculateTotalSeenWeight(score:number, seen:number): number{
        return 0
    }

    queryFollowedSectionPosts(){
        //pop x sections from cache
        //query from neo || mock
        //remove cached IDs (seen&pool)

        //rank posts

        //update section[x] data
        //splice section[x] into cache (based on sec score && total seen)
    }

    getCache(){
        //returns current cache
    }
    createCache(){
        //init new object
    }


    //called internally from program and from other internal CHOMP services
    async generateBlock(total:number){
        //adds total posts to the tline pool
        //these should be generated behind the scenes
    }

    //This is a client entry-point
    getBlock(total: number){
        // if(available < total) there should be waiting for posts to become available
        // returns the top total IDs from the pool
    }
}

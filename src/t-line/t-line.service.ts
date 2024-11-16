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
}

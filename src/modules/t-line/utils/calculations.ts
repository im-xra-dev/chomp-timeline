import {PostState, UserRelation} from "./types";
import {InvalidDataError} from '../../../utils/InvalidDataError'

/**TODO
 * TODO  REFACTOR ALL CONSTANTS TO A CONFIG
 * TODO
 */

/**Calculates relevance score for a particular post
 *
 * Relational Score - a score based on the relation between the requesting user and the specified node
 * Personal Score - a score based on an individual node
 *
 * @param secRelationalScore
 * @param postPersonalScore
 * @param authorsPersonalScore
 * @param thrRelationalScore
 * @param autRelation
 * @param postState
 */
export function calculateRelevanceScore(secRelationalScore: number, postPersonalScore: number,
                                        authorsPersonalScore: number, thrRelationalScore: number,
                                        autRelation: UserRelation,
                                        postState: PostState): number {
    //negative scores are rejected
    if (autRelation.muted) return -1;

    //followed authors get a score boost
    const authorRelationalScore = conditionalWeight(autRelation.follows, autRelation.score, 1.25);

    //calculate score
    const score =
        weighted(
            weighted(secRelationalScore, 2)
            + weighted(authorsPersonalScore, 1.5)
            + weighted(authorRelationalScore, 1.5)
            + weighted(thrRelationalScore, 1)
            + weighted(postPersonalScore, 0.5)
            , 0.5
        )
    ;

    //viewed posts are weighted (by how much depends on view context
    if (postState.seen) return score * postState.weight;
    return score;
}

//util function to boost followed members
function conditionalWeight(bool: boolean, score: number, boost: number): number {
    if (bool) return weighted(score, boost);
    return score;
}

//util for simple weighting of values
function weighted(v: number, w: number): number {
    return v * w
}

/**Normalize
 *
 * @param score
 */
export function normalize(score: number): number {
    return Math.atan(score/50);
}

/**Weights scores based on how many times this section has been shown in this session
 *
 * as seen from 0 -> ...
 * weight ranges 1 -> 0.75
 *
 * @param score
 * @param seen
 */
export function calculateTotalSeenWeight(score: number, seen: number): number {
    if (seen < 0) throw new InvalidDataError("seen", seen);

    // desmos code y=\frac{1}{x+4}\ +\ 0.75
    const weight = (1 / (seen + 4)) + 0.75;
    return score * weight;
}

/**Calculate how many section to query to build the data
 *
 * Ideally, show 3 posts per section at a time to make timeline feel diverse
 * If there are too many slots to suit this, then all secs will be shown
 *
 * @param postSlots
 * @param secsAvailable
 */
export function calculateSectionsToQuery(postSlots: number, secsAvailable: number): number {
    if (postSlots <= 0) throw new InvalidDataError("postSlots", postSlots);
    if (secsAvailable <= 0) throw new InvalidDataError("secsAvailable", secsAvailable);

    const ideal = Math.ceil(postSlots / 3);

    if (ideal > secsAvailable) return secsAvailable;
    return ideal;
}
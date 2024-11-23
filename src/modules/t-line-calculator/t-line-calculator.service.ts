import {Injectable} from '@nestjs/common';
import {PostState, UserRelation} from "../t-line/utils/types";
import {InvalidDataError} from "../../utils/InvalidDataError";
import {TLineCalculatorConfigService} from "../../configs/t-line-calculator.config/t-line-calculator.config.service";

@Injectable()
export class TLineCalculatorService {

    constructor(
        private readonly C: TLineCalculatorConfigService
    ) {
    }

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
    calculateRelevanceScore(secRelationalScore: number, postPersonalScore: number,
                            authorsPersonalScore: number, thrRelationalScore: number,
                            autRelation: UserRelation,
                            postState: PostState): number {
        //negative scores are rejected
        if (autRelation.muted) return -1;

        //followed authors get a score boost
        const authorRelationalScore = this.conditionalWeight(autRelation.follows, autRelation.score, this.C.C_FOLLOW_BOOST);

        //calculate score
        const score =
            this.weighted(
                this.weighted(secRelationalScore, this.C.SW_SEC_REL)
                + this.weighted(authorsPersonalScore, this.C.SW_AUTHOR_PER)
                + this.weighted(authorRelationalScore, this.C.SW_AUTHOR_REL)
                + this.weighted(thrRelationalScore, this.C.SW_THREAD_REL)
                + this.weighted(postPersonalScore, this.C.SW_POST_PER)
                , this.C.W_CALCULATED
            )
        ;

        //viewed posts are weighted (by how much depends on view context
        if (postState.seen) return score * postState.weight;
        return score;
    }

    /**Normalize
     *
     * @param score
     */
    normalize(score: number): number {
        return Math.atan(score / this.C.C_ATAN_DIVISOR);
    }

    /**Weights scores based on how many times this section has been shown in this session
     *
     * as seen from 0 -> ...
     * weight ranges 1 -> 0.75
     *
     * @param score
     * @param seen
     */
    calculateTotalSeenWeight(score: number, seen: number): number {
        if (seen < 0) throw new InvalidDataError("seen", seen);
        const weight = this.C.F_SEEN_WEIGHT(seen);
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
    calculateSectionsToQuery(postSlots: number, secsAvailable: number): number {
        if (postSlots <= 0) throw new InvalidDataError("postSlots", postSlots);
        if (secsAvailable <= 0) throw new InvalidDataError("secsAvailable", secsAvailable);

        const ideal = Math.ceil(postSlots / this.C.C_IDEAL_POSTS_PER_SEC);

        return (secsAvailable < ideal) ? secsAvailable : ideal;
    }

    //util function to boost followed members
    conditionalWeight(bool: boolean, score: number, boost: number): number {
        if (bool) return this.weighted(score, boost);
        return score;
    }

    //util for simple weighting of values
    weighted(v: number, w: number): number {
        return v * w
    }
}

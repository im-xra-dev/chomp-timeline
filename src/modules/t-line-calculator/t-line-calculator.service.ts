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

    /**calculateBatchCount
     * https://www.desmos.com/calculator/mglnoluywe
     * https://www.desmos.com/3d/alifqxuuke
     *
     * the time complexity graph for
     * y - total operations
     * x / n - input size
     * c - output size
     * i - batch size
     *
     * with
     * b - batch count = n / i
     *
     * graph of y = b(c+z) {1 <= b <= n} gives total operations at a given b (batch count)
     *   where z = (i(i + 1)) / 2
     *   is equation of the total operations per batch of size {1 <= i <= n}
     * has a min point that lies on y = (n/i) (( (i(i+1)) / 2 ) + c)
     *
     * min point lies on i = sqrt(2c)  for all values of c
     *
     * This simplifies to the 3-D graph of min-points for a given c,n input
     * y = (n/sqrt(2c))(c+((sqrt(2c))((sqrt(2c)) + 1)) / 2)
     **
     * @param inputSize
     * @param outputSize
     */
    calculateBatchCount(inputSize: number, outputSize: number): number {
        if (inputSize <= 0)
            throw new InvalidDataError('calculateBatchCount > inputSize', 'must be > 0')

        if (outputSize <= 0)
            throw new InvalidDataError('calculateBatchCount > outputSize', 'must be > 0')

        //min-point on curve is at idealBatchSize = sqrt(2c) from desmos
        const idealBatchCount = this.C.F_IDEAL_BATCH_COUNT(inputSize, outputSize);
        const batchCount = Math.ceil(idealBatchCount);
        return batchCount;
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

    //util to normalize
    normalize(score: number): number {
        return Math.atan(score / this.C.C_ATAN_DIVISOR);
    }

    //util to boost followed members
    conditionalWeight(bool: boolean, score: number, boost: number): number {
        if (bool) return this.weighted(score, boost);
        return score;
    }

    //util for simple weighting of values
    weighted(v: number, w: number): number {
        return v * w
    }


}

import { Injectable } from '@nestjs/common';
import { strictEqual } from 'assert';
import { CommunityRelation, PostState, UserRelation } from '../../../utils/types';
import { TLineCalculatorConfigService } from '../../../configs/t-line-calculator.config/t-line-calculator.config.service';

@Injectable()
export class Stage2CalculationsService {
    constructor(private readonly config: TLineCalculatorConfigService) {}

    /**Calculate how many section to query to build the data
     *
     * Ideally, show eg 3 posts per section at a time to make timeline feel diverse
     * If there are too many slots to suit this, then all secs will be shown
     *
     * @param postSlots
     * @param secsAvailable
     */
    calculateSectionsToQuery(postSlots: number, secsAvailable: number): number {
        strictEqual(postSlots <= 0, false, 'calculateSectionsToQuery -> postSlots must be > 0');
        strictEqual(
            secsAvailable <= 0,
            false,
            'calculateSectionsToQuery -> secsAvailable must be > 0',
        );

        const ideal = Math.ceil(postSlots / this.config.C_IDEAL_POSTS_PER_SEC);

        return secsAvailable < ideal ? secsAvailable : ideal;
    }

    /**calculate how many batches to optimally run the calculations in
     * https://www.desmos.com/calculator/mglnoluywe
     * https://www.desmos.com/3d/krga16rwe4
     *
     * the time complexity graph for
     * y - total operations
     * x / n - input size
     * c - output size
     * i - batch size
     *
     * with
     * b = batch count = n / i
     *
     * graph of y = b(c+z) {1 <= b <= n} gives total operations at a given b (batch count)
     *   where z = (i(i + 1)) / 2 (big o of the sorting algorithm)
     *   is equation of the total operations per batch of size {1 <= i <= n}
     * has a min point that lies on y = (n/i) (( (i(i+1)) / 2 ) + c)
     *
     * min point lies on i = sqrt(2c)  for all values of c
     *
     * This simplifies to the 3-D graph of min-points for a given c,n input
     * y = (sqrt(2c)+0.5) * n
     **
     * @param inputSize
     * @param outputSize
     */
    calculateBatchCount(inputSize: number, outputSize: number): number {
        strictEqual(inputSize <= 0, false, 'calculateBatchCount -> inputSize must be > 0');
        strictEqual(outputSize <= 0, false, 'calculateBatchCount -> outputSize must be > 0');

        //min-point on curve is at idealBatchSize = sqrt(2c) from desmos
        const idealBatchCount = this.config.F_IDEAL_BATCH_COUNT(inputSize, outputSize);
        return Math.ceil(idealBatchCount);
    }

    /**Calculates relevance score for a particular post
     *
     * Relational Score - a score based on the relation between the requesting user and the specified node
     * Personal Score - a score based on an individual node
     *
     * @param secPersonalScore
     * @param postPersonalScore
     * @param authorsPersonalScore
     * @param thrRelationalScore
     * @param autRelation
     * @param secRelation
     * @param postState
     */
    calculateRelevanceScore(
        secPersonalScore: number,
        postPersonalScore: number,
        authorsPersonalScore: number,
        thrRelationalScore: number,
        autRelation: UserRelation,
        secRelation: CommunityRelation,
        postState: PostState,
    ): number {
        //followed authors get a score boost
        const authorRelationalScore = this.conditionalWeight(
            autRelation.follows,
            autRelation.score,
            this.config.C_FOLLOW_BOOST,
        );

        //followed communities get a follow boost
        const secRelationalScore = this.conditionalWeight(
            secRelation.follows,
            secRelation.score,
            this.config.C_FOLLOW_BOOST,
        );

        //calculate score by weighting all the values. The weights should be tweaked according to A/B testing
        const score = this.weighted(
            this.weighted(secRelationalScore, this.config.SW_SEC_REL) +
                this.weighted(secPersonalScore, this.config.SW_SEC_PER) +
                this.weighted(authorsPersonalScore, this.config.SW_AUTHOR_PER) +
                this.weighted(authorRelationalScore, this.config.SW_AUTHOR_REL) +
                this.weighted(thrRelationalScore, this.config.SW_THREAD_REL) +
                this.weighted(postPersonalScore, this.config.SW_POST_PER),
            this.config.W_CALCULATED,
        );
        //viewed posts are weighted (by how much depends on view context)
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
        strictEqual(seen < 0, false, 'calculateTotalSeenWeight -> seen must be > 0');

        const weight = this.config.F_SEEN_WEIGHT(seen);
        return score * weight;
    }

    //util to normalize
    normalize(score: number): number {
        return Math.atan(score / this.config.C_ATAN_DIVISOR);
    }

    //util to boost followed members
    conditionalWeight(bool: boolean, score: number, boost: number): number {
        if (bool) return this.weighted(score, boost);
        return score;
    }

    //util for simple weighting of values
    weighted(v: number, w: number): number {
        return v * w;
    }
}

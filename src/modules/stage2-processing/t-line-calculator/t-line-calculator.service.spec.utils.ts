//functions to handle object defaults

import { CommunityRelation, PostState, UserRelation } from '../../../utils/types';
import { TLineCalculatorService } from './t-line-calculator.service';

/**test utility to provide default values for the attributes not being tested
 *
 * @param follows
 * @param muted
 * @param score
 */
export function getAuthorRelation({
    follows = false,
    muted = false,
    score = 10,
}: {
    follows?: boolean;
    muted?: boolean;
    score?: number;
}): UserRelation {
    return { follows, muted, score };
}

/**test utility to provide default values for the attributes not being tested
 *
 * @param follows
 * @param muted
 * @param score
 */
export function getCommunityRelation({
    follows = false,
    muted = false,
    score = 10,
}: {
    follows?: boolean;
    muted?: boolean;
    score?: number;
}): CommunityRelation {
    return { follows, muted, score };
}

/**test utility to provide default values for the attributes not being tested
 *
 * @param seen
 * @param weight
 * @param vote
 * @param sess
 */
export function getPostState({
    seen = false,
    weight = 1,
    vote = 0,
    sess = "sess",
}: {
    seen?: boolean;
    weight?: number;
    vote?: number;
    sess?: string;
}): PostState {
    return { seen, weight, vote, sess };
}

/**test utility to provide default values for the attributes not being tested
 *
 * This function runs test on the relevance score module
 *
 * @param service
 * @param secScore
 * @param postScore
 * @param autScore
 * @param thrScore
 * @param autRelation
 * @param secRelation
 * @param postState
 */
export function relevanceTest(
    service: TLineCalculatorService,
    {
        secScore = 10,
        postScore = 10,
        autScore = 10,
        thrScore = 10,
        autRelation = getAuthorRelation({}),
        secRelation = getCommunityRelation({}),
        postState = getPostState({}),
    }: {
        secScore?: number;
        postScore?: number;
        autScore?: number;
        thrScore?: number;
        autRelation?: UserRelation;
        secRelation?: CommunityRelation;
        postState?: PostState;
    },
): number {
    return service.calculateRelevanceScore(
        secScore,
        postScore,
        autScore,
        thrScore,
        autRelation,
        secRelation,
        postState,
    );
}

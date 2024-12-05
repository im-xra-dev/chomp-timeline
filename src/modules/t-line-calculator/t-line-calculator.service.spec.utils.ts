//functions to handle object defaults

import {PostState, UserRelation} from "../../utils/types";
import {TLineCalculatorService} from '../t-line-calculator/t-line-calculator.service';

/**test utility to provide default values for the attributes not being tested
 *
 * @param follows
 * @param muted
 * @param score
 */
export function getAuthorRelation(
    {
        follows = false,
        muted = false,
        score = 10
    }:
        {
            follows?: boolean,
            muted?: boolean,
            score?: number
        }): UserRelation {
    return {follows, muted, score};
}

/**test utility to provide default values for the attributes not being tested
 *
 * @param seen
 * @param weight
 * @param vote
 */
export function getPostState(
    {
        seen = false,
        weight = 1,
        vote = 0
    }:
        {
            seen?: boolean,
            weight?: number,
            vote?: number
        }): PostState {
    return {seen, weight, vote};
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
 * @param postState
 */
export function relevanceTest(
    service: TLineCalculatorService,
    {
        secScore = 10, postScore = 10,
        autScore = 10, thrScore = 10,
        autRelation = getAuthorRelation({}),
        postState = getPostState({})
    }:
        {
            secScore?: number, postScore?: number,
            autScore?: number, thrScore?: number,
            autRelation?: UserRelation,
            postState?: PostState
        }): number {
    return service.calculateRelevanceScore(
        secScore, postScore, autScore, thrScore, autRelation, postState
    );
}
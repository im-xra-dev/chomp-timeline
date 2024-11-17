import {describe, expect, it} from '@jest/globals';
import {PostState, UserRelation} from "../types";
import {InvalidDataError} from './InvalidDataError'
import {calculateRelevanceScore, calculateSectionsToQuery, calculateTotalSeenWeight} from './calculations'

describe('timeline calculations', () => {
    describe('calculate relevance score', () => {
        it("should calculate relevance as negative because the author is muted", () => {
            const mutedUser: UserRelation = getAuthorRelation({muted: true});
            const score = relevanceTest({autRelation: mutedUser});

            expect(score).toBeLessThan(0);
        })

        it("should calculate relevance higher if follow=true (based on rel score)", () => {
            const followedUser: UserRelation = getAuthorRelation({follows: true});
            const testScore = relevanceTest({autRelation: followedUser});
            const baseScore = relevanceTest({});

            expect(testScore).toBeGreaterThan(baseScore);
        })

        it("should calculate relevance higher if autUsers' score is higher", () => {
            const scoredUser: UserRelation = getAuthorRelation({score: 20});
            const testScore = relevanceTest({autRelation: scoredUser});
            const baseScore = relevanceTest({});

            expect(testScore).toBeGreaterThan(baseScore);
        })

        it("should calculate relevance*weight for seen=true", () => {
            const weight = 0.5;
            const postState: PostState = getPostState({seen: true, weight});
            const testScore = relevanceTest({postState});
            const baseScore = relevanceTest({});

            expect(testScore).toBe(baseScore * weight)
        })

        it("should calculate relevance higher for author users with higher score", () => {
            const testScore = relevanceTest({autScore: 50});
            const baseScore = relevanceTest({});

            expect(testScore).toBeGreaterThan(baseScore);
        })

        it("should calculate relevance higher for secs with higher score", () => {
            const testScore = relevanceTest({secScore: 50});
            const baseScore = relevanceTest({});

            expect(testScore).toBeGreaterThan(baseScore);
        })

        it("should calculate relevance higher for posts with higher score", () => {
            const testScore = relevanceTest({postScore: 50});
            const baseScore = relevanceTest({});

            expect(testScore).toBeGreaterThan(baseScore);
        })

        it("should calculate relevance higher for threads with higher score", () => {
            const testScore = relevanceTest({thrScore: 50});
            const baseScore = relevanceTest({});

            expect(testScore).toBeGreaterThan(baseScore);
        })
    });
    //------------------------------------------------------------\\
    describe('calculate total seen weight', () => {
        it("should weight posts lower if more from this category have already been shown", () => {
            const score = 100;
            const seen = 0;
            const moreSeen = calculateTotalSeenWeight(score, seen + 1);
            const lessSeen = calculateTotalSeenWeight(score, seen);

            expect(moreSeen).toBeLessThan(lessSeen);
        })

        it("should weight posts lower if seen is the same and but score is lower", () => {
            const score = 100;
            const seen = 10;
            const highScore = calculateTotalSeenWeight(score, seen);
            const lowScore = calculateTotalSeenWeight(score - 1, seen);

            expect(highScore).toBeGreaterThan(lowScore);
        })

        it("should throw an error if invalid data (-ve seen) is provided", () => {
            const call = () => {
                calculateTotalSeenWeight(10, -1)
            };
            expect(call).toThrow(InvalidDataError);
        })

    })
    //------------------------------------------------------------\\
    describe('calculate total sections to query', () => {
        it("should return 1 section per 3 slots", () => {
            const oneSlot = calculateSectionsToQuery(1, 10);
            const threeSlot = calculateSectionsToQuery(3, 10);
            const fourSlot = calculateSectionsToQuery(4, 10);

            expect(oneSlot).toBe(1);
            expect(threeSlot).toBe(1);
            expect(fourSlot).toBe(2);
        })

        it("should return total sections available if calculation is too high", () => {
            const totalAvailableSections = 1;
            const moreThanThreeSlotsPerSection = calculateSectionsToQuery(totalAvailableSections * 5, totalAvailableSections);

            expect(moreThanThreeSlotsPerSection).toBe(totalAvailableSections);
        })

        it("should throw an error if invalid data (slots) is provided", () => {
            const call = () => {
                calculateSectionsToQuery(0, 1)
            };
            expect(call).toThrow(InvalidDataError);
        })

        it("should throw an error if invalid data (available) is provided", () => {
            const call = () => {
                calculateSectionsToQuery(1, 0)
            };
            expect(call).toThrow(InvalidDataError);
        })
    })
});

//functions to handle object defaults

function getAuthorRelation({
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

function getPostState({
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

function relevanceTest({
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
    return calculateRelevanceScore(
        secScore, postScore, autScore, thrScore, autRelation, postState
    );
}

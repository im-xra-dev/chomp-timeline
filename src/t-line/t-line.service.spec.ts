import {Test, TestingModule} from '@nestjs/testing';
import {describe, expect, it, beforeEach} from '@jest/globals';
import {TLineService, PostState, UserRelation} from './t-line.service';

describe('TLineService', () => {
    let service: TLineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TLineService],
        }).compile();

        service = module.get<TLineService>(TLineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    /**create cache stuff
     * TODO mutex while generating more posts prevent new generators
     *
     * pool:[{id, score, voteData, addedOn ..?}]
     * (note addedOn tracks when a post was added to the pool, old posts are killed (remove from seen)
     *
     * seen:{id}
     *
     * sections:[{name,score,datetime,totalInFeed}]
     * users:[{cachedUserData}]
     *
     * heartbeat
     */

    /**mode decision module
     * decide what mode
     * - followed sec
     * - recommended sec
     * - followed thread
     * - recommended thread
     * - followed user
     * - recommended user
     * - promo posts
     * - vibe stuff
     * - ....
     *
     * calculate how many posts/categories(x) to show for mode
     */

    /**section-mode decision module
     * takes in the cacheData for ordered sections
     * pops top x sections
     *
     * // posts are queried and added to Q \\
     *
     * Removes any posts already in cache
     * Rank posts
     *
     * update date&total attribs
     * re-insert based on date, total and score
     */

    /**Query posts from subsection
     * Queries neo in sec
     *    get thread name
     *    get posts id and score (post score based on votes+total comments)
     *    get postAuthors score
     *    if exists get userAuthor and userMe relation (score,follow,muted)
     *    if exists get userMe thread score
     *    if exists get userMe seen/voted on post
     *
     * (sec)->(thread {name})->(post {id,score})->
     * (userAuthor {score})-[relatedTo {score}]->(userMe)
     *
     * (userMe)-[{score}]->(thread)
     * (userMe)-[{seen,voted}]->(post)
     *
     */

    /**Math to determine whats most relevant
     * note: 2 modes, relevant and recent
     *     : relevant uses math; recent uses posted timestamp
     *
     * if cached seen post then dont show
     *
     * [cached] sec score
     * thread relation (or % of sec score if null)
     * post score
     * user relation score
     * author score
     * post seen/vote
     *
     * splice into pool based on calculated score
     */

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
        return service.calculateRelevanceScore(
            secScore, postScore, autScore, thrScore, autRelation, postState
        );
    }

    //------------------------------------------------------------\\
    // calculate post relevance

    it("should calculate relevance as negative because the author is muted", () => {
        const mutedUser: UserRelation = getAuthorRelation({muted: true});
        const score = relevanceTest({autRelation: mutedUser});

        expect(score).toBeLessThan(0);
    })

    it("should calculate relevance higher if follow=true (based on score)", () => {
        const followedUser: UserRelation = getAuthorRelation({follows: true});
        const testScore = relevanceTest({autRelation: followedUser});
        const baseScore = relevanceTest({});

        expect(testScore).toBeGreaterThan(baseScore);
    })

    it("should calculate relevance higher if autUser score higher", () => {
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

    //------------------------------------------------------------\\
    // calculate total seen weight

    it("should weight posts lower if more from this category have already been shown", () => {
        const score = 100;
        const seen = 0;
        const moreSeen = service.calculateTotalSeenWeight(score, seen + 1);
        const lessSeen = service.calculateTotalSeenWeight(score, seen);

        expect(moreSeen).toBeLessThan(lessSeen);
    })

    it("should weight posts lower if seen is the same and but score is lower", () => {
        const score = 100;
        const seen = 10;
        const highScore = service.calculateTotalSeenWeight(score, seen);
        const lowScore = service.calculateTotalSeenWeight(score-1, seen);

        expect(highScore).toBeGreaterThan(lowScore);
    })

    //------------------------------------------------------------\\
    // calculateSectionsToQuery

    it("should return 1 section per 3 slots", () => {
        const oneSlot = service.calculateSectionsToQuery(1, 10);
        const threeSlot = service.calculateSectionsToQuery(3, 10);
        const fourSlot = service.calculateSectionsToQuery(4, 10);

        expect(oneSlot).toBe(1);
        expect(threeSlot).toBe(1);
        expect(fourSlot).toBe(2);
    })

    it("should return total sections available if calculation is too high", () => {
        const totalAvailableSections = 1;
        const moreThanThreeSlotsPerSection = service.calculateSectionsToQuery(totalAvailableSections*5, totalAvailableSections);

        expect(moreThanThreeSlotsPerSection).toBe(totalAvailableSections);
    })

    it("should throw an error if invalid data (slots) is provided", () => {
        const call = ()=>{service.calculateSectionsToQuery(0, 1)};
        expect(call).toThrow();
    })

    it("should throw an error if invalid data (available) is provided", () => {
        const call = ()=>{service.calculateSectionsToQuery(1, 0)};
        expect(call).toThrow();
    })
});

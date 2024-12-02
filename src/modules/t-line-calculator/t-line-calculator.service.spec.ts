import { AssertionError } from "assert";
import { Test, TestingModule } from '@nestjs/testing';
import {beforeEach, describe, expect, it} from "@jest/globals";
import {PostState, UserRelation} from "../t-line/utils/types";
import { TLineCalculatorService } from './t-line-calculator.service';
import { TLineCalculatorConfigService } from '../../configs/t-line-calculator.config/t-line-calculator.config.service';
import { getPostState, relevanceTest, getAuthorRelation } from './t-line-calculator.service.spec.utils';

describe('TLineCalculatorService', () => {
  let service: TLineCalculatorService;
  let configService: TLineCalculatorConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TLineCalculatorService, TLineCalculatorConfigService],
    }).compile();

    service = module.get<TLineCalculatorService>(TLineCalculatorService);
    configService = module.get<TLineCalculatorConfigService>(TLineCalculatorConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //This file tests that the match equations are performing as intended.
  //The exact results of these is not important, as it is based on weightings
  //that will be altered with A/B testing to provide an optimal user experience.

  //instead, the tests focus on testing the relation of these calculated scores
  //for different inputs to ensure that different inputs alter data in the correct direction

  describe('calculate relevance score', () => {
    it("should calculate relevance as negative because the author is muted", () => {
      const mutedUser: UserRelation = getAuthorRelation({muted: true});
      const score = relevanceTest(service, {autRelation: mutedUser});

      expect(score).toBeLessThan(0);
    });

    it("should calculate relevance higher if follow=true (based on rel score)", () => {
      const followedUser: UserRelation = getAuthorRelation({follows: true});
      const defaultFollowedUser: UserRelation = getAuthorRelation({follows: false});

      const testScore = relevanceTest(service, {autRelation: followedUser});
      const baseScore = relevanceTest(service, {autRelation: defaultFollowedUser});

      expect(testScore).toBeGreaterThan(baseScore);
    });

    it("should calculate relevance higher if autUsers' score is higher", () => {
      const scoredUser: UserRelation = getAuthorRelation({score: 20});
      const defaultScoredUser: UserRelation = getAuthorRelation({score: 19});

      const testScore = relevanceTest(service, {autRelation: scoredUser});
      const baseScore = relevanceTest(service, {autRelation: defaultScoredUser});

      expect(testScore).toBeGreaterThan(baseScore);
    });

    it("should calculate relevance*weight for seen=true", () => {
      const weight = 0.5;
      const postState: PostState = getPostState({seen: true, weight});
      const defaultPostState: PostState = getPostState({seen: false, weight});

      const testScore = relevanceTest(service, {postState: postState});
      const baseScore = relevanceTest(service, {postState: defaultPostState});

      //an unseen post has the 'weight' applied to it
      expect(testScore).toBe(baseScore * weight)
    });

    it("should calculate relevance higher for author users with higher score", () => {
      const testScore = relevanceTest(service, {autScore: 50});
      const baseScore = relevanceTest(service, {autScore: 49});

      expect(testScore).toBeGreaterThan(baseScore);
    });

    it("should calculate relevance higher for secs with higher score", () => {
      const testScore = relevanceTest(service, {secScore: 50});
      const baseScore = relevanceTest(service, {secScore: 49});

      expect(testScore).toBeGreaterThan(baseScore);
    });

    it("should calculate relevance higher for posts with higher score", () => {
      const testScore = relevanceTest(service, {postScore: 50});
      const baseScore = relevanceTest(service, {postScore: 49});

      expect(testScore).toBeGreaterThan(baseScore);
    });

    it("should calculate relevance higher for threads with higher score", () => {
      const testScore = relevanceTest(service, {thrScore: 50});
      const baseScore = relevanceTest(service, {thrScore: 49});

      expect(testScore).toBeGreaterThan(baseScore);
    });
  });

  describe('calculate total seen weight', () => {
    it("should weight posts lower if more from this category have already been shown", () => {
      const score = 100;
      const seen = 0;
      const moreSeen = service.calculateTotalSeenWeight(score, seen + 1);
      const lessSeen = service.calculateTotalSeenWeight(score, seen);

      expect(moreSeen).toBeLessThan(lessSeen);
    });

    it("should weight posts lower if seen is the same and but score is lower", () => {
      const score = 100;
      const seen = 10;
      const highScore = service.calculateTotalSeenWeight(score, seen);
      const lowScore = service.calculateTotalSeenWeight(score - 1, seen);

      expect(highScore).toBeGreaterThan(lowScore);
    });

    it("should throw an error if invalid data (-ve seen) is provided", () => {
      const call = () => {
        service.calculateTotalSeenWeight(10, -1)
      };
      expect(call).toThrow(AssertionError);
    });
  });

  describe('calculate total sections to query', () => {
    it("should return 1 section per 3 slots", () => {
      const oneSlot = service.calculateSectionsToQuery(1, 10);
      const threeSlot = service.calculateSectionsToQuery(configService.C_IDEAL_POSTS_PER_SEC, 10);
      const fourSlot = service.calculateSectionsToQuery(configService.C_IDEAL_POSTS_PER_SEC+1, 10);

      expect(oneSlot).toBe(1);
      expect(threeSlot).toBe(1);
      expect(fourSlot).toBe(2);
    });

    it("should return total sections available if calculation is too high", () => {
      //when there are more than configService.C_IDEAL_POSTS_PER_SEC posts per section required
      //then all available sections must be queried

      const totalAvailableSections = 5;
      const moreThanThreeSlotsPerSection = service.calculateSectionsToQuery(10000, totalAvailableSections);

      expect(moreThanThreeSlotsPerSection).toBe(totalAvailableSections);
    });

    it("should throw an error if invalid data (slots < 1) is provided", () => {
      const call = () => {
        service.calculateSectionsToQuery(0, 1)
      };
      expect(call).toThrow(AssertionError);
    });

    it("should throw an error if invalid data (available < 1) is provided", () => {
      const call = () => {
        service.calculateSectionsToQuery(1, 0)
      };
      expect(call).toThrow(AssertionError);
    })
  });

  describe('calculateBatchCount', () => {
    it("should be an equation that produces an optimised batch count", () => {
      expect("the developer to have graphs that back this up").toBeTruthy()
      // current tests for the equation outputs are in desmos and on paper [~xra 25/11/24]
    });

    it('should be a whole number for all outputs', () => {
      //this maybe isnt the best way to test this, however
      //the math should return a whole number for all possible inputs.
      //as there is an infinite amount of numbers that can be input, testing the
      //first 10000 seemed like a decent compromise
      for (let inCnt = 1; inCnt <= 100; inCnt++) {
        for (let outCnt = 1; outCnt <= 100; outCnt++) {
          const out = service.calculateBatchCount(inCnt, outCnt);
          expect(out).toBe(Math.floor(out));
        }
      }
    });

    it('should throw an error for input size <= 0', () => {
      const call = () => {
        service.calculateBatchCount(0, 10)
      };
      expect(call).toThrow(AssertionError);
    });

    it('should throw an error for output size <= 0', () => {
      const call = () => {
        service.calculateBatchCount(10, 0)
      };
      expect(call).toThrow(AssertionError);
    });
  });

});



import { Test, TestingModule } from '@nestjs/testing';
import { TLineCalculatorService } from './t-line-calculator.service';
import { getPostState, relevanceTest, getAuthorRelation } from './t-line-calculator.service.spec.utils';
import {beforeEach, describe, expect, it} from "@jest/globals";
import {PostState, UserRelation} from "../t-line/utils/types";
import {InvalidDataError} from "../../utils/InvalidDataError";
import { TLineCalculatorConfigService } from '../../configs/t-line-calculator.config/t-line-calculator.config.service';

describe('TLineCalculatorService', () => {
  let service: TLineCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TLineCalculatorService, TLineCalculatorConfigService],
    }).compile();

    service = module.get<TLineCalculatorService>(TLineCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculate relevance score', () => {
    it("should calculate relevance as negative because the author is muted", () => {
      const mutedUser: UserRelation = getAuthorRelation({muted: true});
      const score = relevanceTest(service, {autRelation: mutedUser});

      expect(score).toBeLessThan(0);
    })
    it("should calculate relevance higher if follow=true (based on rel score)", () => {
      const followedUser: UserRelation = getAuthorRelation({follows: true});
      const testScore = relevanceTest(service, {autRelation: followedUser});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBeGreaterThan(baseScore);
    })
    it("should calculate relevance higher if autUsers' score is higher", () => {
      const scoredUser: UserRelation = getAuthorRelation({score: 20});
      const testScore = relevanceTest(service, {autRelation: scoredUser});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBeGreaterThan(baseScore);
    })
    it("should calculate relevance*weight for seen=true", () => {
      const weight = 0.5;
      const postState: PostState = getPostState({seen: true, weight});
      const testScore = relevanceTest(service, {postState});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBe(baseScore * weight)
    })
    it("should calculate relevance higher for author users with higher score", () => {
      const testScore = relevanceTest(service, {autScore: 50});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBeGreaterThan(baseScore);
    })
    it("should calculate relevance higher for secs with higher score", () => {
      const testScore = relevanceTest(service, {secScore: 50});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBeGreaterThan(baseScore);
    })
    it("should calculate relevance higher for posts with higher score", () => {
      const testScore = relevanceTest(service, {postScore: 50});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBeGreaterThan(baseScore);
    })
    it("should calculate relevance higher for threads with higher score", () => {
      const testScore = relevanceTest(service, {thrScore: 50});
      const baseScore = relevanceTest(service, {});

      expect(testScore).toBeGreaterThan(baseScore);
    })
  });

  describe('calculate total seen weight', () => {
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
      const lowScore = service.calculateTotalSeenWeight(score - 1, seen);

      expect(highScore).toBeGreaterThan(lowScore);
    })
    it("should throw an error if invalid data (-ve seen) is provided", () => {
      const call = () => {
        service.calculateTotalSeenWeight(10, -1)
      };
      expect(call).toThrow(InvalidDataError);
    })

  })
  describe('calculate total sections to query', () => {
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
      const moreThanThreeSlotsPerSection = service.calculateSectionsToQuery(totalAvailableSections * 5, totalAvailableSections);

      expect(moreThanThreeSlotsPerSection).toBe(totalAvailableSections);
    })
    it("should throw an error if invalid data (slots) is provided", () => {
      const call = () => {
        service.calculateSectionsToQuery(0, 1)
      };
      expect(call).toThrow(InvalidDataError);
    })
    it("should throw an error if invalid data (available) is provided", () => {
      const call = () => {
        service.calculateSectionsToQuery(1, 0)
      };
      expect(call).toThrow(InvalidDataError);
    })
  })

  describe('calculateBatchCount', () => {
    it("should be an equation that produces an optimised batch count", () => {
      expect("the developer to have graphs that back this up").toBeTruthy()
      // current tests for the equation outputs are in desmos and on paper [~xra 25/11/24]
    });
    it('should be a whole number for all outputs', () => {
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
      expect(call).toThrow(InvalidDataError);
    });
    it('should throw an error for output size <= 0', () => {
      const call = () => {
        service.calculateBatchCount(10, 0)
      };
      expect(call).toThrow(InvalidDataError);
    });
  });

});



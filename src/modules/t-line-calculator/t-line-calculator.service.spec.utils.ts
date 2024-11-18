//functions to handle object defaults

import {PostState, UserRelation} from "../t-line/utils/types";
import { TLineCalculatorService } from '../t-line-calculator/t-line-calculator.service';

export function getAuthorRelation({
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

export function getPostState({
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

export function relevanceTest(service:TLineCalculatorService, {
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
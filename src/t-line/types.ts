import {DiscoveryModes} from "./DiscoveryModes";

export type UserRelation = { follows: boolean, muted: boolean, score: number }
export type PostState = { weight: number, seen: boolean, vote: number }

export type DiscoverParams = { mode: DiscoveryModes, count: number };

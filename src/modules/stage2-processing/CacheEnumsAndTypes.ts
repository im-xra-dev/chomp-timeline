export enum LookupEnum {
    POST,
    COMMUNITY_SEEN_COUNT,
}

export type Stage2CacheData = {
    sessId: string;
    cachedPosts: {
        string?: boolean;
    };
    perCommunitySeenPost: {
        string?: number;
    };
};

export type LookupData = {
    type: LookupEnum;
    value: string;
};

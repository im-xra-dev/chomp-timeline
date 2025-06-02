export enum LookupEnum {
    POST,
    COMMUNITY_SEEN_COUNT,
}

export type Stage2CacheData = {
    sessId: string;
    cachedPosts: {
        [key: string]: boolean;
    };
    perCommunitySeenPost: {
        [key: string]: number;
    };
};

export type LookupData = {
    type: LookupEnum;
    value: string;
};

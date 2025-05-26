import { Injectable } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { RawPost } from '../../../utils/types';
import { strictEqual } from 'assert';

export type Stage2CacheData = {
    sessId: string;
    cachedPosts: {
        string?: boolean;
    };
    perCommunitySeenPost: {
        string?: number;
    };
};

export enum LookupEnum {
    POST,
    COMMUNITY_SEEN_COUNT,
}

export type LookupData = {
    type: LookupEnum;
    value: string;
};

@Injectable()
export class Stage2CacheManagementService {
    constructor(private readonly cacherService: RedisCacheDriverService) {}

    async getCachedData(userId: string, batch: readonly RawPost[]): Promise<Stage2CacheData> {
        strictEqual(batch.length > 0, true, 'stage2cacheManagementService -> batch size must be > 0');
        strictEqual(userId === null, false, 'stage2cacheManagementService -> userId must be provided');

        //init vars
        const prefix = `tline:${userId}:`;
        const communityNames: { [key: string]: boolean } = {};
        const lookup: LookupData[] = [];

        //init client and builder
        const client = await this.cacherService.getClient();
        const builder = client.multi();

        //add the data to the query
        builder.get(`${prefix}sessid`);

        for (let i = 0; i < batch.length; i++) {
            const postCommunity = batch[i].sec;
            const postId = batch[i].id;

            //if a community has not been added yet, add it to the query
            if (!communityNames[postCommunity]) {
                communityNames[postCommunity] = true;
                builder.get(`${prefix}percategory:${postCommunity}`);
                lookup.push({ type: LookupEnum.COMMUNITY_SEEN_COUNT, value: postCommunity });
            }

            //add this post to the query
            builder.hGet(`${prefix}metadata:${postId}`, 'score');
            lookup.push({ type: LookupEnum.POST, value: postId });
        }

        //run query and return the sorted data
        return this.sortData(lookup, await builder.exec());
    }

    private sortData(lookup: LookupData[], data: unknown[]): Stage2CacheData {
        //initialize the output data
        const output: Stage2CacheData = {
            sessId: data.shift() as string,
            cachedPosts: {},
            perCommunitySeenPost: {},
        };

        //parses the list of data returned from redis into an appropriate format
        for (let i = 0; i < lookup.length; i++) {
            const returnedValue = data.shift();

            //for community seen counts, convert to a number, default to 0 for null values
            if (lookup[i].type === LookupEnum.COMMUNITY_SEEN_COUNT)
                output.perCommunitySeenPost[lookup[i].value] =
                    returnedValue === null ? 0 : Number(returnedValue);

            //for posts, if there is a returned value, set the flag to true
            //if no value is returned, then save memory by not storing anything
            if (lookup[i].type === LookupEnum.POST && returnedValue !== null)
                output.cachedPosts[lookup[i].value] = true;
        }

        return output;
    }
}

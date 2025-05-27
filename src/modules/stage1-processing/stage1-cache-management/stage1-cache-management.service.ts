import { Injectable } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { QueryJobListing } from '../../../utils/types';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { GET_PER_CACHE_LIMIT_KEY, GET_PER_CACHE_SKIP_KEY } from '../../../configs/cache-keys/keys';
import { defaults } from '../../../configs/pre-cache-configuration/defaults';

export type ParsedQueryConfiguration = {
    [key: number]: { skip: number; limit: number };
};

type UninitializedData = { mode: number; limit: number; skip: number }[]

@Injectable()
export class Stage1CacheManagementService {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    /**getCacheData
     * gets the data from the cache that is used
     *
     * @param job
     */
    async getCacheData(job: QueryJobListing): Promise<ParsedQueryConfiguration> {
        //if the query limit is specified in the job, use that
        if (job.query !== undefined) return this.formatFromJob(job);

        //query the cached values for the required pre-cache modes
        const cachedValues = await this.queryData(job.userid, job.modes);

        //format the returned data
        return await this.formatFromQuery(job.userid, job.modes, cachedValues);
    }

    private async queryData(userId: string, modes: DiscoveryModes[]): Promise<unknown[]> {
        //initialilze the query client
        const client = await this.cacheService.getClient();
        const builder = client.multi();

        //get the limit and skip for each mode
        for (let i = 0; i < modes.length; i++) {
            const mode = modes[i];
            builder.get(GET_PER_CACHE_LIMIT_KEY(userId, mode));
            builder.get(GET_PER_CACHE_SKIP_KEY(userId, mode));
        }

        //run the query
        return await builder.exec();
    }

    private async writeData(userId: string, inputData: UninitializedData) {
        //initialilze the query client
        const client = await this.cacheService.getClient();
        const builder = client.multi();

        //set the limit and skip for each mode
        for (let i = 0; i < inputData.length; i++) {
            const singleMode = inputData[i];
            builder.set(GET_PER_CACHE_LIMIT_KEY(userId, singleMode.mode), singleMode.limit);
            builder.set(GET_PER_CACHE_SKIP_KEY(userId, singleMode.mode), singleMode.skip);
        }

        //run the query
        return await builder.exec();
    }

    private async formatFromQuery(
        userId: string,
        modes: DiscoveryModes[],
        data: unknown[],
    ): Promise<ParsedQueryConfiguration> {
        //init vars
        const output: ParsedQueryConfiguration = {};
        const unInitialized: UninitializedData = [];

        //sort each pre-cache modes results into the parsed output
        for (let i = 0; i < modes.length*2; i+=2) {
            const mode = modes[i/2];

            //if one of the values is null then we shall (re)initialize them both to the defaults
            if (data[i] === null || data[i + 1] === null) {
                const limit = defaults[mode].limit;
                const skip = defaults[mode].skip;
                output[mode] = { limit, skip };
                //queue for update in redis
                unInitialized.push({ mode, limit, skip });
            } else {
                //the data was available in the cache
                output[mode] = {
                    limit: data[i] as number,
                    skip: data[i + 1] as number,
                };
            }
        }

        //if data must be initialized, write it to the instance
        if(unInitialized.length !== 0) await this.writeData(userId, unInitialized);

        return output;
    }

    private formatFromJob(job: QueryJobListing): ParsedQueryConfiguration {
        //init vars
        const output: ParsedQueryConfiguration = {};

        //set the jobs configured value for each discovery mode
        for (let i = 0; i < job.modes.length; i++) {
            const mode = job.modes[i];
            output[mode] = {limit: job.query, skip: 0};
        }

        return output;
    }
}

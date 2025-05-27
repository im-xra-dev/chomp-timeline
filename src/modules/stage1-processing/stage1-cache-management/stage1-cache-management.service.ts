import { Injectable } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';
import { QueryJobListing } from '../../../utils/types';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';

export type ParsedQueryConfiguration = {
    [key: number]: { skip: number; limit: number };
};

@Injectable()
export class Stage1CacheManagementService {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    /**getCacheData
     * gets the data from the cache that is used
     *
     * @param job
     */
    async getCacheData(job: QueryJobListing): Promise<ParsedQueryConfiguration> {
        return {};
    }

    private queryData(modes: DiscoveryModes[]) {
        return {};
    }

    private writeData(modes: DiscoveryModes[]) {
        return {};
    }

    private formatFromQuery(modes: DiscoveryModes[], data: unknown[]): ParsedQueryConfiguration {
        return {};
    }

    private formatFromJob(job: QueryJobListing): ParsedQueryConfiguration {
        return {};
    }
}

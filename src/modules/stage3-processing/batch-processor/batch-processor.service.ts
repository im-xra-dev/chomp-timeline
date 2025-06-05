import { Injectable } from '@nestjs/common';
import { ConcurrentBatch } from '../../../utils/types';
import { DiscoveryModes } from '../../../utils/DiscoveryModes';
import { AquireMutexService } from '../../redis/aquire-mutex/aquire-mutex.service';
import { SortDataService } from '../sort-data/sort-data.service';
import { MetadataManagementService } from '../metadata-management/metadata-management.service';
import { Stage3CacheManagementService } from '../stage3-cache-management/stage3-cache-management.service';

@Injectable()
export class BatchProcessorService {
    constructor(
        private readonly lockService: AquireMutexService,
        private readonly sortDataService: SortDataService,
        private readonly metadataService: MetadataManagementService,
        private readonly stage3CacheServiceService: Stage3CacheManagementService,
    ) {}

    async processBatches(
        userId: string,
        mode: DiscoveryModes,
        batchRunners: readonly ConcurrentBatch[],
        jobCacheOverride?: number,
    ): Promise<void> {

    }
}

import { Module } from '@nestjs/common';
import { BatchProcessorService } from './batch-processor.service';
import { AquireMutexModule } from '../../redis/aquire-mutex/aquire-mutex.module';
import { SortDataModule } from '../sort-data/sort-data.module';
import { MetadataManagementModule } from '../metadata-management/metadata-management.module';
import { Stage3CacheManagementModule } from '../stage3-cache-management/stage3-cache-management.module';

@Module({
    providers: [BatchProcessorService],
    exports: [BatchProcessorService],
    imports: [
        AquireMutexModule,
        SortDataModule,
        MetadataManagementModule,
        Stage3CacheManagementModule,
    ],
})
export class BatchProcessorModule {}

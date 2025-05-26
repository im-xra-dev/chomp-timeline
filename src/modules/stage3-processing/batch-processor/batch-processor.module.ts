import { Module } from '@nestjs/common';
import { BatchProcessorService } from './batch-processor.service';

@Module({
    providers: [BatchProcessorService],
    exports: [BatchProcessorService],
    imports: [],
})
export class BatchProcessorModule {}

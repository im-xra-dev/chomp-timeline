import { Module } from '@nestjs/common';
import { BatchCalculatorService } from '../batch-calculator/batch-calculator.service';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';

@Module({
    providers: [BatchCalculatorService],
    exports: [BatchCalculatorService],
    imports: [TlineCacherModule],
})
export class BatchProcessorModule {}

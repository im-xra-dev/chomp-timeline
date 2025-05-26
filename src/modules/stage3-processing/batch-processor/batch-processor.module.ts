import { Module } from '@nestjs/common';
import { BatchCalculatorService } from '../../stage2-processing/batch-calculator/batch-calculator.service';
import { TlineCacherModule } from '../../tline-cacher/tline-cacher.module';
import { Stage2CalculationsModule } from '../../stage2-processing/stage2-calculations/stage2-calculations.module';

@Module({
    providers: [BatchCalculatorService],
    exports: [BatchCalculatorService],
    imports: [TlineCacherModule, Stage2CalculationsModule],
})
export class BatchProcessorModule {}

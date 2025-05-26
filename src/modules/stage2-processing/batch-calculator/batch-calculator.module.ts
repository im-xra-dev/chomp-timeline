import { Module } from '@nestjs/common';
import { BatchCalculatorService } from './batch-calculator.service';
import { TlineCacherModule } from '../../tline-cacher/tline-cacher.module';
import { Stage2CalculationsModule } from '../stage2-calculations/stage2-calculations.module';

@Module({
    providers: [BatchCalculatorService],
    exports: [BatchCalculatorService],
    imports: [TlineCacherModule, Stage2CalculationsModule],
})
export class BatchCalculatorModule {}

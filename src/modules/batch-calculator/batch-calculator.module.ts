import { Module } from '@nestjs/common';
import { BatchCalculatorService } from './batch-calculator.service';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';
import { TLineCalculatorModule } from '../t-line-calculator/t-line-calculator.module';

@Module({
    providers: [BatchCalculatorService],
    exports: [BatchCalculatorService],
    imports: [TlineCacherModule, TLineCalculatorModule],
})
export class BatchCalculatorModule {}

import { Module } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { TLineCalculatorModule } from '../t-line-calculator/t-line-calculator.module';
import { BatchCalculatorModule } from '../batch-calculator/batch-calculator.module';

@Module({
    providers: [DispatcherService],
    exports: [DispatcherService],
    imports: [BatchCalculatorModule, TLineCalculatorModule],
})
export class DispatcherModule {}

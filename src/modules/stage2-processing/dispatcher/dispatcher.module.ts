import { Module } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { Stage2CalculationsModule } from '../stage2-calculations/stage2-calculations.module';
import { BatchCalculatorModule } from '../batch-calculator/batch-calculator.module';

@Module({
    providers: [DispatcherService],
    exports: [DispatcherService],
    imports: [BatchCalculatorModule, Stage2CalculationsModule],
})
export class DispatcherModule {}

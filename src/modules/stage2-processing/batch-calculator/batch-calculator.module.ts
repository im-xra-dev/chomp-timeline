import { Module } from '@nestjs/common';
import { BatchCalculatorService } from './batch-calculator.service';
import { Stage2CalculationsModule } from '../stage2-calculations/stage2-calculations.module';
import { Stage2CacheManagementModule } from '../stage2-cache-management/stage2-cache-management.module';

@Module({
    providers: [BatchCalculatorService],
    exports: [BatchCalculatorService],
    imports: [Stage2CacheManagementModule, Stage2CalculationsModule],
})
export class BatchCalculatorModule {}

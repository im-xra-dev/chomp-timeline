import { Module } from '@nestjs/common';
import { BatchCalculatorService } from '../../stage2-processing/batch-calculator/batch-calculator.service';
import { Stage2CalculationsModule } from '../../stage2-processing/stage2-calculations/stage2-calculations.module';
import { Stage2CacheManagementService } from '../../stage2-processing/stage2-cache-management/stage2-cache-management.service';

@Module({
    providers: [BatchCalculatorService],
    exports: [BatchCalculatorService],
    imports: [Stage2CacheManagementService, Stage2CalculationsModule],
})
export class BatchProcessorModule {}

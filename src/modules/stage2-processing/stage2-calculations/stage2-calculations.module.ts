import { Module } from '@nestjs/common';
import { Stage2CalculationsService } from './stage2-calculations.service';
import { TLineCalculatorConfigModule } from '../../../configs/t-line-calculator.config/t-line-calculator.config.module';

@Module({
    providers: [Stage2CalculationsService],
    exports: [Stage2CalculationsService],
    imports: [TLineCalculatorConfigModule],
})
export class Stage2CalculationsModule {}

import { Module } from '@nestjs/common';
import { TLineCalculatorService } from './t-line-calculator.service';
import { TLineCalculatorConfigModule } from '../../../configs/t-line-calculator.config/t-line-calculator.config.module';

@Module({
    providers: [TLineCalculatorService],
    exports: [TLineCalculatorService],
    imports: [TLineCalculatorConfigModule],
})
export class TLineCalculatorModule {}

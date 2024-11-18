import { Module } from '@nestjs/common';
import { TLineCalculatorConfigService } from './t-line-calculator.config.service';

@Module({
  providers: [TLineCalculatorConfigService],
  exports: [TLineCalculatorConfigService]
})
export class TLineCalculatorConfigModule {}

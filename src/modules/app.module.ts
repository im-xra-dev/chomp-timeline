import {Module} from '@nestjs/common';
import {TLineModule} from './t-line/t-line.module'
import { TLineCalculatorModule } from './t-line-calculator/t-line-calculator.module';
import { BatchCalculatorModule } from './batch-calculator/batch-calculator.module';

@Module({
    imports: [TLineModule, TLineCalculatorModule, BatchCalculatorModule],
})
export class AppModule {
}

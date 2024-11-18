import {Module} from '@nestjs/common';
import {TLineModule} from './t-line/t-line.module'
import { TLineCalculatorModule } from './t-line-calculator/t-line-calculator.module';

@Module({
    imports: [TLineModule, TLineCalculatorModule],
})
export class AppModule {
}

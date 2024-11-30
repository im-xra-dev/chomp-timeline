import { Module } from '@nestjs/common';
import { PostRankerService } from './post-ranker.service';
import { TLineCalculatorModule } from '../t-line-calculator/t-line-calculator.module';
import {BatchCalculatorModule} from "../batch-calculator/batch-calculator.module";

@Module({
  providers: [PostRankerService],
  exports: [PostRankerService],
  imports: [BatchCalculatorModule, TLineCalculatorModule]
})
export class PostRankerModule {}

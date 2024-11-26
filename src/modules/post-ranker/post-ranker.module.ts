import { Module } from '@nestjs/common';
import { PostRankerService } from './post-ranker.service';
import { NeoQueryModule } from '../neo-query/neo-query.module';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';
import { TLineCalculatorModule } from '../t-line-calculator/t-line-calculator.module';

@Module({
  providers: [PostRankerService],
  exports: [PostRankerService],
  imports: [NeoQueryModule, TlineCacherModule, TLineCalculatorModule]
})
export class PostRankerModule {}

import { Module } from '@nestjs/common';
import { PostRankerManagerService } from './post-ranker-manager.service';
import { NeoQueryModule } from '../neo-query/neo-query.module';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';
import { TLineCalculatorModule } from '../t-line-calculator/t-line-calculator.module';

@Module({
  providers: [PostRankerManagerService],
  exports: [PostRankerManagerService],
  imports: [NeoQueryModule, TlineCacherModule, TLineCalculatorModule]
})
export class PostRankerManagerModule {}

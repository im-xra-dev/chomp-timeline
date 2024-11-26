import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';
import { PostRankerModule } from '../post-ranker/post-ranker.module';

@Module({
  providers: [TLineService],
  controllers: [TLineController],
  imports: [PostRankerModule]
})
export class TLineModule {}

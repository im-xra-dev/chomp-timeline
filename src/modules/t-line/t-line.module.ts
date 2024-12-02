import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';
import { DispatcherModule } from '../dispatcher/dispatcher.module';

@Module({
  providers: [TLineService],
  controllers: [TLineController],
  imports: [DispatcherModule]
})
export class TLineModule {}

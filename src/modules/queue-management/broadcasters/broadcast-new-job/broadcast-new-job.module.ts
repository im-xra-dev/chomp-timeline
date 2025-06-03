import { Module } from '@nestjs/common';
import { BroadcastNewJobService } from './broadcast-new-job.service';

@Module({
  providers: [BroadcastNewJobService]
})
export class BroadcastNewJobModule {}

import { Module } from '@nestjs/common';
import { GenericBroadcasterService } from './generic-broadcaster.service';

@Module({
  providers: [GenericBroadcasterService]
})
export class GenericBroadcasterModule {}

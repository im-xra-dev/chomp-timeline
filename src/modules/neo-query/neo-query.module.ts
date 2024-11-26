import { Module } from '@nestjs/common';
import { NeoQueryService } from './neo-query.service';

@Module({
  providers: [NeoQueryService],
  exports: [NeoQueryService]
})
export class NeoQueryModule {}

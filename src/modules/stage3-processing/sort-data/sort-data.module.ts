import { Module } from '@nestjs/common';
import { SortDataService } from './sort-data.service';

@Module({
  providers: [SortDataService],
  exports: [SortDataService],
})
export class SortDataModule {}

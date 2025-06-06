import { Module } from '@nestjs/common';
import { MetadataManagementService } from './metadata-management.service';

@Module({
  providers: [MetadataManagementService],
  exports: [MetadataManagementService],
})
export class MetadataManagementModule {}

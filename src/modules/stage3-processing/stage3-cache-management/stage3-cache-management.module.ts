import { Module } from '@nestjs/common';
import { Stage3CacheManagementService } from './stage3-cache-management.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
  providers: [Stage3CacheManagementService],
  exports: [Stage3CacheManagementService],
  imports: [RedisCacheDriverModule],
})
export class Stage3CacheManagementModule {}

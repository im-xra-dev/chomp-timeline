import { Module } from '@nestjs/common';
import { Stage1CacheManagementService } from './stage1-cache-management.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [Stage1CacheManagementService],
    exports: [Stage1CacheManagementService],
    imports: [RedisCacheDriverModule],
})
export class Stage1CacheManagementModule {}

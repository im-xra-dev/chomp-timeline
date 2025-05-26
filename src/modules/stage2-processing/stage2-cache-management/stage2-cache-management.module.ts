import { Module } from '@nestjs/common';
import { Stage2CacheManagementService } from './stage2-cache-management.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [Stage2CacheManagementService],
    exports: [Stage2CacheManagementService],
    imports: [RedisCacheDriverModule],
})
export class Stage2CacheManagementModule {}

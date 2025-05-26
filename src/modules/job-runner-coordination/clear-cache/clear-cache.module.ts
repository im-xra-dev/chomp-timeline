import { Module } from '@nestjs/common';
import { ClearCacheService } from './clear-cache.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [ClearCacheService],
    exports: [ClearCacheService],
    imports: [RedisCacheDriverModule],
})
export class ClearCacheModule {}

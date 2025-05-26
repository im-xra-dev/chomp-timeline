import { Module } from '@nestjs/common';
import { InitCacheService } from './init-cache.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [InitCacheService],
    exports: [InitCacheService],
    imports: [RedisCacheDriverModule],
})
export class InitCacheModule {}

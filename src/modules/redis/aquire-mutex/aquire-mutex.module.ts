import { Module } from '@nestjs/common';
import { AquireMutexService } from './aquire-mutex.service';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [AquireMutexService],
    exports: [AquireMutexService],
    imports: [RedisCacheDriverModule],
})
export class AquireMutexModule {}

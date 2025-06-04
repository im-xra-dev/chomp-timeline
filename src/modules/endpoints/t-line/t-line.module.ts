import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';
import { RedisCacheDriverModule } from '../../redis-cache-driver/redis-cache-driver.module';

@Module({
    providers: [TLineService],
    controllers: [TLineController],
    imports: [RedisCacheDriverModule],
})
export class TLineModule {}

import { Module } from '@nestjs/common';
import { RedisCacheDriverService } from './redis-cache-driver.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [RedisCacheDriverService],
  exports: [RedisCacheDriverService],
  imports: [ConfigModule.forRoot()],
})
export class RedisCacheDriverModule {}

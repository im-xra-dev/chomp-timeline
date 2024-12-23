import { Module } from '@nestjs/common';
import { InitCacheService } from './init-cache.service';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';

@Module({
    providers: [InitCacheService],
    exports: [InitCacheService],
    imports: [TlineCacherModule],
})
export class InitCacheModule {}

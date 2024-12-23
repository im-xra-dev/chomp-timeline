import { Module } from '@nestjs/common';
import { ClearCacheService } from './clear-cache.service';
import { TlineCacherModule } from '../tline-cacher/tline-cacher.module';

@Module({
    providers: [ClearCacheService],
    exports: [ClearCacheService],
    imports: [TlineCacherModule],
})
export class ClearCacheModule {}

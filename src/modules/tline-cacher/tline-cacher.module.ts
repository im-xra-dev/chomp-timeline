import {Module} from '@nestjs/common';
import {TlineCacherService} from './tline-cacher.service';

@Module({
    providers: [TlineCacherService],
    exports: [TlineCacherService]
})
export class TlineCacherModule {
}

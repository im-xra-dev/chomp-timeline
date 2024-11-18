import {Module} from '@nestjs/common';
import {TLineModule} from './t-line/t-line.module'

@Module({
    imports: [TLineModule],
})
export class AppModule {
}

import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TLineModule} from './t-line/t-line.module'

@Module({
    imports: [TLineModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {
}

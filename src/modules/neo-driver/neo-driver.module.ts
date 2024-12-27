import { Module } from '@nestjs/common';
import { NeoDriverService } from './neo-driver.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    providers: [NeoDriverService],
    exports: [NeoDriverService],
    imports: [ConfigModule.forRoot()],
})
export class NeoDriverModule {}

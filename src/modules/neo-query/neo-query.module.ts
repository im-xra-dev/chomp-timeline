import { Module } from '@nestjs/common';
import { NeoQueryService } from './neo-query.service';
import { NeoDriverModule } from '../neo-driver/neo-driver.module';

@Module({
    providers: [NeoQueryService],
    exports: [NeoQueryService],
    imports: [NeoDriverModule],
})
export class NeoQueryModule {}

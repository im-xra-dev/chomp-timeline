import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';
import { DispatcherModule } from '../../stage2-processing/dispatcher/dispatcher.module';
import {
    Stage2CacheManagementModule
} from '../../stage2-processing/stage2-cache-management/stage2-cache-management.module';

@Module({
    providers: [TLineService],
    controllers: [TLineController],
    imports: [DispatcherModule, Stage2CacheManagementModule],
})
export class TLineModule {}

import { Module } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { TLineController } from './t-line.controller';

@Module({
    providers: [TLineService],
    controllers: [TLineController],
    imports: [],
})
export class TLineModule {}

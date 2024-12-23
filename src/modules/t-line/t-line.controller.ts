import { Controller, Get } from '@nestjs/common';
import { TLineService } from './t-line.service';

@Controller('t-line')
export class TLineController {
    constructor(private readonly tLineService: TLineService) {}

    @Get()
    ping() {
        return this.tLineService.ping();
    }
}

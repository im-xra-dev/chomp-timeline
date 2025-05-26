import { Controller, Get } from '@nestjs/common';
import { TLineService } from './t-line.service';
import {
    Stage2CacheManagementService
} from '../../stage2-processing/stage2-cache-management/stage2-cache-management.service';

@Controller('t-line')
export class TLineController {
    constructor(
    ) {}

    @Get()
    async ping() {
    }
}

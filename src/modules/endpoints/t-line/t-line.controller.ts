import { Controller, Get } from '@nestjs/common';

@Controller('t-line')
export class TLineController {

    @Get()
    async ping() {
    }
}

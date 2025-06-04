import { Controller, Get } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

@Controller('t-line')
export class TLineController {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    @Get()
    async ping() {
        const client = await this.cacheService.getClient();

        const out = await client.hSetNX("hash__", "f1", "v1")
        console.log(out);
    }
}

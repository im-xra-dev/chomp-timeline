import { Controller, Get } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

@Controller('t-line')
export class TLineController {
    constructor(private readonly cacheClient: RedisCacheDriverService) {
    }

    @Get()
    async ping() {
        const client = await this.cacheClient.getClient();
        const out1 = await client.set('testing123', 'value', {NX: true, EX: 10})
        const out2 = await client.set('testing123', 'value2', {NX: true, EX: 10})
        console.log({out1, out2});
    }
}

import { Controller, Get } from '@nestjs/common';
import { RedisCacheDriverService } from '../../redis-cache-driver/redis-cache-driver.service';

@Controller('t-line')
export class TLineController {
    constructor(private readonly cacheService: RedisCacheDriverService) {}

    @Get()
    async ping() {
        const client = await this.cacheService.getClient();
        const builder = client.multi();

        builder.lRange('list1', 0, -1);
        builder.del('list1');
        builder.lRange('list2', 0, -1);
        builder.del('list2');

        const out = await builder.exec();

        console.log(out);
    }
}

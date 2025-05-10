import { Controller, Get } from '@nestjs/common';
import { TLineService } from './t-line.service';
import { FeedQuerier } from '../feed-querier/feed-querier.service';

@Controller('t-line')
export class TLineController {
    constructor(
        private readonly test: FeedQuerier,
        private readonly tLineService: TLineService
    ) {}

    @Get()
    async ping() {
    const out = await this.test.getInteractedUsersPosts("1");
    console.log(out.records.at(0).get("post"));
    }
}

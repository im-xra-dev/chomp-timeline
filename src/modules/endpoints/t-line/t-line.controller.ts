import { Controller, Get } from '@nestjs/common';
import { TLineService } from './t-line.service';
import {
    Stage2CacheManagementService
} from '../../stage2-processing/stage2-cache-management/stage2-cache-management.service';
import getRawPostObjectSpecUtil from '../../../utils/getRawPostObject.spec.util';

@Controller('t-line')
export class TLineController {
    constructor(
        private readonly test: Stage2CacheManagementService,
        private readonly tLineService: TLineService,
    ) {}

    @Get()
    async ping() {
        console.log(await this.test.getCachedData("123", [
            getRawPostObjectSpecUtil(0),
            getRawPostObjectSpecUtil(1),
            getRawPostObjectSpecUtil(2),
            getRawPostObjectSpecUtil(3),
            getRawPostObjectSpecUtil(4, 'tests0'),
        ]));
        // const out = await this.test.getInteractedUsersPosts('1', 1);
        // const keys = out.records.at(0).keys;
        // for (let i = 0; i < keys.length; i++) {
        //     console.log();
        //     console.log(keys[i]);
        //     console.log(out.records.at(0).get(keys[i]));
        // }
    }
}

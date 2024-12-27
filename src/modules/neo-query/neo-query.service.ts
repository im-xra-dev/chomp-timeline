import { Injectable } from '@nestjs/common';
import { NeoDriverService } from '../neo-driver/neo-driver.service';

@Injectable()
export class NeoQueryService {
    constructor(private neoDriverService: NeoDriverService) {}

    read(query: string): unknown {
        return null;
    }

    write(query: string): unknown {
        return null;
    }
}

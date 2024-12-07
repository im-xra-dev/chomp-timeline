import { Module } from '@nestjs/common';
import {NeoQueryModule} from "../neo-query/neo-query.module";
import {QueryPoolService} from "./query-pool.service";
import {TLineCalculatorModule} from "../t-line-calculator/t-line-calculator.module";

@Module({
    providers: [QueryPoolService],
    exports: [QueryPoolService],
    imports: [NeoQueryModule, TLineCalculatorModule]
})
export class QueryPoolModule {}

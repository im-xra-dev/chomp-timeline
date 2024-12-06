import { Injectable } from '@nestjs/common';
import {QueryData, QueryJobListing} from "../../utils/types";
import {NeoQueryService} from "../neo-query/neo-query.service";
import {TLineCalculatorService} from "../t-line-calculator/t-line-calculator.service";

@Injectable()
export class QueryPoolService {
    constructor(
        private readonly neoQueryService: NeoQueryService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {}

    /**queryAllModes
     *
     * runs the query modes that the job has requested and returns an object containing the data retrieved
     *
     * @param job
     */
    async queryAllModes(job: QueryJobListing): Promise<QueryData>{
        return {};
    }

    //notes
    async queryFollowedSectionPosts(postSlots: number) {
        //const secsAvaialab
        // x = calculateSectionsToQuery(postSlots: number, secsAvailable: number)
        //pop x sections from cache
        //query from neo || mock

        //rank posts (concurrent batch count set)

        //for each update and splice section into cache (based on sec normalized score && total seen)
    }
}

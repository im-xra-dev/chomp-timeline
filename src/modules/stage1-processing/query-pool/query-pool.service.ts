import { Injectable } from '@nestjs/common';
import { QueryData, QueryJobListing } from '../../../utils/types';
import { FeedQuerier } from '../feed-querier/feed-querier.service';
import { Stage2CalculationsService } from '../../stage2-processing/stage2-calculations/stage2-calculations.service';

@Injectable()
export class QueryPoolService {
    constructor(
        private readonly neoQueryService: FeedQuerier,
        private readonly tlineCalculatorService: Stage2CalculationsService,
    ) {}

    /**queryAllModes
     *
     * runs the query modes that the job has requested and returns an object containing the data retrieved
     *
     * @param job
     */
    async queryAllModes(job: QueryJobListing): Promise<QueryData> {
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

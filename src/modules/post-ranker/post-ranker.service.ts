import { Injectable } from '@nestjs/common';
import { NeoQueryService } from '../neo-query/neo-query.service';
import { TlineCacherService } from '../tline-cacher/tline-cacher.service';
import {RawPost} from "../t-line/utils/types";

@Injectable()
export class PostRankerService {
    constructor(
        private readonly neoQueryService: NeoQueryService,
        private readonly tlineCacheService: TlineCacherService
    ) {}

    rankPosts(rawPool: RawPost[]): number {
        //data in: raw post data
        //for each post call calculateRelevanceScore; drop -ve or 0score posts then calculateTotalSeenWeight
        //remove cached IDs (seen)
        //put in cache Q in ranked position
        //update section[x] data in state
        //return total added
        return 0;
    };

    queryFollowedSectionPosts(postSlots: number) {
        //const secsAvaialab
        // x = calculateSectionsToQuery(postSlots: number, secsAvailable: number)
        //pop x sections from cache
        //query from neo || mock

        //rank posts

        //for each update and splice section into cache (based on sec normalized score && total seen)
    }

    //choose mode
    // x = calculateSectionsToQuery
    // pop top x
    // query
    //  remove seen
    //  calculate post score
    //  drop -ve, splice&seen +ve
    // update tobj attribs?
    // splice tobj based on calculateTotalSeenWeight(normalized, total seen)

}

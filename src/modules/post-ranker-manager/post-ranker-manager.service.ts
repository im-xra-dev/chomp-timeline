import {Injectable} from '@nestjs/common';
import {JobResult, QueryJobListing} from "../../utils/types"
import {JobTypes} from "../../utils/JobTypes";
import {QueryPoolService} from "../query-pool/query-pool.service";

@Injectable()
export class PostRankerManagerService {
    constructor(
        private readonly queryPoolService: QueryPoolService,
    ) {}

    async queryJob(job: QueryJobListing): Promise<JobResult> {
        //data in: raw post data

        // const startCache = []; // precache for this job|user|mode
        //job description

        // queryFollowedSectionPosts
        // job = dispatchConcurrentPosts;
        // output = await jobRunner

        // c = cachesize
        //const newMin = output[c] score
        //for startCache[c->0]
        //   if get(score) < newMin:
        //      set seen false && sec total -- && clear attrs
        //   else break;

        //return total added
        return JobTypes.CONTINUE
    };

    //some old notes
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

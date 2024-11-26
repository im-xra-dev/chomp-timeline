import {Injectable} from '@nestjs/common';
import {JobListing} from "../t-line/utils/types"

@Injectable()
export class PostRankerManagerService {
    constructor() {}

    async rankPosts(job: JobListing): Promise<number> {
        //data in: raw post data


        // const cached = []; // precache for this job|user|mode
        // const sortedBatches = SortedPost[][]
        // const concurrentJobs = Promise<SortedPost[]>[]
        //


        //for top cachesize      //   set seen true
        //for any dropped from original cachesize //set seen false && sec total -- && clear postid's cache data


        //TODO: seperate out but this will insert into active tline
        //CACHE2 get cached users pool.  pop job.serve and push to live pool (O(n) // O(job.serve * 2))
        // these are the posts that get broadcast so that their content can be cached

        //return total added
        return 0;
    };



    async queryFollowedSectionPosts(postSlots: number) {
        //const secsAvaialab
        // x = calculateSectionsToQuery(postSlots: number, secsAvailable: number)
        //pop x sections from cache
        //query from neo || mock

        //rank posts (concurrent batch count set)

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

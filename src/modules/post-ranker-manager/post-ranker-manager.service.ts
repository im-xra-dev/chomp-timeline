import {Injectable} from '@nestjs/common';
import {JobListing} from "../t-line/utils/types"

@Injectable()
export class PostRankerManagerService {
    constructor() {}

    async rankPosts(job: JobListing): Promise<number> {
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


        //TODO: seperate out but this will insert into active tline
        // push to users pool.  pop job.serve and push to live pool (O(n) // O(job.serve * 2))
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

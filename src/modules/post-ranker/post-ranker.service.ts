import {Injectable} from '@nestjs/common';
import {NeoQueryService} from '../neo-query/neo-query.service';
import {TlineCacherService} from '../tline-cacher/tline-cacher.service';
import {TLineCalculatorService} from '../t-line-calculator/t-line-calculator.service';
import {RawPost} from "../t-line/utils/types";
import {JobListing, SortedPost} from "../t-line/utils/types"

@Injectable()
export class PostRankerService {
    constructor(
        private readonly neoQueryService: NeoQueryService,
        private readonly tlineCacheService: TlineCacherService,
        private readonly tlineCalculatorService: TLineCalculatorService,
    ) {
    }

    async rankPosts(rawPool: RawPost[], job: JobListing): Promise<number> {
        //data in: raw post data

        //total batches = total posts / 14.1412

        // const cached = []; // precache for this job|user|mode
        // const sortedBatches = SortedPost[][]
        // const concurrentJobs = Promise<SortedPost[]>[]
        //
        // let jobBuilder
        // for each rawPost
        //   append to jobBuilder
        //   if all posts or jobBuilder length =  ceil(rawPool.length / job.concurrentJobs)
        //     concurrentJobs.push(batchCalculate(jobBuilder, cached[last].score || 0) && reset jobBuilder to []

        // for each concurrent job
        //   sortedBatches.push(await concurrentJobs[i])
        //   remove (seen) posts
        //   calculateTotalSeenWeight
        //   if cached.length === job.cache
        //      discard any with lower score than last elm
        //   CACHE1 update section totalPosts data in :sec:[secid] ++
        //

        //for top cachesize      //   set seen true
        //for any dropped from original cachesize //set seen false && sec total -- && clear postid's cache data



        //TODO: seperate out but this will insert into active tline
        //CACHE2 get cached users pool.  pop job.serve and push to live pool (O(n) // O(job.serve * 2))
        // these are the posts that get broadcast so that their content can be cached

        //return total added
        return 0;
    };

    //O(n^2) run concurrently in batches
    async batchCalculate(batch: RawPost[], minScore: number): Promise<SortedPost[]> {
        let sortedData: SortedPost[] = [];
        let sortingData: SortedPost[] = [];
        //for each post in batch
        //  call calculateRelevanceScore;
        //  drop -ve or 0score posts
        //  drop posts less than minScore
        //  for sortedData
        //    pop and push to sorting, adding current post
        //  sortedData = sortingData
        //  sortingData = []
        return sortedData;
    }

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

import {Injectable} from '@nestjs/common';
import {DiscoveryModes} from './DiscoveryModes'

@Injectable()
export class TLineService {

    rankPosts() {
        //data in: raw post data
        //for each post call calculateRelevanceScore; drop -ve or 0score posts then calculateTotalSeenWeight
        //put in cache Q in ranked position && update sections cache
    };

    decideMode(): DiscoveryModes {
        //TODO: initial implementation will only focus on followed secs
        //decides what mode to load posts for
        return DiscoveryModes.FOLLOWED_SUBSECTION;
    }

    queryFollowedSectionPosts() {
        // x = calculateSectionsToQuery
        //pop x sections from cache
        //query from neo || mock
        //remove cached IDs (seen&pool)

        //rank posts

        //update section[x] data
        //splice section[x] into cache (based on sec score && total seen)
    }

    getCache() {
        //returns current cache
    }

    createCache() {
        //init new object
    }


    //called internally from program and from other internal CHOMP services
    async generateBlock(total: number) {
        //adds total posts to the tline pool and seen lookup
        //these should be generated behind the scenes

        //decide mode
        //if followed sections then query followed sections
    }

    //This is a client entry-point
    async getBlock(total: number) {
        // if(available < total) there should be waiting for posts to become available
        // returns pop total IDs from the pool
    }
}

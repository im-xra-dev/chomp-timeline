import {Injectable} from '@nestjs/common';
import {DiscoveryModes} from './utils/DiscoveryModes'
import {DispatcherService} from '../dispatcher/dispatcher.service'

@Injectable()
export class TLineService {

    constructor(private readonly postRankerService: DispatcherService) {}
    ping(){return "hi"}

    decideMode(): DiscoveryModes {
        //TODO: initial implementation will only focus on followed secs
        //decides what mode to load posts for
        return DiscoveryModes.FOLLOWED_SUBSECTION;
    }

    createCache() {
        //init new object
    }


    //called internally from program and from other internal CHOMP modules
    async generateBlock(total: number) {
        //adds total posts to the tline pool and seen lookup
        //these should be generated behind the scenes

        //decide mode(s)
        //if followed sections then queryFollowedSectionPosts
    }

    //This is a client entry-point
    async getBlock(total: number) {
        // if(available < total) there should be waiting for posts to become available
        // returns pop total IDs from the pool
    }
}

import { Injectable } from '@nestjs/common';
import { GenericBroadcasterService } from '../generic-broadcaster/generic-broadcaster.service';
import { SortedPost } from '../../../../utils/types';

@Injectable()
export class BroadcastCachePostsService extends GenericBroadcasterService{

    async broadcastPosts(posts: SortedPost): Promise<void> {
    }
}

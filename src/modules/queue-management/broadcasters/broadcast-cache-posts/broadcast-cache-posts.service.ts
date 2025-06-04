import { Injectable } from '@nestjs/common';
import { GenericBroadcasterService } from '../generic-broadcaster/generic-broadcaster.service';

@Injectable()
export class BroadcastCachePostsService extends GenericBroadcasterService{

    async broadcastPosts(posts: string[]): Promise<void> {
    }
}

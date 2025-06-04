import { Injectable } from '@nestjs/common';
import { GenericBroadcasterService } from '../generic-broadcaster/generic-broadcaster.service';
import { GenericJobListing } from '../../../../utils/types';

@Injectable()
export class BroadcastNewJobService extends GenericBroadcasterService{

    async broadcastJob(job: GenericJobListing): Promise<void> {
    }
}
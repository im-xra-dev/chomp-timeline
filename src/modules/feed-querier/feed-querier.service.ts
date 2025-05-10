import { Injectable } from '@nestjs/common';
import { NeoDriverService } from '../neo-driver/neo-driver.service';
import { QueryResult, RecordShape } from 'neo4j-driver';
import {
    FIND_USER,
    RETURN_THE_DATA,
    CALCULATE_LIKELY_USER_CANDIDATES,
    CALCULATE_LIKELY_BITE_CANDIDATES,
    MATCH_INTERACTED_USER_CHAIN,
    MATCH_INTERACTED_BITE_CHAIN,
    MATCH_SIMILAR_BITE_CHAIN,
    MATCH_MUTUAL_USER_CHAIN,
    MATCH_MUTUAL_BITE_CHAIN,
} from './feed-query-config';

@Injectable()
export class FeedQuerier {
    constructor(private neoDriverService: NeoDriverService) {}

    async getInteractedUsersPosts(userId: string): Promise<QueryResult<RecordShape>> {
        const query = `${FIND_USER} ${MATCH_INTERACTED_USER_CHAIN} ${CALCULATE_LIKELY_USER_CANDIDATES} ${RETURN_THE_DATA}`;
        return await this.executeQuery(userId, query);
    }

    async getInteractedBitesPosts(userId: string): Promise<QueryResult<RecordShape>> {
        const query = `${FIND_USER} ${MATCH_INTERACTED_BITE_CHAIN} ${CALCULATE_LIKELY_BITE_CANDIDATES} ${RETURN_THE_DATA}`;
        return await this.executeQuery(userId, query);
    }

    async getSimilarBitesPosts(userId: string): Promise<QueryResult<RecordShape>> {
        const query = `${FIND_USER} ${MATCH_SIMILAR_BITE_CHAIN} ${CALCULATE_LIKELY_BITE_CANDIDATES} ${RETURN_THE_DATA}`;
        return await this.executeQuery(userId, query);
    }

    async getMutualUsersPosts(userId: string): Promise<QueryResult<RecordShape>> {
        const query = `${FIND_USER} ${MATCH_MUTUAL_USER_CHAIN} ${CALCULATE_LIKELY_USER_CANDIDATES} ${RETURN_THE_DATA}`;
        return await this.executeQuery(userId, query);
    }

    async getMutualBitesPosts(userId: string): Promise<QueryResult<RecordShape>> {
        const query = `${FIND_USER} ${MATCH_MUTUAL_BITE_CHAIN} ${CALCULATE_LIKELY_USER_CANDIDATES} ${RETURN_THE_DATA}`;
        return await this.executeQuery(userId, query);
    }

    private async executeQuery(userId: string, query: string): Promise<QueryResult<RecordShape>>{
        const params = {id: userId, now: new Date().getTime()};
        const dbSess = await this.neoDriverService.getSession();
        const result = await dbSess.run(query, params);
        await dbSess.close();
        return result;
    }
}

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
import { strictEqual } from 'assert';

@Injectable()
export class FeedQuerier {
    constructor(private neoDriverService: NeoDriverService) {}

    async getInteractedUsersPosts(
        userId: string,
        limit: number,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_INTERACTED_USER_CHAIN,
            CALCULATE_LIKELY_USER_CANDIDATES,
            limit,
        );
    }

    async getInteractedBitesPosts(
        userId: string,
        limit: number,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_INTERACTED_BITE_CHAIN,
            CALCULATE_LIKELY_BITE_CANDIDATES,
            limit,
        );
    }

    async getSimilarBitesPosts(userId: string, limit: number): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_SIMILAR_BITE_CHAIN,
            CALCULATE_LIKELY_BITE_CANDIDATES,
            limit,
        );
    }

    async getMutualUsersPosts(userId: string, limit: number): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_MUTUAL_USER_CHAIN,
            CALCULATE_LIKELY_USER_CANDIDATES,
            limit,
        );
    }

    async getMutualBitesPosts(userId: string, limit: number): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_MUTUAL_BITE_CHAIN,
            CALCULATE_LIKELY_BITE_CANDIDATES,
            limit,
        );
    }

    /**executeQuery
     *
     * builds and executes the query, managing the session
     *
     * @param userId
     * @param matchChain
     * @param calculateCandidates
     * @param limit
     * @private
     */
    private async executeQuery(
        userId: string,
        matchChain: string,
        calculateCandidates: string,
        limit: number,
    ): Promise<QueryResult<RecordShape>> {
        strictEqual(limit >= 0, true, 'feed-querier -> limit must be >= 0');

        //build the query and params
        const query = `${FIND_USER} ${matchChain} ${calculateCandidates} ${RETURN_THE_DATA} LIMIT ${limit}`;
        const params = { id: userId, now: new Date().getTime() };

        //query neo4j
        try {
            const dbSess = await this.neoDriverService.getSession();
            const result = await dbSess.run(query, params);
            await dbSess.close();
            return result;
        }catch (e) {
            console.error(e)
            throw new Error("TODO: feed-querier error")
        }
    }
}

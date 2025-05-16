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
    OPTIONAL_USER_INTERACT_POST,
    OPTIONAL_USER_INTERACT_AUTHOR,
    OPTIONAL_USER_INTERACT_BITE,
} from './feed-query-config';
import { strictEqual } from 'assert';
import { FeedQueryError } from '../../errors/feed-query-error';

@Injectable()
export class FeedQuerier {
    constructor(private neoDriverService: NeoDriverService) {}

    /** getInteractedUsersPosts
     * Gets posts from users that "userId" interacts with
     *
     * @param userId
     * @param limit
     * @param skip
     */
    async getInteractedUsersPosts(
        userId: string,
        limit: number,
        skip: number = 0,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_INTERACTED_USER_CHAIN,
            OPTIONAL_USER_INTERACT_BITE,
            CALCULATE_LIKELY_USER_CANDIDATES,
            limit,
            skip,
        );
    }

    /** getInteractedBitesPosts
     * Gets posts from communities that "userId" interacts with
     *
     * @param userId
     * @param limit
     * @param skip
     */
    async getInteractedBitesPosts(
        userId: string,
        limit: number,
        skip: number = 0,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_INTERACTED_BITE_CHAIN,
            OPTIONAL_USER_INTERACT_AUTHOR,
            CALCULATE_LIKELY_BITE_CANDIDATES,
            limit,
            skip,
        );
    }

    /** getSimilarBitesPosts
     * Gets the posts of a community similar to communities followed by "userId"
     *
     * @param userId
     * @param limit
     * @param skip
     */
    async getSimilarBitesPosts(
        userId: string,
        limit: number,
        skip: number = 0,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_SIMILAR_BITE_CHAIN,
            OPTIONAL_USER_INTERACT_AUTHOR,
            CALCULATE_LIKELY_BITE_CANDIDATES,
            limit,
            skip,
        );
    }

    /** getMutualUsersPosts
     * gets the posts of a user followed by a user that "userId" interacts with
     *
     * @param userId
     * @param limit
     * @param skip
     */
    async getMutualUsersPosts(
        userId: string,
        limit: number,
        skip: number = 0,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_MUTUAL_USER_CHAIN,
            OPTIONAL_USER_INTERACT_BITE,
            CALCULATE_LIKELY_USER_CANDIDATES,
            limit,
            skip,
        );
    }

    /** getMutualBitesPosts
     * gets the posts of a community followed by a user that "userId" interacts with
     *
     * @param userId
     * @param limit
     * @param skip
     */
    async getMutualBitesPosts(
        userId: string,
        limit: number,
        skip: number = 0,
    ): Promise<QueryResult<RecordShape>> {
        return await this.executeQuery(
            userId,
            MATCH_MUTUAL_BITE_CHAIN,
            OPTIONAL_USER_INTERACT_AUTHOR,
            CALCULATE_LIKELY_BITE_CANDIDATES,
            limit,
            skip,
        );
    }

    /**executeQuery
     *
     * builds and executes the query, managing the session
     *
     * @param userId
     * @param matchChain
     * @param optionalMatch
     * @param calculateCandidates
     * @param limit
     * @param skip
     * @private
     */
    private async executeQuery(
        userId: string,
        matchChain: string,
        optionalMatch: string,
        calculateCandidates: string,
        limit: number,
        skip: number,
    ): Promise<QueryResult<RecordShape>> {
        strictEqual(limit > 0, true, 'feed-querier -> limit must be > 0');

        //build the query and params
        const query = `${FIND_USER} ${matchChain} ${optionalMatch} ${OPTIONAL_USER_INTERACT_POST} ${calculateCandidates} ${RETURN_THE_DATA} SKIP ${skip} LIMIT ${limit}`;
        const params = { id: userId, now: new Date().getTime() };

        //query neo4j
        try {
            const dbSess = await this.neoDriverService.getSession();
            const result = await dbSess.run(query, params);
            await dbSess.close();
            return result;
        } catch (e) {
            console.error(e);
            throw new FeedQueryError(e, {userId, query});
        }
    }
}

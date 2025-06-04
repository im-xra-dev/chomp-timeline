# Discovery Modes

The discovery modes are the different ways in which the system discovers 
candidate posts for the users timeline. Each discovery mode has its own
associated database query, pre-cache pool and associated configurations.

## Enabling/disabling modes

Discovery modes can be globally enabled/disabled using the `configs/discovery-modes/enabled.ts`
which is handled by the QueryPoolService to ensure only enabled modes are used.

## Creating a new mode

Creating a new mode is fairly simple.

### Adding the mode to the enum

First add the new mode to the `utils/DiscoveryModes.ts` enum

### Creating the query

Create a function in `modules/stage1-processing/feed-querier/feed-querier.service.ts`

This is the function that gets called to build the query. Queries are build out of the
blocks configured in `configs/neo-feed-querier.config/feed-query-config.ts`. New query
blocks can be added to here and imported into the function that assembles them.

A typical function looks like this:
```ts
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
```

### Calling the function

The function is called in the QueryPoolService located at `modules/stage1-processing/query-pool/query-pool.service.ts`

This is not set up yet, docs must still be written for this part

Also note on tests

### Configuring the Discovery Mode

Once the query is set up, some things must be configured.

Pre-cache skip, limit and initial cache size must be configured in `configs/pre-cache-configuration/defaults.ts`

Cleanup must also be configured in `configs/pre-cache-configuration/cleanup-modes.ts` to ensure data is cleaned up
by ClearCache jobs.

The discovery mode must be enabled in the `configs/discovery-modes/enabled.ts` file. While a mode not being present
in this file will be treated as a disabled mode, it is best practice to add it with a value of false.

Discovery Mode weightings must be configured in `configs/load-more-posts/publish-weightings.ts`. These values
represent how many posts from this discovery mode appear in the feed as ratio to other discovery modes. For example
a mode of weight 10 appears twice as often as a mode of weight 5.

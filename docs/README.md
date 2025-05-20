# CHOMP timeline generator Microservice

## Technologies
- redis is the caching service that holds data about the currently active users timelines
- neo4j is the database that handles relations between users and content
- The server is written in nest/TS
- testing is performed with JEST

## Jobs
[Read about the event jobs listened for](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/job-types.md)

## Querying candidates
[Read about generation of a candidate pool](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/query.md)

## Data flow
[Read about the flow of data through the system](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/data-flow.md)

## Caching
[Read about the caching](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/caching.md)

## Data storage
[Read about the storage of data in neo](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/neo.md)

## Time complexity
[Read about the time complexity](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/time-complexity.md)

## Code Style
[Read the code style guidelines](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/code-style.md)

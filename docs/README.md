# CHOMP timeline generator Microservice

## Technologies
- redis is the caching service that holds data about the currently active users timelines
- neo4j is the database that handles relations between users and content
- The server is written in nest/TS
- testing is performed with JEST

##Time complexity
[Read about the time complexity](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/time-complexity.md)

##Caching
[Read about the caching](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/caching.md)

##Jobs
[Read about the event jobs listened for](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/job-types.md)

## Data flow
[Read about the flow of data through the system](https://github.com/im-xra-dev/chomp-timeline/tree/main/docs/data-flow.md)

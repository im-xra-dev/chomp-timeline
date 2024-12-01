# Data flow
The timeline is generated in the following stages to process a large pool of potential posts down into a
small pool of relevant posts for the timeline.

The current stage where the system is being prepared for a BETA release, breaking the system down further would be
more than is required at this stage, however the aim is to have the system broken down by the full release.

In future implementations, it would be a good idea to break the system down so that each of the processes
listed below runs independently, for example, breaking the Batch Calculator out would allow the Dispatcher
to write to a queue that is picked up by the Batch Calculator. This can then allow it to be scaled independently.

Additionally, the current timeline cache which is accessed by the user could be stored in a separate cache 
from the pre-cache data that is not accessed by the user. This would help separate the data a bit better
and allow the Job Runner to have its own private cache.

The current business function that is implemented by this microservice is generating the users customized home
feed. Another microservice closely related to this service is generating the users customized meal plan.

Future implementations could be broken down into the following business needs:
- User Relevance
- Timeline Generation
- Mealplan Generation

Plans for this implementation remain incomplete, though current ideas can be viewed at the bottom of this file.

## User Request Manager
The user request manager handles requests incoming from the user. This includes requesting the next block of
the timeline, but may also include things such as handling the user requesting data about if they've liked a
post before, if they have navigated to it via a route other than the timeline (such as clicking a link).

## Post Ranker Manager
The post ranker manager listens for jobs in the incoming queue and routes them through the system accordingly.

Some jobs may pass through multiple stages eg Query Next Batch

Others may only pass through one stage eg Load More or Write Data

### Query
The query service will decide how many posts are desired for the input pool, contact neo4j and return the data
found. The data it returns should be in the form of a list of raw posts and contain the following relevant 
information that will be required by the following stages.

> These store information about where this post came from and how it should be displayed to the user
>
> - post ID: string
> - subsection ID: string
> - thread ID: string
> - vote: number (if the user has previously voted on this post)

> These store information about the relationship between the user requesting a timeline, and the given entities
in the database
>
> - subsection relational score: number
> - the thread relational score: number
> - the author relational score: number
> - author muted: boolean
> - author followed: boolean

> These store information about the authors individual ranking, and the posts individual ranking (eg votes)
>
> - the posts personal score: number
> - the authors personal score: number

> These store information about whether the post was viewed in a previous session, and how that should affect its
ranking
>
> - the post seen by the user: boolean (indicates previous session views)
> - the post modifier weight: number (the weight to modify seen posts by)

### Dispatcher
The dispatcher takes in list of raw posts, the max cache size, and the reject score.

It then calculates how many posts should be placed into each batch for optimal performance, before dispatching
all the posts in batches of that size.

The dispatched batches are then sent to the Job Runner to process on completion.

### Batch Calculator
The batch calculator takes a batch and the reject score as its inputs.

It evaluates the score of each raw post, rejects all posts it knows wont make the cut, and then orders the
valid ones from high to low.

The sorted batch is then returned which will be utilized by the Job Runner

### Job Runner
The Job Runner is in charge of ensuring that the Jobs are completed and dispatching new Jobs accordingly.

It is has access to the redis cache.

For query jobs, it listens for the completed batches, and processes them into the pre-cache.

For load more jobs, it pops data from the pre-cache and pushes them to the current timeline cache.

For clear cache jobs it cleans up data stored in the cache

### Data Writer
The data writer handles all jobs that involve writing data into the database. It is the only one that
has write access to the neo4j database.

## Splitting up the business functions
One way to implement it is by focusing on the databases and caches. For which, the following statements hold true:

- The neo4j holds all the Relevance data
- The timeline Cache holds all the timeline generation data
- The mealplan service is not fully planned.

This lines up with the business needs as stated above.

- User Relevance
- Timeline Generation
- Mealplan Generation

By placing the Databases and Caches at the heart of the service, data-flows can be built around them to give
an idea of how data will move through the system. The diagram below represents data-flows in a purple-pink,
Caches in green, Queues in orange and any databases / caches at the heart of a services as blue. Additionally
a dark blue box is drawn to group these elements together.

Two implementations stem from this diagram.

Following a microservice architecture, each dark blue box would be build and deployed as a single
microservice. This treats the grouped data-flows as the microservice itself, which interacts with the
queues, databases, caches or client.

There is also, however, a second option. If the data-flows are treated more like a queue or pipe that data
moves through, and the data store is treated as the service itself, it could be said that:
- Each service can have many caches, databases and data-flows
- Each services is the sole owner of its own caches, databases and data-flows
- Each data-flow inputs and outputs to queues for other data-flows to pick up, ensuring loose coupling

This would allow individual data flows to be scaled or deployed independently without affecting the other
flows within the related dark blue box.

Doing so would require careful consideration and a service that monitors the state of all the pipes and likely
orchestrating some functions by enabling/disabling/limiting flows. Additionally, I would ensure only one pipe
can write to a data-store, while many can read.

I would likely go with the more simple implementation that builds the services the classic way, though it
is a consideration I had.

![Data Flows](https://github.com/im-xra-dev/chomp-timeline/raw/main/docs/dataflow.png)

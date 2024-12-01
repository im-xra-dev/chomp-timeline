# CHOMP timeline generator Microservice

## Technologies
- redis is the caching service that holds data about the currently active users timelines
- neo4j is the database that handles relations between users and content
- The server is written in nest/TS
- testing is performed with JEST

## Time Complexity
The time complexity of the sorting algorithm simplifies to a worst case of `o = (sqrt(2c) + 0.5)n` where

- o is the total operations

- c is the chosen cache size

- n is the number of un-ranked posts from neo

- b is the batch count
 
With the ideal batch size of `i=sqrt(2c)`

These equations were calculated as follows:

The time complexity for the soring algorithm used has a worst case of increasing with respect to the
triangle numbers. This can be calculated with the equation `o = (n * (n + 1)) / 2`.

This equation can be modified to process Posts Per Batch as opposed to *all* posts by dividing n by b
like so: `o = ((n/b) * ((n/b) + 1)) / 2`. For simplicity, we will call this modified version equation `p`.

For every batch, we must sort the posts within the batch using `p`, then sort them into the cache.
If we assume the cache is full at the start of this process, and all posts from the batch are ranked
high enough to make it in, then our worst case scenario will be `c` operations.

This is because both the cache and the batch are both sorted. Therefore, we can start with
`cache[0]`, `batch[0]` and work towards `cache[c]`. Every time that the next post from cache is bigger,
it can be pushed to the end of the sorted data, and every time that the next post from the batch is
bigger, that one is pushed. Once `c` posts are sorted, the rest of the data can be discarded.

This gives the equation of `o = b(p+c)` for the total operations across all batches. This produces a
4D graph of total `o`perations for any given `c`ache and i`n`put sizes and `b`atch counts.

Using this 4D graph, we can calculate its min-point for the total operations required. This took me
2 days and yields the result of an optimal batch size of `sqrt(2c)`.

In the 2D desmos sheet, you can see a green graph with a min-point. This is plotted with y as operations
and x as batch count. It uses 2 sliders, for altering the input and cache sizes.

Additionally, a linear graph is plotted with additional graphs over the top of it jumping up slightly
at periodic intervals. This is plotted with y as operations and x as input size.

Altering the number of posts with the slider will move the green graph up and down as it moves along
the linear graph. Altering the cache size increases the steepness of both the green and linear graphs
while also raising the height of the green graph in line with the linear one.

The linear graph represents the optimal solution. It assumes that a decimal number of data points or
batches can exist. The graphs periodically jumping off of it represent 2 different cases. Each jump
represents a new batch being created. The two cases overlap for the first batch, and one grows closer
to the optimal solution while the other always jumps by the same amount.

The one that jumps higher assumes all previous batches are fully filled, and when a new batch is created
it begins filling up from 1. The other assumes that data is evenly distributed across all batches, though
still includes decimals (for example when distributing 15 posts across 2 batches). Due to this, the
real solution will lie somewhere between these two lines, though they show that it will be more
efficient to, for example with a max batch size of 14 on 16 inputs, run 2 batches of 8 as opposed to
one batch of 14 and one batch of 2.

In the 3D desmos sheet, the purple graph represents the 4D graph. It can be moved through the 3-dimensional
plane by increasing and decreasing the slider `b`. NOTE: IN THIS VIEW `b` REPRESENTS THE BATCH ***SIZE***
**NOT** THE BATCH ***COUNT***

The red graph is the 3-dimensional min point of the purple graph, plotted with the batch size set to
the optimal solution of `sqrt(2c)`. The equation `o = (n / sqrt(2c)) * (((sqrt(2c) * (sqrt(2c) + 1)) / 2) + c)`
is taken from the above equation `o = b(p+c)` re-written to have its batch size as this optimal solution.
This equation is quite long, but it can luckily be simplified down to `o = (sqrt(2c) + 0.5)n`

There are also three 2-dimensional planes that intersect these graphs. The green one represents the
cache size `c`, the blue represents the input size `n` and the orange represents the point at which
the green and blue planes intersect the red min-point graph. For any given `c`,`n` input, the data
will be sorted in the number of operations specified by this orange graph.

The 3D graph can be viewed from different angles to calculate different time-complexities.

From the side, we see how the time complexity increases as `c` increases. It shows the operations
increasing with respect to the square root function as expected, with the steepness increasing as `n`
increases.

From the top, we can view how the time complexity increases as `n` increases. It shows it increasing
linearly, with the steepness increasing as `c` increases. This means that if I choose a fixed cache
size, the algorithm will sort the data and choose the most relevant posts linearly.

Some other operations are also required by the rest of the service, on top of the `o` operations.
Before processing can start, n operations must be performed to distribute the pool into their batches,
and after the sorting is completed, the previously pre-cached posts that have now been discarded have
to go through a cache cleanup. If the entire cache is discarded, this produces an additional `c` operations.

As these are both linear, they can be omitted from the 3-D graph for simplicity

The final worst-case time complexity of the service as a whole comes out to `o = n + (sqrt(2c) + 0.5)n + c`

https://www.desmos.com/3d/wjw4bny3to
https://www.desmos.com/calculator/mglnoluywe (variable names are different)

![Viewed from above and the side](https://github.com/im-xra-dev/chomp-timeline/raw/master/docs/timeline-complexity.png)

## Caching
The cache should automatically kill data that is too old

The cache stores information relevant to the users current session. This includes:
- info on whats already been shown to them (to avoid duplication and promote diversity in the feed)
- a pre-cached pool of posts, ranked from best to worst
- the current timeline in the order it will be sent to the user

Querying a large number of posts and crunching it down can be a slow but is required for creating
a relevant timeline feed. There is a trade-off to be made in that the more posts queried, the more
relevant the best post will be to the user, at the expense of it taking longer to process.

To save on time, a set number of posts can be cached with each query. These posts are sorted from
most to least relevant. Future queries can then be optimised by rejecting any posts that rank lower
than the worst post in this cache.

The pre-cached posts are periodically fed into the current timelines cache as the user scrolls, ensuring
that there is always posts ready for the user to view.

Multiple pre-caches can be utilized to generate a more diverse timeline. For example, 2 categories of
posts the user may want to view are from "followed sections" and "followed users". Separating these
into their own pre-caches allows both to be fed into the final feed, even if the followed user posts
are ranked lower than all of the followed sections.

Another side effect of this is finding more relevant posts. As stated earlier, larger queries will 
yield more relevant data while also taking longer. It is therefore possible to have a fully functioning
timeline while a large job is being processed into its own pre-cache, that can be fed in once completed.

This Job can also be optimized further by decreasing the cache size of ultra-relevant posts, since the
time scales linearly for a given cache size, and smaller cache sizes can be processed faster. Doing so
would therefore create a small pool of ultra-relevant posts alongside the existing pools that are
large enough for the system to run efficiently.

A final benefit to having a pre-cache and a current timeline stage is mutexes. The pre-cache is sorted
from most to least relevant. When more posts are loaded into it, a lock must be created while the
data is ordered. While this is going on, the user can still pop posts off the current timeline cache
without worrying about the background processes used to rank the posts they are fed.

## Data flow
The timeline is generated in the following stages:

#### Post Ranker Manager
The post ranker manager listens for jobs in the incoming queue and routes them through the system accordingly.

Job types are described below

#### Query

#### Dispatcher

#### Batch Calculator

#### Job Runner

#### 

## Job types

#### Init
An init job initializes the users timeline. 
This can be dispatched when a user logs in, or when the user requests their timeline and
there is no data available yet.

On top of initializing the data, it also performs a Query And Load job

#### Query And Load
It performs both the jobs of Query Next Batch and Load More

#### Query Next Batch
This job will be dispatched by the JobRunner or other internal services (such as the meal planner
to get some relevant content for the user)

It loads new posts from the database, ranks them, and moves them into the cache which can then be
either loaded into the timeline or forwarded to another internal service (such as meal planner)

#### Load More
This job gets dispatched as the user scrolls and consumes the posts in the current timeline cache to
ensure that the there are a constant stream of posts that can be fed to the user.

It pops the top x posts from the pre-cache queue and places them at the end of the current
timeline queue. This job does not need to query the database meaning it can quickly move more posts
into the users timeline as they scroll. It may, however, decide to dispatch a new query job if the 
pre-cached posts are getting low.

#### Clear Cache
The clear cache job will be dispatched by internal processes such as the meal planner to clean up
data that is no longer required. Similarly, if a user has been inactive for a given time, this job
will be dispatched.

It may also be worth while to dispatch this job for users who have been active for a long time and
have therefore generated a large cache size. At this point, the issue of re-showing the user a post
they already saw is less, as it has been a few hours. It would also allow less relevant content
that was originally skipped to be shown to the user, so their entire feed wont only contain seen posts.

The cache will also have a fail-safe that kills objects that have existed for too long to ensure that
they are not forgotten about.
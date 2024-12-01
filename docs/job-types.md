# Job types
The job types are events that the system listens for. Some may originate from outside the microservice while
others may be dispatched from within the service

## Init
An init job initializes the users timeline. 
This can be dispatched when a user logs in, or when the user requests their timeline and
there is no data available yet.

On top of initializing the data, it also performs a Query And Load job

## Query And Load
It performs both the jobs of Query Next Batch and Load More

## Query Next Batch
This job will be dispatched by the JobRunner or other internal services (such as the meal planner
to get some relevant content for the user)

It loads new posts from the database, ranks them, and moves them into the cache which can then be
either loaded into the timeline or forwarded to another internal service (such as meal planner)

## Load More
This job gets dispatched as the user scrolls and consumes the posts in the current timeline cache to
ensure that the there are a constant stream of posts that can be fed to the user.

It pops the top x posts from the pre-cache queue and places them at the end of the current
timeline queue. This job does not need to query the database meaning it can quickly move more posts
into the users timeline as they scroll. It may, however, decide to dispatch a new query job if the 
pre-cached posts are getting low.

## Clear Cache
The clear cache job will be dispatched by internal processes such as the meal planner to clean up
data that is no longer required. Similarly, if a user has been inactive for a given time, this job
will be dispatched.

It may also be worth while to dispatch this job for users who have been active for a long time and
have therefore generated a large cache size. At this point, the issue of re-showing the user a post
they already saw is less, as it has been a few hours. It would also allow less relevant content
that was originally skipped to be shown to the user, so their entire feed wont only contain seen posts.

The cache will also have a fail-safe that kills objects that have existed for too long to ensure that
they are not forgotten about.

## Write Data
Data writes received update the relationships between users and data within the graph. It can be things like
updating weight values, creating new posts, subsections, threads or users and (at some point) discovering new
connections such as grouping similar subsections together for recommendations.

Most data written is not cached and so synchronisation isn't too big of a concern. One data point that is cached,
however, is the "score" value of categories shown in the users session.

As the user scrolls and interacts with posts, this weight will change in the database, but not the cache.

For established users, this isnt too big of a concern, as if they are already have a strong connection with 
something, then updating that weight slightly wont make too much of a difference and so a delayed response to
this is not of concern.

For new users, however, it is likely to make a bigger difference as they are starting with no initial weightings.
Therefore, every vote, comment or post they make will be of more importance in feeding them relevant content.

A solution to this could be periodic cache updates which are more frequent the newer the user is. This would
be done by dispatching a new job type, though, this is not yet planned and documented.
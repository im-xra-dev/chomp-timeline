# Caching
The cache stores information relevant to the users current session. This includes:
- info on whats already been shown to them (to avoid duplication and promote diversity in the feed)
- a pre-cached pool of posts, ranked from best to worst
- the current timeline in the order it will be sent to the user
- attributes related to the cache, such as cache size and limit/skip configuration

The cache should automatically kill data that is too old, though the system will also process jobs that clear
it when required. Ideally, data should never become too old. This method of killing is a failsafe.

## Accessing redis

Redis can be accessed through the RedisCacheDriverModule and Service.

An instance can be retrieved by calling the asynchronous `getClient()` method.

There is also a `shutdown` method provided in this module, this is to be called
when the system shuts down. Calling this method before this will require a new client
instance to be setup next time `getClient` is called.

## The Problem

Querying a large number of posts and crunching it down can be a slow but is required for creating
a relevant timeline feed. There is a trade-off to be made in that the more posts queried, the more
relevant the best post will be to the user, at the expense of it taking longer to process.

To save on time, a set number of best posts can be cached with each query. These posts are sorted from
most to least relevant. Future queries can then be optimised by rejecting any posts that rank lower
than the worst post in this cache.

The pre-cached posts are periodically fed into the current timelines cache as the user scrolls, ensuring
that there is always posts ready for the user to view.

Multiple pre-caches can be utilized to generate a more diverse timeline. For example, 2 categories of
posts the user may want to view are from "followed sections" and "followed users". Separating these
into their own pre-caches allows both to be fed into the final feed, even if the best "followed user" posts
are ranked lower than all of the best "followed sections".

Another effect of multiple pre-caches is finding more relevant posts. As stated earlier, larger queries
will yield more relevant data while also taking longer. It is therefore possible to have a functioning
timeline while a large job is being processed into its own pre-cache, that can be fed in once completed.
This Job can also be optimized by decreasing the cache size it works on, as its purpose is not generating the
timeline itself, rather, finding a small handful of "ultra relevant" posts to support the existing timeline.
**(see time-complexity)**

A final benefit to having a pre-cache and moving the data into the current timeline cache is mutexes. The
pre-cache is sorted from most to least relevant. When more posts are loaded into it, a lock must be created 
while the data is re-ordered. While this is going on, the user can still pop posts off the current timeline
cache without worrying about the background ranking processes holding a lock on the data.

## Data Layout
> tline:[userid]:finalpool

The final ordered pool of posts. LPOPed to send posts to user, RSHIFTed to append more.

> tline:[userid]:precache:[cacheid]

The pre-caches store a string[] of post IDs. The left-most id can be LPOPed in constant time, or a number of
IDs can be popped at once.

> tline:[userid]:precachelock:[cacheid]

I am still researching the best way to implement the lock, though SETNX could likely be used to set a boolean.
https://redis.io/glossary/redis-lock/

> tline:[userid]:metadata:[postid]

A hash with keys to store info about the posts. Can be deleted after the post has been served to the user.

seen & vote - returned to the user to set up the UI 
score - used internally to calculate the ordering of the posts in the pre-cache.

keys:

- score: number, used to order the posts when updating the precache
- seen: boolean, used to store if the user has seen this post in a previous session
- vote: number, used to store if the user has liked/disliked this post

> tline:[userid]:percategory:[category]

A number containing how many posts from this category that have been shown in this session

> tline:[userid]:cachesize:[cacheid | "$finalpool"]

A number representing the total cache size configuration

> tline:[userid]:skip:[cacheid]

A number representing the query skip configuration

> tline:[userid]:limit:[cacheid]

A number representing the query limit configuration

> tline:[userid]:sessid

A string representing the session ID


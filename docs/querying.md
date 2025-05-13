### Terms:
Candidate post - posts that are chosen as candidates to move onto stage 2

Candidate pool - the collection of candidate posts

Target user - the user for whom this feed is being generated

Mutual - community or user interacted with by the users that the target user interacts with

# The querying system

Querying is the first stage of the pipeline to generate the target users feed. It aims
to create candidate pools of posts which are likely to be relevant to the target user
that can then be fine-tuned by the batch-calculator and sorted by the job runner.

Relevant candidate posts are determined by the connections and weights in the graph. It is
also the stage that takes into account the age of posts, by calculating a de-buff
for older candidate posts.

## Generating the candidate pools

The candidate pools are generated in sections each focusing on a specific subsection
of the graph. These can be split into 2 distinct categories, one that focuses on posts
by a given author and one that focuses on posts in a given community.

### Author based:

- Posts by users the target user interacts with 

- Posts by the target users mutual users

### Community based:

- Posts by communities the target user interacts with

- Posts in the target users mutual communities

## Maths

The math to determine the relevance of candidate posts at this stage takes into
account the following variables.

### score
- this is the personal score of the author (author based pools)
or community (community based pools)

### interaction.score
- This can be an InteractsWith score or a SimilarMutual score

For author based pools, this is the weight of the connection between the
target user and the author, for community based pools it is the weight of the
connection between the target user and the community.

### post.score
- this is the total vote score of a candidate post

### posted.datetime
- timestamp of when the candidate post was created

### The math is currently as follows
- `score * (interaction.score/100) + post.score - ($now-posted.datetime)/(1000*60*10)`

- listed in descending order

## SKIP/LIMIT

The queries provide a SKIP/LIMIT combination for specifying the size and offset of
the candidate pool.

Generally, the skip will start at 0, but should a target user scroll
long enough, this can be increased to access additional candidate posts while rejecting
ones that are likely to have been seen.

The limit determines the size of the pool. Lower limits offer faster processing times
at the expense of possibly missing more relevant content, and larger limits are the
inverse. The limit will likely be determined dynamically depending on the needs of 
the target user.

## Stage 2

The candidate pool returned by the query functions will then be parsed and sent to
stage 2 for further processing. It is essential that the data returned by these queries
matches what is required in stage 2 (see the data-flow.md query section for details).

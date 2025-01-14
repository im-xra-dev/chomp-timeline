# neo4j database design

The neo4j database contains the information required for determining relevant content for the users.
Content provided includes posts in the users feed, recipes in the users meal plans, as well as 
recommendations for posts, users, bites and recipes that the user may be interested in.

## nodes

To determine this information, nodes for the following data are stored in the database:

### User

The user node stores each user registered on the system.

_Attributes_

- id: the users ID
- score: the users total personal score.

### BITE

The BITE node stores each community on the website (called BITEs).

_Attributes_

- id: the BITEs ID
- private: boolean to determine if the community is private (thus cannot be recommended)
- members: number of members (approx) as it would be best to recommend communities that are more likely to be active.
- score: the score for how active this community is

### Thread

The thread node represents each thread in each BITE 

_Attributes_

- id: the threads ID

### Post

Each post node represents a single post on the website

_Attributes_

- id: the posts ID
- score: posts total score as upvotes - downvotes

### Recipe

Each recipe is a subtype of a post. It contains the attributes and relationships of the Post nodes, as well as

_Attributes_

- ...from post

### Tag

Tags are nodes that group similar recipes together

## relationships

The nodes have the following relationships stored between them:

### InteractsWith

User interacts with User or BITE. This represents anything from nodes that are followed,
upvoted/ downvoted or muted/blocked

_Attributes_

- followed: boolean
- muted: boolean
- score: number

### PostedIn

This relationship refers to a post and a thread and determines which threads the post
has been added to and at what time

_Attributes_

- datetime: for determining new and old posts, as well as the order posts were added

### HasThread

This links threads to their relevant BITEs (communities)

### SimilarBite

This relationship indicates which BITEs are similar to each other based on how many
users are shared between them as followers

_Attributes_

- score: number

### SimilarMutual

This relationship indicates that a user or section is similar to the specified user
based on who they follow, ie a mutual friend or a community followed by a friend

_Attributes_

- score: number

### SeenState

This is a post that the user has already viewed. It stores both vote and view data.
The existence of this connection represents the post having been viewed.

_Attributes_

- vote: number -1 <= x <= 1

### RecipeInteraction

This is used to determine which recipes the user has favourited or marked as wanting
to try at some point

_Attributes_

- favourite: boolean
- tryit: boolean
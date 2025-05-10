export const FIND_USER = "MATCH (user:User) WHERE u.id=$id";
export const RETURN_THE_DATA = "RETURN post;";

//math calculations to calculate likely candidate posts
const ORDER_BY_MATH = " * interaction.score/100 + " +
    "post.score - ($now - posted.datetime)/(1000*60*10)" +
    " DESC";
export const CALCULATE_LIKELY_USER_CANDIDATES =
    `ORDER BY authoredUser.score + ${ORDER_BY_MATH}`;
export const CALCULATE_LIKELY_BITE_CANDIDATES =
    `ORDER BY bite.score + ${ORDER_BY_MATH}`;

//users which have been interacted with by the target user
export const MATCH_INTERACTED_USER_CHAIN = "MATCH " +
    "(user)-[interaction:InteractsWith]->(authoredUser:User)-[:Authored]->" +
    "(post:Post)-[posted:PostedIn]->(thread:Thread)";

//communities that have been interacted with by the target user
export const MATCH_INTERACTED_BITE_CHAIN = "MATCH " +
    "(user)-[interaction:InteractsWith]->(bite:Bite)-[:HasThread]->" +
    "(thread:Thread)<-[posted:PostedIn]-(post:Post)";

//similar communities based on common followers
export const MATCH_SIMILAR_BITE_CHAIN = "MATCH " +
    "(user)-[:InteractsWith]->(:Bite)-[interaction:SimilarBite]->(bite:Bite)" +
    "-[:HasThread]->(thread:Thread)<-[posted:PostedIn]-(post:Post)";

//mutual users posts (follower of follower)
export const MATCH_MUTUAL_USER_CHAIN = "MATCH " +
    "(user)-[interaction:SimilarMutual]->(authoredUser:User)-[:Authored]->" +
    "(post:Post)-[posted:PostedIn]->(thread:Thread)";

//mutual bite posts (community followed by followed user)
export const MATCH_MUTUAL_BITE_CHAIN = "MATCH " +
    "(user)-[interaction:SimilarMutual]->(bite:Bite)-[:HasThread]->" +
    "(thread:Thread)<-[posted:PostedIn]-(post:Post)"

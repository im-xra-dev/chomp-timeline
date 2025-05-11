export const FIND_USER = 'MATCH (user:User) WHERE user.id=$id';
export const RETURN_THE_DATA = 'RETURN post, bite, interaction, authoredUser, optionalInteraction, postSeenState';

//optional matches check for possible relations between the user and any relevant nodes
export const OPTIONAL_USER_INTERACT_BITE =
    'OPTIONAL MATCH (user)-[optionalInteraction:InteractsWith]->(bite)';
export const OPTIONAL_USER_INTERACT_AUTHOR =
    'OPTIONAL MATCH (user)-[optionalInteraction:InteractsWith]->(authoredUser)';
export const OPTIONAL_USER_INTERACT_POST =
    'OPTIONAL MATCH (user)-[postSeenState:SeenState]->(post)';

//math calculations to calculate likely candidate posts
const ORDER_BY_MATH =
    ' * interaction.score/100 + ' + 'post.score - ($now - posted.datetime)/(1000*60*10)' + ' DESC';
export const CALCULATE_LIKELY_USER_CANDIDATES = `ORDER BY authoredUser.score ${ORDER_BY_MATH}`;
export const CALCULATE_LIKELY_BITE_CANDIDATES = `ORDER BY bite.score ${ORDER_BY_MATH}`;

//users which have been interacted with by the target user
export const MATCH_INTERACTED_USER_CHAIN =
    'MATCH ' +
    '(user)-[interaction:InteractsWith]->(authoredUser:User)-[:Authored]->' +
    '(post:Post)-[posted:PostedIn]->(thread:Thread)<-[:HasThread]-(bite:Bite)';

//communities that have been interacted with by the target user
export const MATCH_INTERACTED_BITE_CHAIN =
    'MATCH ' +
    '(user)-[interaction:InteractsWith]->(bite:Bite)-[:HasThread]->' +
    '(thread:Thread)<-[posted:PostedIn]-(post:Post)<-[:Authored]-(authoredUser:User)';

//similar communities based on common followers
export const MATCH_SIMILAR_BITE_CHAIN =
    'MATCH ' +
    '(user)-[:InteractsWith]->(:Bite)-[interaction:SimilarBite]->(bite:Bite)' +
    '-[:HasThread]->(thread:Thread)<-[posted:PostedIn]-(post:Post)<-[:Authored]-(authoredUser:User)';

//mutual users posts (follower of follower)
export const MATCH_MUTUAL_USER_CHAIN =
    'MATCH ' +
    '(user)-[interaction:SimilarMutual]->(authoredUser:User)-[:Authored]->' +
    '(post:Post)-[posted:PostedIn]->(thread:Thread)<-[:HasThread]-(bite:Bite)';

//mutual bite posts (community followed by followed user)
export const MATCH_MUTUAL_BITE_CHAIN =
    'MATCH ' +
    '(user)-[interaction:SimilarMutual]->(bite:Bite)-[:HasThread]->' +
    '(thread:Thread)<-[posted:PostedIn]-(post:Post)<-[:Authored]-(authoredUser:User)';

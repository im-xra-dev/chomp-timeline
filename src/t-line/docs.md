/** The system gets called
 *
 * generator
 *  - generates feed context for user
 *  - - Posts by followed user [cache scores on init]
 *  - - Posts by related user
 *
 *  - - Posts by followed sec [cache scores on init]
 *  - - Posts by related sec
 *  - - Posts by thread [cache scores on init]
 *
 *  - stored in cache as feed object
 *  - child feeds
 *  - populates ~50 posts initially
 *  - as supplier consumes posts, more posts are added to the queye
 *  - manages the cache object
 *
 * supplier
 *  - if no cacheobj then setup generator
 *  - return the next x IDs for user, user then gets content
 *
 */



  /**create cache stuff
     * TODO mutex while generating more posts prevent new generators
     *
     * pool:[{id, score, voteData, addedOn ..?}]
     * (note addedOn tracks when a post was added to the pool, old posts are killed (remove from seen)
     *
     * seen:{id}
     *
     * sections:[{name,score,datetime,totalInFeed}]
     * users:[{cachedUserData}]
     *
     * heartbeat
     */

    /**mode decision module
     * decide what mode
     * - followed sec
     * - recommended sec
     * - followed thread
     * - recommended thread
     * - followed user
     * - recommended user
     * - promo posts
     * - vibe stuff
     * - ....
     *
     * calculate how many posts/categories(x) to show for mode
     */

    /**section-mode decision module
     * takes in the cacheData for ordered sections
     * pops top x sections
     *
     * // posts are queried and added to Q \\
     *
     * Removes any posts already in cache
     * Rank posts
     *
     * update date&total attribs
     * re-insert based on date, total and score
     */

    /**Query posts from subsection
     * Queries neo in sec
     *    get thread name
     *    get posts id and score (post score based on votes+total comments)
     *    get postAuthors score
     *    if exists get userAuthor and userMe relation (score,follow,muted)
     *    if exists get userMe thread score
     *    if exists get userMe seen/voted on post
     *
     * (sec)->(thread {name})->(post {id,score})->
     * (userAuthor {score})-[relatedTo {score}]->(userMe)
     *
     * (userMe)-[{score}]->(thread)
     * (userMe)-[{seen,voted}]->(post)
     *
     */

    /**Math to determine whats most relevant
     * note: 2 modes, relevant and recent
     *     : relevant uses math; recent uses posted timestamp
     *
     * if cached seen post then dont show
     *
     * [cached] sec score
     * thread relation (or % of sec score if null)
     * post score
     * user relation score
     * author score
     * post seen/vote
     *
     * splice into pool based on calculated score
     */
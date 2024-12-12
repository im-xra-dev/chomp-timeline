# Time Complexity
> The problem: Given 2 inputs, an ordered list CacheIn of length c, and an unordered list Input of length n,
> find the largest c elements, returning them in an ordered list CacheOut of length c.

##### Improvements

I believe that the batched sorting would be more efficient using merge sort.

For small c values, the currently implemented method appears to have a slightly better best case, but worse worst case
than using merge sort.

Sorting against the cache appears to be less efficient when using merge sort for cache size > 10. 

I intend to do further testing once the system is able to be benchmarked for specific implementations of these algorithms.

##### Complexity

The time complexity of the sorting algorithms simplifies to a worst case of `o = (sqrt(2c) + 0.5)n` 
where:

- o is the total operations

- c is the chosen cache size

- n is the number of un-ranked posts from neo

- b is the batch count
 
With the ideal batch size of `i=sqrt(2c)`

## These equations were calculated as follows:

##### The batched sorting

The time complexity for the soring algorithm used has a worst case of increasing with respect to the
triangle numbers. This can be calculated with the equation `o = (n * (n + 1)) / 2`.

This equation can be modified to process Posts Per Batch as opposed to *all* posts by dividing n by b
like so: `o = ((n/b) * ((n/b) + 1)) / 2`. For simplicity, we will call this modified version equation `p`.

##### Sorting against cache

For every batch, we must sort the posts within the batch using `p`, then sort them into the cache.
If we assume the cache is full at the start of this process, and all posts from the batch are ranked
high enough to make it in, then our worst case scenario will be `c` operations per batch.

This is because the cache and the batch are both sorted. Therefore, we can start with
`cache[0]`, `batch[0]` and work towards `cache[c]`. Every time that the next post from cache is bigger,
it can be pushed to the end of the sorted data, and every time that the next post from the batch is
bigger, that one is pushed. Once `c` posts are sorted, the rest of the data can be discarded.

This gives the equation of `o = b(p+c)` for the total operations across all batches. This produces a
4D graph of total `o`perations for any given `c`ache and i`n`put sizes and `b`atch counts.

##### The graphs

Using this 4D graph, we can calculate its min-point for the total operations required. This took me over
2 days and yields the result of an optimal batch *size* of `sqrt(2c)`.

In the 2D desmos sheet, you can see a green graph with a min-point. This is plotted with y as operations
and x as batch count. It uses 2 sliders, for altering the input and cache sizes.

Additionally, a linear graph is plotted with additional graphs over the top of it jumping up slightly
at periodic intervals. This is plotted with y as operations and x as input size.

Altering the number of input size with the slider will move the green graph up and down as it moves along
the linear graph. Altering the cache size increases the steepness of both the green and linear graphs
while also raising the height of the green graph in line with the linear one.

##### Optimal solution

The linear graph represents the optimal solution for the worst-case scenario. It assumes that a decimal 
number of data points or batches can exist. The graphs periodically jumping off of it represent 2 different
cases. Each jump represents a new batch being created. The two cases overlap for the first batch, and one
grows closer to the optimal solution while the other always jumps by the same amount.

The one that jumps higher assumes all previous batches are fully filled, and when a new batch is created
it begins filling up from 1. The other assumes that data is evenly distributed across all batches, though
still includes decimals (for example when distributing 15 posts across 2 batches). Due to this, the
real solution will lie somewhere between these two lines, though they show that it will be more
efficient to, for example with a max batch size of 14 on 16 inputs, run 2 batches of 8 as opposed to
one batch of 14 and one batch of 2.

##### The 3D graphing sheet

In the 3D desmos sheet, the purple graph represents the 4D graph (green in the 2D version). It can be moved
through the 3-dimensional plane by increasing and decreasing the slider `b`. NOTE: IN THIS VIEW `b` 
REPRESENTS THE BATCH ***SIZE*** **NOT** THE BATCH ***COUNT***

The red graph is the 3-dimensional min point of the purple graph, plotted with the batch size set to
the optimal solution of `sqrt(2c)`. The equation `o = (n / sqrt(2c)) * (((sqrt(2c) * (sqrt(2c) + 1)) / 2) + c)`
is taken from the above equation `o = b(p+c)` re-written to have its batch size as this optimal solution.
This equation is quite long, but it can luckily be simplified down to `o = (sqrt(2c) + 0.5)n`

There are also three 2-dimensional planes that intersect these graphs. The green one represents the
cache size `c`, the blue represents the input size `n` and the orange represents the point at which
the green and blue planes intersect the red min-point graph. For any given `c`,`n` input, the data
will be sorted in the number of operations specified by this orange graph.

##### 3D graph views

The 3D graph can be viewed from different angles to calculate different time-complexities.

From the side, we see how the time complexity increases as `c` increases. It shows the operations
increasing with respect to the square root function as expected, with the steepness on the y-axis (`o`)
increasing as `n` increases.

From the top, we can view how the time complexity increases as `n` increases. It shows it increasing
linearly, with the steepness on the y-axis (`o`) increasing as `c` increases. This means that if I choose
a fixed cache size, the algorithm will sort the data and choose the most relevant posts linearly.

![Viewed from above and the side](https://github.com/im-xra-dev/chomp-timeline/raw/main/docs/time-complexity.png)

##### Final calculations

Some other operations are also required by the rest of the process, on top of the `o` operations.
Before processing can start, n operations must be performed to distribute the pool into their batches,
and after the sorting is completed, the previously pre-cached posts that have now been discarded have
to go through a cache cleanup. If the entire cache is discarded, this produces an additional `c` operations.

As these are both linear, they can be omitted from the 3-D graph for simplicity, but result in the final
worst-case time complexity of the service as a whole being `o = n + (sqrt(2c) + 0.5)n + c` when pre and post
processing are included.

##### Graphs

https://www.desmos.com/3d/wjw4bny3to

https://www.desmos.com/calculator/mglnoluywe (variable names are different)

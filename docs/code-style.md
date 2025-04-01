# The CHOMP code style guide
> The intersection of engineering and art ~ Tiger Beetle

The purpose of this guide is to ensure efficient, maintainable code makes its way into production. We want to prevent
bugs as early as possible, ensure our systems are efficient and optimized, and provide a nice experience for developers
as they work.

This style guide applies to all CHOMP services, though some sections may not be as relevant to some services as they are
to others.

It is a living document, inspired by NASA, tiger beetle, and Google, as well as the CHOMP team.
Suggestions are encouraged as we encounter new things.

## System design
All good code starts by not writing any code.

A good system starts by creating a plan for the system to follow. From this we can derive test cases and implementation
details to meet the design set out in the plan. When designing a system the following should be considered:

- Time-complexity

- Memory management

- Program flow

- Edge cases, valid and invalid data

- Error handling

## The style guide

### Warnings
Ensure that all compiler warnings acknowledged and fixed in the development stage. It is easier to fix it now than 
in 10 months when the entire system breaks because of 1000 warnings that have built up over time.

Production builds should all pass this 0 warning check. Some warnings may be ignored during development only under
strict conditions:

- unused variables and functions in source code

From time to time, we may have files that are not yet implemented, but must exist as they are referenced by another
file that is actively being developed. It is preferred that these files be left un-implemented until they can
be focused on in their own PR. This will prevent PRs with thousands of additions to check through.

Any un-implemented files must be logged. They should be implemented in their own PRs and there should be no warnings
left by the time we reach a production build.

- unused arguments in tests

Tests may occasionally override the implementation of a function to perform their checks. In this case, it is not
required that all arguments are used, provided the test performs adequate coverage.

- duplicated code in tests

Tests may contain blocks of similar code. It is advisable to create a utility/ helper function in these cases, though
duplicated code may be present only in test cases.

### Documenting code
Code should be well documented with documentation files and comments. Comments should be written as full sentences to 
convey your rationale behind why you wrote the code the way you did.

JS DOCs should be provided for functions. This is indicated with a multi-line comment starting with: `/** FunctionName`.
When abstracting part of a function into its own utility/helper function, you can use regular comments beginning with
`//util:` and then describing the purpose of this function. This is to only be done when a function solely exists as
a helper function in the same file.

Multi line comments: prefer to comment each line with a `//` over using other methods.

Do not use @ts-ignore. This only hides the error and does not resolve the issue at hand. If unsure, ask
another developer on the team for advice.

Commit messages should be [tagged] and have a clear and concise title. A description may
be provided to give extra details.

Similarly, PRs should have a clear and concise title, with a detailed description of what the PR
changes and its purpose. Imagine you are explaining whats changed to someone who doesn't work at
CHOMP.

Ensure all tests are passing before creating a PR.


### Visuals

Functions should be ordered by importance. Entry points to a file should be at the top and utilities
should be below. Functions should be ordered in the same order in which they are called (particularly
relevant to utilities/helpers) and then by alphabetical order (particularly relevant if there are
multiple entry points)

Aim to write functions that fit within the viewport of the IDE. This allows other developers to view the entire context
of a function without scrolling up and down. Some functions may extend slightly further but the developer should use
common sense to not create huge blocks of code. A hard limit of 60 lines is in place.

Similarly, aim to keep lines under 100 character long, with a hard limit at 120.

Code should be indented with 4 spaces of indentation.

Code should be separated logically with whitespace.

When defining a function, the opening `{` goes on the same line as the parameter list.

Curly braces may be omitted from single line ifs, elses and fors. This is preferred over writing the curly braces.
```ts
if(bool) line1();
else line2();

if(bool)
    reallyLongLineButStillOnlyOne();

for(...;...;...) line1(); 
```

In the case of an if-else where one branch has a block of code and one has a single line, either encase
both in curly braces, or only encase the if, leaving the else as a single line.

Similarly, if statements should be structured logically, it makes more sense to process the true condition
first and the false condition second.

```ts
//DO THIS
if(bool) {
    actionIfTrue = 1;
    actionIfTrue = 2;
} else actionIfFalse = 3;
```
```ts
//DO NOT DO
if(!bool) actionIfFalse = 3;
else {
    actionIfTrue = 1;
    actionIfTrue = 2;
}
```

### Naming conventions

Abbreviations should be avoided, unless it is explicitly clear what it means (eg `ID`)

> **URLs**
>
> URLs for APIs and user-facing pages should be named in `lower_snake_case`

> **Files**
>
> Files containing an enum or react module should be named in `UpperCamelCase`
>
> Other files and paths should be named in `lower-kebab-case`

> **Types, Classes and Modules**
>
> Types, Classes and modules should be named in `UpperCamelCase`

> **Compile-time constants**
>
>These are constants that remain the same every time that the program is run. They should be named in
> `UPPER_SNAKE_CASE` and should ideally be loaded from a configuration or env file. Constants used in test
> cases may be defined in the code, alongside the test case that they operate with.

> **Runtime constants**
>
>These are values that depend on the data the function receives, but will remain constant for the entire
> scope for which they are used. They should be preferred over variables to ensure clarity and enforce 
> immutability in the programs design. They should be named using `lowerCamelCase`.

> **Variables**
>
> Do not use `var`, instead use `let` when defining a variable. They should be named in `lowerCamelCase`.
> When defining a variable, consider refactoring the code to use a runtime constant instead.

> **indexes and counters**
>
> These are a special class of variable, which are both similar however caution should be taken when
> working with these to minimize off-by-one errors. Indexes should either follow the standard convention
> of being named `i`, or be in the format `someNameIndex`. Similarly, counters should be named in the format
> `someNameCounter`.

> **Data passed by reference**
>
> Limit passing data by reference. In cases where this is required, ensure the data is named with the
> suffix `Ref` to indicate clearly that this data is passed by reference. This should ideally be limited to
> only being passed to helper functions in the same file.

> **Mutators**
> 
> Functions that mutate a parameter from a higher scope should be clearly marked as a mutation function.
> This can either be done by using a key word such as "Insert", "Initialize" etc, or when this is not appropriate,
> should contain `_mutateAttribute` as a suffix eg `processPost_mutatesSeenCacheAndSortedList`

### Order of data definitions

Order parameters by importance. Parameters should not be mutated, any objects or lists should be annotated
as '`readonly`'. The only exception to this is rule is if the data passed is marked as `Ref`, in which case
mutations may occur. Mutable data should come first in the parameter list, followed by immutable data.


Define variables/constants at the lowest possible scope. They should be calculated and checked as close to where they
are used as possible. Similarly, do not define variables/constants before they are needed, or when it is unclear
if they will be required. Consider the following examples:

```ts
function doThis(){
    const someValue = calculateSomeValue();
    if(someValue <= 0) return; //we only want positive values

    //this code will never run if someValue is too small
    const otherValue = alterValue(someValue)
}
```
```ts
function doNotDoThis(){
    const someValue = calculateSomeValue();
    const otherValue = alterValue(someValue)
    
    //dont calculate otherValue if we do not know if we will need it. We should check someValue
    //as close to it being defined as possible (as in example 1)
    //This also links into the "push if statements as far up as possible" point

    if(someValue <= 0) return;
}
```

### ifs and fors

Push if statements as far up as possible, and for loops as far down as possible (see example below)

In example 1, we push the if statement up into the parentFunction and the for loop down into the child
which does some calculation a number of times based on how large `someValue` is.

In a real code-base, the if could likely be pushed up further so we dont even need to call the
`parentFunction` if it is less than 10.

The goal is to fail as early as possible if we know things will not succeed.

```ts
//correct example

function parentFunction(someValue: number){
    //no extra processing beyond this single check is required for invalid data
    if(someValue < 10) return;
    childFunction(someValue);
}

function childFunction(someValue: number){
    for(let i = 0; i < someValue; i++){
        //do some calculation
    }
}
```

```ts
//incorrect example 

function parentFunction(someValue: number){
    for(let i = 0; i < someValue; i++){
        childFunction(someValue);
    }
}

function childFunction(someValue: number){
    //this same check will run for every single time that the for loop calls this code, whether
    //it is valid or not. The requires `someValue` number of checks as opposed to just one in the first example.

    if(someValue < 10) return;
    //do some calculation
}
```

### Asserts

Use asserts to ensure that the code meets the desired design. In the correct example above, an assert
would be placed at the start of the child function, before the for loop. This forces us as developers 
to ensure that the code is working correctly at every level, while also providing extra documentation
on how the function should behave. Assertions should check for conditions that are impossible to occur
in production.

Each assert should check only a single condition. Compound statements (such as `a AND b`) should be
broken down into individual asserts (one for `a`, and one for `b`).

Assertions may be selectively enabled/disabled in production code, providing useful information to the
developers about what occurred to ensure it does not happen again.

### Program flow

Ensure clarity in the codes execution path by avoiding recursion. I know our company name is a recursive
acronym, but the code will not be recursive. If the control flow is simple, then not only is it clearer
to the developer how the system works, but it is also easier to analyse the code and simplifies testing.

All loops should have a fixed upper-bound of iterations so that they can be *proved* to terminate. This
prevents accidental infinite loops, or excessively large loops that may take up resources.

Loops that specifically should not terminate should be provable to be non-terminating, and are the only
exception to this rule.

### Data types

Do not use the `any` type, instead consider using a more appropriate type, or `unknown`.

Ensure all types are defined using readonly or Readonly<> where appropriate.

Redundant types are not required, for example, it is clear that `const foo = 5` is a number.

Ensure generic object types have appropriate key names. Prefer
```ts
{ [appropriateDescription: string]: number }
```
 over
 ```ts
 { [key: string]: number }
```

### Imports

Prefer to not use default imports, prefer `import {Foo} from './foo';` instead.
 
Use relative paths when importing.

When renaming imports, `import * as exampleName from './example';` over renaming each individual property.

### Strings

When embedding data into a string, use \`\` notation.

When writing long strings, separate it across multiple lines by closing the string and using + as to
avoid issues with unexpected whitespace.

### Other notes

Errors should be considered from the beginning and handled logically and carefully.

Avoid constructors like `new Array()` or `new Boolean()` as these can introduce bugs.
```ts
const y = new Boolean(true);

<< y === true
>> false

<< y === false
>> false 
```

Spread syntax may be used `[...foo]`

Use `Object.keys(someObj)` over "clever" solutions. The same applies for getting all values of an
object.

Don't override builtins. Similarly, don't add new properties to builtins.

Avoid nesting functions unless it is absolutely necessary, to improve readability.

Similarly, avoid nesting if statements.

Systems should process data from queues/ message brokers, as opposed to directly communicating with each 
other.

#### Happy coding!
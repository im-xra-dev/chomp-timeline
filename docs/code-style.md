# The CHOMP code style guide
> The intersection of engineering and art ~ Tiger Beetle

The purpose of this guide is to ensure efficient, maintainable code makes its way into production. We want to prevent
bugs as early as possible, ensure our systems are efficient and optimized, and provide a nice experience for developers
as they work.

This style guide applies to all CHOMP services, though some sections may not be as relevant to some services as they are
to others.

It is a living document, suggestions are encouraged as we encounter new things.

## System design
All good code starts by not writing any code.

A good system starts by creating a plan for the system to follow. From this we can derive test cases and implementation
details to meet the design set out in the plan. When designing a system there are some things that should be considered:

- Time-complexity

- Memory management

- Program flow

- Edge cases, valid and invalid data

# TODO text about above

## The style guide
# TODO organise into sub categories

Ensure that all compiler warnings acknowledged and fixed in the development stage. It is easier to fix it now than 
in 10 months when the entire system breaks because of 1000 warnings that have built up over time.

Ensure all tests are passing before creating a PR.

Code should be well documented with documentation files and comments. Comments should be written as full sentences to 
convey your rationale behind why you wrote the code the way you did.

JS DOCs should be provided for functions. This is indicated with a multi-line comment starting with: `/** FunctionName`
When abstracting part of a function into its own utility/helper function, you can use regular comments beginning with
`//util:` and then describing the purpose of this function. This is to only be done when a function solely exists as
a helper function in the same file.

Multi line comments: prefer to comment each line with a `//` over using other methods.



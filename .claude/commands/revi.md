Review GitHub issue #$ARGUMENTS and prepare an assessment for the Human Contributor (HC).

## Steps

1. **Read the issue** using `gh issue view $ARGUMENTS` including comments
2. **Analyze the request** — identify what's being asked, what systems are affected, and what constraints exist
3. **Explore the codebase** — read relevant files to understand the current state of the code that would be affected
4. **Identify unknowns** — list anything ambiguous or underspecified in the issue
5. **Ask clarifying questions** — if there are gaps in the requirements, ask the HC before proceeding
6. **Provide an assessment** with:
   - Summary of what the issue is asking for
   - Which files/systems will be affected
   - Complexity assessment (small, medium, large)
   - 2-3 implementation options with trade-offs
   - Recommended option and why

## Output Format

Post your assessment as a comment on the issue using `gh issue comment $ARGUMENTS --body "..."`.

Also display the assessment in the conversation so the HC can discuss before choosing an option.

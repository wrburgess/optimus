Create an implementation plan for GitHub issue #$ARGUMENTS based on the chosen option from the assessment.

## Steps

1. **Read the issue and comments** using `gh issue view $ARGUMENTS --comments` to get the full context including the assessment and HC's chosen option
2. **Break down the work** into discrete, ordered tasks
3. **Identify files to create or modify** for each task
4. **Determine the test strategy** — what specs to write or update, referencing patterns in `spec/support/shared_contexts/`
5. **Determine the workflow**:
   - Branch naming: `feature/`, `fix/`, `chore/`, or `docs/` prefix
   - Whether parallel agents would help (independent tasks across different files/systems)
   - Whether worktrees are needed (large changes that benefit from isolation)
6. **Check for risks** — migration safety, authorization changes, breaking changes to existing behavior
7. **Write the plan** in a structured format

## Output Format

Post the plan as a comment on the issue using `gh issue comment $ARGUMENTS --body "..."`.

The plan should include:

```markdown
## Implementation Plan

### Workflow
- Branch: `feature/issue-NNN-description`
- Agent strategy: [single agent | parallel agents with breakdown]
- Estimated scope: [files to change, specs to write]

### Tasks
1. [Task description] — [files affected]
2. [Task description] — [files affected]
...

### Test Plan
- [What specs to add/modify]
- [Edge cases to cover]

### Risks & Considerations
- [Any migration, authorization, or breaking change concerns]
```

Also display the plan in the conversation for HC review before execution.

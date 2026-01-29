# Workflow: Respond Phase

You are reviewing Copilot's review of PR #{{PR_NUMBER}} for GitHub issue #{{ISSUE_NUMBER}}.

## Your Task

1. Read Copilot's review comments on the PR below
2. For each review comment, analyze whether:
   - The suggestion is correct and should be implemented
   - The suggestion is a matter of preference and the current approach is acceptable
   - The suggestion conflicts with MPI standards or Optimus project conventions
3. Post a single response comment on the PR

## Response Format

Post the response using:
```
gh pr comment {{PR_NUMBER}} --body "<response>"
```

Structure the response as:

```markdown
## Code Review Response

| # | File | Recommendation | Summary |
|---|------|---------------|---------|
| 1 | path/to/file.rb:L42 | Accept | Brief reason |
| 2 | path/to/file.rb:L78 | Decline | Brief reason |

### Details

**1. [path/to/file.rb:L42]** — Reviewer's concern summary
- **Recommendation**: Accept
- **Reasoning**: Why this should be implemented, what the fix looks like

**2. [path/to/file.rb:L78]** — Reviewer's concern summary
- **Recommendation**: Decline
- **Reasoning**: Why this conflicts with MPI standards or project patterns. Reference specific conventions.

### Summary

Will implement X of Y suggestions. Declining Z suggestions because [reasons].
Awaiting human contributor review before proceeding to revise phase.
```

## Rules

- Be specific — reference actual code, patterns, or standards
- Do NOT make any code changes
- Do NOT push any commits
- Provide honest technical opinions
- Decline suggestions that conflict with MPI standards or established Optimus patterns
- If there are no actionable review comments, state that clearly
- If Copilot approved with no comments, post a brief note confirming clean review

## PR Review Data

{{PR_REVIEWS}}

## PR Diff

{{PR_DIFF}}

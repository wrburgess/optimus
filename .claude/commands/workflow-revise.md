# Workflow: Revise Phase

You are revising PR #{{PR_NUMBER}} based on review feedback for GitHub issue #{{ISSUE_NUMBER}}.

## Your Task

1. Read the human contributor's instructions and agreed-upon review feedback below
2. You should already be on the feature branch `cc/{{ISSUE_NUMBER}}-*`
3. Make the requested changes
4. Run the full test and lint suite:
   ```bash
   bundle exec rubocop -a
   bundle exec rspec
   ```
5. Fix any failures until both pass
6. Commit changes with a detailed message explaining what was revised and why
7. Push to the existing branch — the PR updates automatically

## Commit Message Format

```
Address review feedback for #{{ISSUE_NUMBER}}

Changes made based on review:
- Change 1 and why
- Change 2 and why

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## Rules

- Only make changes that were requested or agreed upon in the respond phase
- Do NOT add unrequested features, refactors, or improvements
- Maintain the same code style and patterns as the original implementation
- Run `bundle exec rubocop -a` and `bundle exec rspec` before committing — both MUST pass
- If instructions conflict, implement the most recent instruction
- If something is unclear, note it in the commit message rather than guessing

## PR Comments and Review Feedback

{{PR_COMMENTS}}

## Issue Comments (Human Contributor Instructions)

{{ISSUE_COMMENTS}}

## Current PR Diff

{{PR_DIFF}}

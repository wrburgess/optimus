# Workflow: Implement Phase

You are implementing GitHub issue #{{ISSUE_NUMBER}} for the Optimus Rails project.

## Your Task

1. Read the GitHub issue and the human contributor's instructions from the issue comments below
2. You should already be on the feature branch `cc/{{ISSUE_NUMBER}}-*`
3. Implement the changes according to the approved plan and any HC feedback
4. Run the full test and lint suite:
   ```bash
   bundle exec rubocop -a
   bundle exec rspec
   ```
5. Fix any failures until both pass
6. Commit all changes with a detailed commit message following MPI standards
7. Push the branch to origin
8. Create a PR using `gh pr create` that:
   - References the issue with `Closes #{{ISSUE_NUMBER}}` in the body
   - Follows the MPI PR description format (Summary, Changes Made, Technical Approach, Testing, Context)

## Commit Message Format

```
Brief summary (50 chars or less)

Detailed explanation of changes:
- What was changed and why
- Technical approach taken
- Edge cases handled

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

## PR Body Format

Use the MPI PR description format including:
- Summary
- Changes Made (bullet points with file paths)
- Technical Approach
- Testing
- Context for Future Contributors
- `Closes #{{ISSUE_NUMBER}}`

## Rules

- Implement ALL changes needed, not partial work
- Follow existing Optimus patterns:
  - ViewComponents for UI components
  - Pundit policies for authorization
  - Model concerns for shared behavior
  - Modules in `app/modules/` for enumerables
  - tom-select for admin form selects
  - floating_label_form wrapper for other inputs
- New models need: migration, factory, model spec, request spec, policy, policy spec
- Run `bundle exec rubocop -a` and `bundle exec rspec` before committing — both MUST pass
- Do NOT add unrequested features or refactors

## GitHub Issue Data

{{ISSUE_DATA}}

## Issue Comments (Human Contributor Instructions)

{{ISSUE_COMMENTS}}

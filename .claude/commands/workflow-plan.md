# Workflow: Plan Phase

You are working on GitHub issue #{{ISSUE_NUMBER}} for the Optimus Rails project.

## Your Task

1. Read and analyze the GitHub issue provided below
2. Pull the latest main branch: `git pull origin main`
3. Create a feature branch named `cc/{{ISSUE_NUMBER}}-<short-kebab-description>` from `main`
   - The description should be 2-4 words summarizing the issue (e.g., `cc/42-add-user-export`)
4. Thoroughly explore the codebase to understand:
   - Existing patterns relevant to this feature
   - Files that will need to be created or modified
   - Related models, controllers, components, and specs
5. Post an implementation plan as a comment on issue #{{ISSUE_NUMBER}}

## Plan Format

Post the plan using:
```
gh issue comment {{ISSUE_NUMBER}} --body "<plan>"
```

The plan must include these sections:

### Summary
One-paragraph overview of what will be implemented.

### Files to Create
List of new files with brief purpose for each.

### Files to Modify
List of existing files with description of planned changes.

### Architecture Decisions
Patterns, gems, or approaches chosen and why. Reference existing Optimus patterns (ViewComponents, concerns, modules, Pundit policies, etc.) where applicable.

### Testing Strategy
What specs will be written and what they will cover.

### Open Questions
Anything unclear that needs human input before implementation. If none, state "None — requirements are clear."

### Estimated Scope
Small (1-3 files) / Medium (4-10 files) / Large (10+ files)

## Rules

- Do NOT implement any code changes
- Do NOT create a PR
- Do NOT modify any project files (only create the branch)
- Focus on thorough codebase analysis and a clear, actionable plan
- Reference existing patterns in the codebase
- Follow the architecture described in CLAUDE.md

## GitHub Issue Data

{{ISSUE_DATA}}

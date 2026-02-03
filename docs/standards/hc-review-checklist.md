# Human Contributor Review Checklist

This checklist covers what a Human Contributor (HC) should verify when reviewing work produced by an AI agent. These are things automated tests and AI review are less reliable at catching.

## Business Logic

- [ ] Does the implementation match the actual business requirement, not just the literal description?
- [ ] Are edge cases from real-world usage handled (not just happy path)?
- [ ] Do notification topics and messages make sense to end users?
- [ ] Are permission names and groupings logical for the admin workflow?

## User Experience

- [ ] Do flash messages read naturally?
- [ ] Is the sort order on index pages sensible for the data type?
- [ ] Are form field labels clear to non-technical users?
- [ ] Do filter options on index pages cover common search patterns?
- [ ] Is the show page layout logical — most important fields first?

## Data Integrity

- [ ] Are `dependent:` options correct? (`:destroy` vs `:nullify` vs `:restrict_with_error`)
- [ ] Do validations match the actual business constraints (not just "presence: true" on everything)?
- [ ] Are uniqueness constraints at both model and database level?
- [ ] Could this migration fail on existing production data?

## Performance

- [ ] Check development logs for N+1 queries on new pages
- [ ] Are `includes` / `eager_load` used when iterating associated records?
- [ ] Do new indexes make sense without hurting write performance?
- [ ] Are export queries efficient for large datasets?

## Security

- [ ] Is authorization correct — not just present, but checking the right permission?
- [ ] Are new Ransack attributes appropriately scoped (no sensitive fields exposed)?
- [ ] Is `ransackable_associations` limited to what users should be able to search?

## Agent-Specific Concerns

- [ ] Did the agent follow existing patterns or introduce new ones? (New patterns need justification)
- [ ] Is the agent attribution present on all commits and comments?
- [ ] Did the agent over-engineer? (Extra abstractions, unused configurability, defensive code for impossible states)
- [ ] Are there any "AI-isms" — overly verbose comments, unnecessary nil checks, generic error messages?

## Before Approving

- [ ] Pull the branch and run `bin/dev` — does the page actually work?
- [ ] Click through the UI flow manually
- [ ] Check the browser console for JavaScript errors
- [ ] Verify the page looks correct on a narrow viewport (responsive)

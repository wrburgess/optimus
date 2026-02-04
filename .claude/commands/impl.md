Execute the implementation plan for GitHub issue #$ARGUMENTS.

## Steps

1. **Read the issue, plan, and agent strategy** using `gh issue view $ARGUMENTS --comments`
2. **Check current branch** — if on `main`, create the feature branch specified in the plan
3. **Execute each task** in the planned order:
   - Write or modify code following patterns in `CLAUDE.md` and `docs/architecture/overview.md`
   - Write or update specs following patterns in `spec/support/shared_contexts/`
   - Use `authorize` in all admin controller actions
   - Use tom-select for admin form selects, floating_label_form for other inputs
   - Include `Loggable` concern for audit trails on new models
   - Follow the enumerable pattern for new status/type constants
4. **Run quality checks**:
   ```bash
   bundle exec rubocop -a
   bundle exec rspec
   bin/brakeman --no-pager -q
   bin/bundler-audit check
   ```
   Fix any failures before proceeding.
5. **Commit with detailed message** following the format in `CLAUDE.md`
6. **Push and create PR**:
   - Push branch with `git push -u origin <branch>`
   - Create PR with `gh pr create` using the format in `CLAUDE.md`
   - Link to the issue with `Closes #$ARGUMENTS`
7. **Post implementation notes on the PR** as a comment documenting what was done, decisions made during implementation, and anything the reviewer should pay attention to
8. **Post a brief update on the issue** linking to the PR (e.g., "Implementation PR: #NNN")

## Quality Gates

Do NOT create the PR until:
- [ ] `bundle exec rubocop -a` passes with no offenses
- [ ] `bundle exec rspec` passes with no failures
- [ ] `bin/brakeman --no-pager -q` passes with no new warnings
- [ ] `bin/bundler-audit check` passes with no vulnerabilities
- [ ] All planned tasks are complete
- [ ] Commit message follows CLAUDE.md format
- [ ] PR description includes Summary, Changes, Technical Approach, Testing, and Checklist sections

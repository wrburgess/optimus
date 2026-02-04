# MPI Code Review Standards

These standards apply to all reviewers: Human Contributors (HC), Claude Code (CC), and Codex (CDX).

## Automated Checks (Must Pass)

Before any review begins, all four must pass:

- `bundle exec rubocop -a` — zero offenses
- `bundle exec rspec` — zero failures, coverage above baseline minimum (currently 66%, ratcheting toward 90%)
- `bin/brakeman --no-pager -q` — no new warnings
- `bin/bundler-audit check` — no known vulnerabilities

## Authorization

- [ ] Every admin controller action calls `authorize` (Pundit)
- [ ] Index actions use `policy_scope` for query filtering
- [ ] New policies inherit from `AdminApplicationPolicy`
- [ ] Policy specs test both grant and deny for each permission
- [ ] Views conditionally render actions based on `policy(resource).action?`
- [ ] No hard-coded permission checks (always go through the SystemPermission chain)

## Database

- [ ] Migrations are reversible (include `change` or paired `up`/`down`)
- [ ] Migrations pass `strong_migrations` checks (no unsafe operations without `safety_assured`)
- [ ] New columns with foreign keys have `dependent:` specified on the association
- [ ] Indexes added for columns used in `WHERE`, `ORDER BY`, or joins
- [ ] No N+1 queries — use `includes` or `eager_load` for associated data
- [ ] Raw SQL only in export methods (`collection_export_xlsx`) — use ActiveRecord elsewhere

## Security

- [ ] Strong parameters used for all create/update actions
- [ ] No user input interpolated into SQL (use parameterized queries)
- [ ] No secrets or credentials in code (use Rails credentials)
- [ ] External links use `target: "_blank", rel: "noopener noreferrer"` (use `external_link_to` helper)
- [ ] Brakeman scan produces no new warnings

## Patterns

- [ ] Models include appropriate concerns: `Archivable`, `Loggable`, `Notifiable`
- [ ] Enumerable constants follow the module + concern pattern (see `CLAUDE.md`)
- [ ] Controllers use `controller_class` helper, not hard-coded class names
- [ ] Redirects use `polymorphic_path([:admin, instance])`, not hard-coded paths
- [ ] Flash messages use `instance.class_name_title` for consistent naming
- [ ] Soft delete via `archive` — never hard `destroy` on archivable records
- [ ] Every mutation logged via `.log(user:, operation:, meta:, original_data:)`

## Forms

- [ ] Select inputs use tom-select (`as: :tom_select`, `wrapper: :tom_select_label_inset`)
- [ ] Text inputs use `wrapper: :floating_label_form`
- [ ] Booleans use `wrapper: :custom_boolean_switch`
- [ ] Date inputs use `wrapper: :datepicker`
- [ ] Forms use `simple_form_for([:admin, instance])`

## ViewComponents

- [ ] New components inherit from `ApplicationComponent`
- [ ] Components follow directory structure: `app/components/admin/name/component.rb` + `component.html.erb`
- [ ] Authorization checked via `render?` method (not in the template)
- [ ] Components use `renders_many` or `renders_one` for slots
- [ ] Previews added in `spec/components/previews/`

## Tests

- [ ] New models have model specs with factory, association, and validation tests
- [ ] New controllers have request specs with three auth contexts
- [ ] New policies have policy specs testing grant and deny
- [ ] New jobs have job specs testing behavior and side effects
- [ ] Shared examples used for concerns
- [ ] See `docs/standards/testing.md` for full testing standards

## Documentation

- [ ] Non-obvious logic has inline comments explaining why (not what)
- [ ] New systems have documentation in `docs/`
- [ ] `CLAUDE.md` updated if new patterns or commands are introduced
- [ ] Commit messages follow the format in `CLAUDE.md`

## Agent Attribution

- [ ] Every commit has a `Co-Authored-By` trailer for the agent that wrote it
- [ ] PR description includes agent attribution footer
- [ ] Issue/PR comments include agent attribution line

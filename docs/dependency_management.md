## Dependency Management

### Runtime Versions via mise
- Install mise (https://mise.jdx.dev/) and ensure it is available on your PATH.
- Rely on the repository `.tools-versions` file so mise stays backward compatible with asdf.
- Run `mise install` after cloning or when `.tools-versions` changes; this installs the pinned Ruby, Node, and PostgreSQL versions.
- Use `mise use` to switch versions temporarily if you need to test multiple runtimes, but commit only changes that align with the shared `.tools-versions`.

### Ruby Gems
- Pin gem versions directly in `Gemfile` (no floating `~>` or `>=` ranges) so dependency upgrades are deliberate.
- Document intentional holds caused by breaking changes by appending a comment in `Gemfile` with the pattern `# [new version] breaking changes`.
- When removing that suffix, include release notes or migration details in the pull request so the next maintainer sees why the constraint changed.

### Updates Workflow
- Prefer running `bundle outdated` to review available upgrades, then update gems individually to keep diffs small.
- For Node or Postgres runtime bumps, adjust `.mise.toml`, run `mise install`, and confirm application compatibility before merging.
- After dependency updates, execute the full test suite and lint checks to validate the ecosystem remains stable.

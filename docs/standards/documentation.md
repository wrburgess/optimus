# MPI Documentation Standards

## When to Write Documentation

- New systems or subsystems (e.g., notification system, permission system)
- Non-obvious architectural decisions
- Agent guides for complex features (how an AI agent should implement changes)
- Standards that govern how code is written or reviewed

Do **not** document:
- Standard CRUD operations (the patterns are in `CLAUDE.md`)
- Individual model fields (the schema is self-documenting)
- Obvious code (let the code speak for itself)

## Where Documentation Lives

| Type | Location | Example |
|------|----------|---------|
| Agent instructions | `CLAUDE.md` (root) | Commands, architecture, patterns |
| Copilot instructions | `.github/copilot-instructions.md` | Same knowledge, Copilot format |
| Architecture docs | `docs/architecture/` | System overviews, model relationships |
| Standards | `docs/standards/` | Testing, code review, style standards |
| System guides | `docs/` | Notification system, permissions, credentials |
| Agent implementation guides | `docs/` | `*_agent_guide.md` files |
| Research notes | `docs/research/` | Investigation findings, analysis |

## Document Format

All documentation is Markdown. Use:

- ATX headers (`#`, `##`, `###`) — not underline style
- Fenced code blocks with language identifier (````ruby`, ````bash`, ````erb`)
- Tables for structured data
- Bullet lists for unordered items, numbered lists for sequential steps

## CLAUDE.md Maintenance

`CLAUDE.md` is the primary agent instruction file. Update it when:

- New patterns are established (e.g., a new form wrapper type)
- Commands or tools change (e.g., new gem, changed build process)
- Architecture changes (e.g., new controller base class)
- New standards documents are created (add to the Documentation section)

Do **not** add to `CLAUDE.md`:
- Detailed implementation guides (put in `docs/`)
- Temporary information (put in issue comments)
- Content already in referenced docs (link instead of duplicate)

## Commit Messages

Follow the format in `CLAUDE.md`:
- Brief summary line (50 chars or less)
- Blank line, then detailed explanation
- What changed, why, technical approach, edge cases
- `Co-Authored-By` trailer for agent attribution

## PR Descriptions

Follow the format in `CLAUDE.md`:
- Summary, Changes Made, Technical Approach, Testing, Checklist
- Link to related issue with `Closes #NNN` or `Part of #NNN`
- Agent attribution footer

## Inline Code Comments

Add comments for:
- Business rules or domain logic that isn't obvious from the code
- Workarounds with links to the issue they work around
- Performance optimizations explaining why the approach was chosen
- Security-sensitive code explaining the threat model

Do **not** comment:
- What the code does (the code should be readable)
- Standard Rails patterns (readers are expected to know Rails)
- TODOs without a linked issue (create an issue instead)

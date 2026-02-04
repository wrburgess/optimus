Run a database health check and report findings for the Optimus application.

## Steps

1. **Check for missing indexes** — identify columns used in WHERE, ORDER BY, or JOIN clauses that lack indexes:
   ```bash
   bundle exec rails runner "PgHero.missing_indexes.each { |i| puts \"#{i[:table]}.#{i[:columns].join(', ')} — #{i[:index_name]}\" }"
   ```
   If PgHero is not available via runner, query directly:
   ```bash
   bundle exec rails dbconsole -e development <<SQL
   SELECT schemaname, relname, seq_scan, idx_scan
   FROM pg_stat_user_tables
   WHERE seq_scan > 1000 AND idx_scan < 100
   ORDER BY seq_scan DESC
   LIMIT 20;
   SQL
   ```

2. **Check for unused indexes** — indexes that exist but are never used (waste write performance):
   ```bash
   bundle exec rails runner "PgHero.unused_indexes.each { |i| puts \"#{i[:table]}.#{i[:index]} — #{i[:size]}\" }"
   ```

3. **Check for duplicate indexes** — indexes that overlap with other indexes:
   ```bash
   bundle exec rails runner "PgHero.duplicate_indexes.each { |i| puts \"#{i[:table]}: #{i[:indexes].map { |idx| idx[:name] }.join(' overlaps ')}\" }"
   ```

4. **Check for table bloat** — tables with significant dead tuple buildup:
   ```bash
   bundle exec rails dbconsole -e development <<SQL
   SELECT relname, n_live_tup, n_dead_tup,
          ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct
   FROM pg_stat_user_tables
   WHERE n_dead_tup > 1000
   ORDER BY n_dead_tup DESC
   LIMIT 15;
   SQL
   ```

5. **Check for slow queries** (if pg_stat_statements is enabled):
   ```bash
   bundle exec rails runner "PgHero.slow_queries.first(10).each { |q| puts \"#{q[:total_time].round(1)}ms — #{q[:query][0..100]}\" }"
   ```

6. **Check for long-running queries**:
   ```bash
   bundle exec rails runner "PgHero.long_running_queries.each { |q| puts \"PID #{q[:pid]} — #{q[:duration]} — #{q[:query][0..80]}\" }"
   ```

7. **Check database size and growth**:
   ```bash
   bundle exec rails runner "puts PgHero.database_size"
   bundle exec rails runner "PgHero.table_sizes.first(15).each { |t| puts \"#{t[:table]}: #{t[:size]}\" }"
   ```

## Output Format

Present findings in the conversation with this structure:

```markdown
## Database Health Report

### Summary
- **Overall health:** [good | needs attention | critical]
- **Database size:** [size]
- **Tables checked:** [count]

### Missing Indexes (Action Required)
| Table | Columns | Sequential Scans | Recommendation |
|-------|---------|-------------------|----------------|

### Unused Indexes (Consider Removing)
| Table | Index | Size | Recommendation |
|-------|-------|------|----------------|

### Table Bloat
| Table | Live Rows | Dead Rows | Dead % | Recommendation |
|-------|-----------|-----------|--------|----------------|

### Slow Queries
| Time (ms) | Query | Recommendation |
|-----------|-------|----------------|

### Recommendations
1. [Prioritized list of actions]
```

If any issues are found, ask the HC whether to create GitHub issues for the actionable items.

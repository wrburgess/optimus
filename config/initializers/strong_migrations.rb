# Mark existing migrations as safe so strong_migrations only checks new ones.
# Set to the timestamp of the latest existing migration. Update when adding strong_migrations
# to a project with pre-existing migrations, not on every `db:migrate` run.
StrongMigrations.start_after = 20260119170658

# Safe PostgreSQL defaults
StrongMigrations.target_postgresql_version = "17"

# Recommended safe operations configuration
StrongMigrations.enabled_checks = [
  :add_column_default,
  :add_index,
  :add_reference,
  :change_column,
  :change_column_default,
  :change_column_null,
  :create_table,
  :execute,
  :remove_column,
  :remove_index,
  :rename_column,
  :rename_table
]

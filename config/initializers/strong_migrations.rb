# Mark existing migrations as safe so strong_migrations only checks new ones.
# Update this value after running `bin/rails db:migrate` on any new migration.
StrongMigrations.start_after = 20250203000000

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

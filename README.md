# Optimus

- A template for a Ruby on Rails application

## Cross-Repository Context Setup (Optional)

This repository is part of a multi-repo ecosystem (avails, sfa, garden, harvest, optimus). To enable Claude Code to seamlessly reference and work with code across all related repositories:

1. Create `.claude/projects.local.json` in the project root (this file is gitignored):

```json
{
  "local_paths": {
    "avails": "/path/to/your/avails_server",
    "sfa": "/path/to/your/wpa_film_library",
    "garden": "/path/to/your/garden",
    "harvest": "/path/to/your/harvest",
    "optimus": "/path/to/your/optimus"
  }
}
```

2. Replace each path with your actual local directory paths

**Benefits:**
- Claude Code can reference patterns from other repos (e.g., "how does avails handle authorization?")
- Enable cross-repo code replication and consistency
- Faster file access compared to fetching from GitHub

**Note:** This is optional. If you don't create this file, Claude Code can still work using the GitHub URLs defined in `.claude/projects.json`.

## Credentials

- See the [Credentials Management](docs/credentials_management.md) document

## Dependency Management

- See the [Dependency Management](docs/dependency_management.md) document

## Notification System

- See the [Notification System](docs/notification_system.md) document

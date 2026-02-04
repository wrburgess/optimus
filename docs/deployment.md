# MPI Deployment Guide

> **Status: In planning.** Kamal is configured but not yet deployed to production. Update this document when Kamal is adopted.

## Overview

Optimus uses [Kamal](https://kamal-deploy.org/) for containerized deployment. Kamal builds a Docker image, pushes it to a registry, and deploys it to one or more servers via SSH with zero-downtime rolling restarts.

## Architecture

```
┌──────────────┐      ┌──────────────┐
│  Developer   │      │   CI/CD      │
│  (local)     │      │  (GitHub     │
│              │      │   Actions)   │
└──────┬───────┘      └──────┬───────┘
       │                     │
       │  bin/kamal deploy   │
       ▼                     ▼
┌──────────────────────────────────┐
│         Container Registry       │
│  (localhost:5555 — update for    │
│   production registry)           │
└──────────────┬───────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────┐    ┌──────────┐
│  Web     │    │  Worker  │
│  Server  │    │  Server  │
│  (Puma)  │    │  (Jobs)  │
└──────────┘    └──────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `config/deploy.yml` | Kamal deployment configuration |
| `Dockerfile` | Production container image build |
| `.kamal/secrets` | Encrypted deployment secrets |
| `.kamal/hooks/` | Pre/post deployment hook scripts |

## Configuration

### `config/deploy.yml`

The main Kamal configuration defines:

- **Service name:** `optimus`
- **Servers:** Web servers listed under `servers.web`, worker servers under `servers.job`
- **Registry:** Container image registry (update from `localhost:5555` for production)
- **Environment variables:** Injected into containers via `env.clear` and `env.secret`
- **Volumes:** Persistent storage at `optimus_storage:/rails/storage`
- **Builder:** Targets `amd64` architecture

### Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `RAILS_MASTER_KEY` | `.kamal/secrets` | Decrypts Rails credentials |
| `SOLID_QUEUE_IN_PUMA` | `deploy.yml` | Runs background jobs in the Puma process |
| `WEB_CONCURRENCY` | `deploy.yml` | Number of Puma worker processes |
| `JOB_CONCURRENCY` | `deploy.yml` | Number of Solid Queue worker threads |
| `DB_HOST` | `deploy.yml` | PostgreSQL server address |

### Splitting Web and Worker

By default, Solid Queue runs inside Puma (`SOLID_QUEUE_IN_PUMA: true`). For production scale:

1. Set `SOLID_QUEUE_IN_PUMA: false`
2. Uncomment the `servers.job` section in `deploy.yml`
3. Point job servers to the same database

## Deployment Commands

```bash
# Deploy latest code
bin/kamal deploy

# Deploy with specific version
bin/kamal deploy --version=abc123

# View deployment logs
bin/kamal logs

# Open Rails console on server
bin/kamal console

# Open shell on server
bin/kamal shell

# Open database console
bin/kamal dbc

# Check deployment status
bin/kamal details

# Roll back to previous version
bin/kamal rollback
```

## Pre-Deploy Hooks

The `.kamal/hooks/pre-deploy` script gates deployments on GitHub CI status:

1. Fetches the latest commit SHA
2. Checks GitHub Actions status via the API (uses Octokit)
3. Blocks deployment if CI checks have not passed

This ensures only tested code reaches production.

## Deployment Checklist

Before deploying:

- [ ] All CI checks pass (automated via pre-deploy hook)
- [ ] `bundle exec rubocop -a` — zero offenses
- [ ] `bundle exec rspec` — zero failures
- [ ] `bin/brakeman --no-pager -q` — no new warnings
- [ ] `bin/bundler-audit check` — no known vulnerabilities
- [ ] Database migrations are safe (`strong_migrations` checked)
- [ ] Credentials are updated if new secrets were added
- [ ] `CHANGELOG` updated (if maintained)

## Rollback Procedure

If a deployment introduces issues:

```bash
# Roll back to the previous version
bin/kamal rollback

# Verify the rollback
bin/kamal details
bin/kamal logs
```

For database migrations that need reversal:

```bash
# Connect to the server
bin/kamal shell

# Inside the container
bin/rails db:rollback STEP=1
```

**Important:** Only roll back migrations that are safely reversible. If a migration added a column that new code depends on, rolling back the migration without rolling back the code will cause errors.

## SSL / Proxy Configuration

Kamal supports automatic SSL via Let's Encrypt:

```yaml
# config/deploy.yml
proxy:
  ssl: true
  host: app.example.com
```

Requirements:
- DNS must point to the server before enabling
- Enable `config.assume_ssl` and `config.force_ssl` in `config/environments/production.rb`
- If using Cloudflare, set SSL/TLS mode to "Full"
- Don't use Kamal's SSL proxy with multiple web servers (terminate SSL at the load balancer instead)

## Multi-Server Setup

For scaling beyond a single server:

```yaml
servers:
  web:
    - 192.168.0.1
    - 192.168.0.2
  job:
    hosts:
      - 192.168.0.3
    cmd: bin/jobs
```

Considerations:
- All servers must connect to the same PostgreSQL database
- Persistent storage (`optimus_storage`) must be on shared/networked storage or migrated to S3
- SSL termination moves to a load balancer

## Accessories

Kamal can manage supporting services (database, Redis, etc.) as accessories. These are currently commented out in `deploy.yml`. When needed:

```yaml
accessories:
  db:
    image: postgres:17
    host: 192.168.0.2
    port: "127.0.0.1:5432:5432"
    env:
      secret:
        - POSTGRES_PASSWORD
    directories:
      - data:/var/lib/postgresql/data
```

## TODO

- [ ] Configure production container registry
- [ ] Set up production server(s)
- [ ] Configure SSL/TLS
- [ ] Set up monitoring and alerting
- [ ] Document production database backup strategy
- [ ] Configure log aggregation
- [ ] Load testing before launch

## Reference

- [Kamal documentation](https://kamal-deploy.org/)
- [Kamal GitHub](https://github.com/basecamp/kamal)
- [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/)

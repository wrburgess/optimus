## Credentials Management

- We keep separate encrypted credentials per environment in `config/credentials/<environment>.yml.enc` (for example `development.yml.enc`, `staging.yml.enc`, `production.yml.enc`).
- Generate or edit a specific environment file with `bin/rails credentials:edit --environment development` (replace `development` with the target environment); the command also creates the matching key file at `config/credentials/<environment>.key`.
- Never commit the `.key` files; store them in a team password manager such as 1Password, and configure staging/production keys as `RAILS_MASTER_KEY` environment variables in their respective deployments.
- If the encrypted file is missing locally, copy it from the shared source or recreate it with the command above, then re-run to add the required secrets.
- Rails' guidance on multi-environment credentials is documented here: https://guides.rubyonrails.org/security.html#environment-credentials

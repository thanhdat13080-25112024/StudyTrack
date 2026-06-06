# Branch Protection — `main`

`main` must stay always-green and deployable: a merge to `main` triggers the
auto-deploy workflow (`.github/workflows/deploy.yml`). Protect it so nothing
lands without a PR and passing CI.

## Apply in GitHub UI

Repo → **Settings → Branches → Add branch ruleset** (or classic
**Branch protection rules**) targeting `main`:

1. **Require a pull request before merging**
   - ✅ Require a pull request before merging
   - (optional) Require 1 approval
   - ✅ Dismiss stale approvals when new commits are pushed
2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Add these **required status checks** (exact job names from `ci.yml`):
     - `test`
     - `lint`
     - `migrate-check`
3. **Do not allow bypassing the above settings** (apply to admins too).
4. ✅ Restrict / block force pushes and deletions on `main`.

> The required-check names must match the job `name:` values in
> `.github/workflows/ci.yml` exactly: **`test`**, **`lint`**, **`migrate-check`**.
> They only appear in the picker after the workflow has run at least once on a PR.

## Equivalent via `gh` CLI (classic protection)

```bash
gh api -X PUT repos/:owner/:repo/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f 'required_status_checks[strict]=true' \
  -f 'required_status_checks[contexts][]=test' \
  -f 'required_status_checks[contexts][]=lint' \
  -f 'required_status_checks[contexts][]=migrate-check' \
  -f 'enforce_admins=true' \
  -f 'required_pull_request_reviews[required_approving_review_count]=1' \
  -f 'restrictions=null'
```

## Deploy secrets (set before the first merge to `main`)

`deploy.yml` needs these in **Settings → Secrets and variables → Actions**:

| Name          | Type     | Value                                                |
|---------------|----------|------------------------------------------------------|
| `VPS_HOST`    | Secret   | VPS hostname or IP                                   |
| `VPS_USER`    | Secret   | SSH user (has repo checkout + docker access)         |
| `VPS_SSH_KEY` | Secret   | Private SSH key (PEM) authorized on the VPS          |
| `VPS_REPO_PATH` | Variable (optional) | Repo path on the VPS (default `/opt/studytrack`) |

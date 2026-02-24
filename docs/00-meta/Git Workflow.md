# Git Workflow

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `master` | Production-ready, stable releases |
| `dev` | Integration branch, active development |
| `feature/*` | Individual feature development |

## Sprint Workflow

### 1. Sprint Start - Create Feature Branch

```bash
# From dev branch
git checkout dev
git pull origin dev
git checkout -b feature/FEAT-001-name
```

**Branch naming convention:** `feature/[feature-id]name`

**Examples:**
- `feature/FEAT-001-drag-drop-upload`
- `feature/FEAT-002.1-sso-integration`

### 2. During Sprint - Develop & Commit

- Work on your feature branch
- Make regular commits with clear messages
- Keep documentation updated in `/docs/`
- Update module status in Obsidian as you progress

### 3. Sprint End - Merge to Dev

When all unit/integration tests pass:

```bash
git checkout dev
git merge feature/FEAT-001-name
git push origin dev
```

### 4. End-to-End Testing

- Run full E2E test suite on `dev` branch
- Verify integration between features
- Fix any cross-feature issues
- Ensure all docs are current

### 5. Release - Merge to Master

After E2E tests pass:

```bash
git checkout master
git merge dev
git push origin master
```

**Deploy from `master` branch only.**

## Emergency Hotfixes

For critical production fixes:

```bash
# Branch from master
git checkout master
git checkout -b hotfix/critical-bug-description

# Fix and test

# Merge to master for immediate deploy
git checkout master
git merge hotfix/critical-bug-description
git push origin master

# Also merge to dev to keep in sync
git checkout dev
git merge hotfix/critical-bug-description
git push origin dev
```

## Related
- [[Documentation Guide]]
- [[Dashboard]]

# Branch Naming Standardization Guide

## Current Situation
The repository currently has both `main` and `master` branches on the remote, which can cause confusion and issues with CI/CD pipelines.

- Local: `main` branch
- Remote: Both `origin/main` and `origin/master` exist

## Recommended Solution: Standardize on `main`

### Steps to Migrate

1. **Ensure local `main` is up to date**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Push `main` to `master` to sync them**
   ```bash
   git push origin main:master
   ```

3. **Update GitHub default branch**
   - Go to https://github.com/cryptokoh/ht-community/settings
   - Navigate to "Branches" section
   - Change default branch from `master` to `main`
   - Click "Update"

4. **Delete the old `master` branch**
   ```bash
   # After confirming default branch is changed on GitHub
   git push origin --delete master
   ```

5. **Update local git config (optional)**
   ```bash
   git config --global init.defaultBranch main
   ```

### CI/CD Updates

The GitHub Actions workflow already uses the current branch, so no changes are needed there. However, if you have any other CI/CD systems or documentation that references `master`, update them to use `main`.

### Team Communication

Notify all team members about the change:
- The default branch is now `main`
- They should delete their local `master` branch: `git branch -d master`
- Pull the latest `main` branch: `git checkout main && git pull`

## Alternative: Keep Both Branches

If you need to maintain both branches for compatibility:

1. Set up branch protection rules for both branches
2. Use GitHub Actions to keep them in sync:
   ```yaml
   name: Sync Branches
   on:
     push:
       branches: [main, master]
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Sync branches
           run: |
             git config user.name github-actions
             git config user.email github-actions@github.com
             if [ "${{ github.ref }}" = "refs/heads/main" ]; then
               git push origin main:master
             else
               git push origin master:main
             fi
   ```

## Verification

After migration, verify:
- [ ] Default branch on GitHub is `main`
- [ ] No `master` branch exists (or both are in sync)
- [ ] All CI/CD pipelines work correctly
- [ ] Team members can push/pull without issues
# Branch Cleanup Guide

This document lists the copilot branches that can be safely deleted to reduce Vercel Preview deployments.

## ✅ Confirmed Status

- **Main branch has the latest homepage changes** (commit `e35a206`)
- **Production deployment should trigger** from main branch

## Branches to DELETE (6 branches)

These copilot branches can be safely deleted. They either:
- Have been merged (PR #2)
- Are obsolete/superseded by other work

### 1. `copilot/fix-church-app-runtime-issues`
- **SHA:** `d95a6a95a27be8ec4582eb8006bfff1a5db8ead8`
- **PR:** [#2](https://github.com/powerofjehovah2025-afk/church-app/pull/2) - **MERGED** ✅
- **Status:** Safe to delete (already merged into main)

### 2. `copilot/deploy-app-to-production`
- **SHA:** `7d1df03f64240cba19ac85f60112267dd19de666`
- **PR:** [#5](https://github.com/powerofjehovah2025-afk/church-app/pull/5) - Draft/Open
- **Status:** Safe to delete (superseded)

### 3. `copilot/deploy-code-to-production`
- **SHA:** `aee8907acc9f090728a589f53c3fb8be789f7439`
- **PR:** [#3](https://github.com/powerofjehovah2025-afk/church-app/pull/3) - Draft/Open
- **Status:** Safe to delete (superseded)

### 4. `copilot/fix-node-version-warning`
- **SHA:** `11b0575beff8f84788f01e007da7100a4b6d4f3e`
- **PR:** [#4](https://github.com/powerofjehovah2025-afk/church-app/pull/4) - Draft/Open
- **Status:** Safe to delete (superseded)

### 5. `copilot/fix-vercel-deployment-error`
- **SHA:** `1b72c9237b77e32500ea72a6f96e85a2a4df194c`
- **PR:** [#1](https://github.com/powerofjehovah2025-afk/church-app/pull/1) - Draft/Open
- **Status:** Safe to delete (superseded)

### 6. `copilot/trigger-vercel-deployment`
- **SHA:** `2c0e6da7824f8c70d04d7e69755c8fda476164c9`
- **PR:** [#6](https://github.com/powerofjehovah2025-afk/church-app/pull/6) - Draft/Open
- **Status:** Safe to delete (superseded)

## Branches to KEEP (2 branches)

| Branch | Description |
|--------|-------------|
| `main` | Production branch with homepage changes (commit e35a206) |
| `copilot/cleanup-copilot-branches` | Current PR for this cleanup task |

## How to Delete Branches in GitHub

### Option 1: Delete via GitHub Web UI
1. Go to [Repository Branches](https://github.com/powerofjehovah2025-afk/church-app/branches)
2. Find each branch listed above
3. Click the trash icon 🗑️ next to each branch

### Option 2: Close PRs First (Recommended)
1. Go to [Pull Requests](https://github.com/powerofjehovah2025-afk/church-app/pulls)
2. Close the following PRs (they are draft/obsolete):
   - PR #1, #3, #4, #5, #6
3. Then delete the branches as shown in Option 1

### Option 3: Delete via Git CLI (if you have push access)
```bash
# Delete remote branches
git push origin --delete copilot/fix-church-app-runtime-issues
git push origin --delete copilot/deploy-app-to-production
git push origin --delete copilot/deploy-code-to-production
git push origin --delete copilot/fix-node-version-warning
git push origin --delete copilot/fix-vercel-deployment-error
git push origin --delete copilot/trigger-vercel-deployment
```

## Expected Result

After cleanup:
- ✅ Only `main` branch will remain (plus any active feature branches)
- ✅ Vercel will only deploy from `main` (Production)
- ✅ No more unnecessary Preview deployments from old copilot branches

## Note About This PR

Once you've deleted the branches listed above, you can also merge and delete this PR's branch (`copilot/cleanup-copilot-branches`).

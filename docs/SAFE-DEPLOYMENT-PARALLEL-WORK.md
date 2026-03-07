# Safe Deployment When Working in Parallel

Use this when you and someone else (e.g. Devyn) are both making changes and deploying. Goal: **your deploy includes your work and does not overwrite or break their latest deploy**.

---

## The rule

**Before you deploy, your branch must include the latest from the production branch.**  
Then when you merge (or push that branch), the result is **your changes + their changes**, and nothing gets lost.

---

## Step-by-step (your deploy)

### 1. Work on a branch (not directly on `main`)

If your changes are already on a branch (e.g. `feature/portfolio-menu`), stay there. If you’ve been working on `main`, create a branch from it and move your commits there:

```bash
git checkout -b feature/portfolio-menu
# if you had uncommitted changes on main, they come with you
```

### 2. Commit everything you want to deploy

```bash
git status
git add -A
git commit -m "Add Portfolio under Resources menu"
```

### 3. Get the latest from production (so you don’t overwrite Devyn’s work)

Your production branch might be `main` or `Sanity-cms` (see [PORTFOLIO_DEPLOYMENT_CHECKLIST.md](./PORTFOLIO_DEPLOYMENT_CHECKLIST.md)). Use the one Vercel uses as **Production** (often `main`).

```bash
git fetch origin
git merge origin/main
# If production is Sanity-cms instead, use: git merge origin/Sanity-cms
```

- If Git says "Already up to date", you’re good.
- If there are **merge conflicts**, fix them in the listed files, then:
  ```bash
  git add -A
  git commit -m "Merge main into feature branch"
  ```

### 4. Make sure the combined code builds

```bash
npm run build
```

If the build fails, fix errors (your code, merge conflicts, or compatibility with Devyn’s changes). **Do not push to the production branch until the build passes.**

### 5. Deploy

**Option A – Merge to production branch (recommended)**

```bash
git checkout main
git merge feature/portfolio-menu
git push origin main
```

Vercel will deploy from `main`. The live site will have both your changes and Devyn’s latest.

**Option B – Push your branch and merge via GitHub**

1. Push your branch: `git push origin feature/portfolio-menu`
2. Open a Pull Request: `main` ← `feature/portfolio-menu`
3. Resolve any conflicts in the PR (they should be few if you did step 3).
4. Merge the PR, then push if needed. Vercel deploys from `main`.

---

## What *not* to do

- **Don’t force-push to `main`** (`git push --force origin main`). That can remove Devyn’s commits from the branch and break what she deployed.
- **Don’t push to `main` without merging the latest `main` into your branch first.** Otherwise your push can overwrite her latest commit with an older state.
- **Don’t skip `npm run build`** after merging. If the build fails on Vercel, production can break for everyone.

---

## Quick checklist before you deploy

- [ ] All your changes are committed on a feature branch.
- [ ] You ran `git fetch origin` and `git merge origin/main` (or `origin/Sanity-cms`) and resolved any conflicts.
- [ ] `npm run build` passes locally.
- [ ] You merge into the production branch (or merge a PR), then push — no force-push to production.

Following this keeps your deploy from breaking what Devyn deployed and keeps both of your work on the site.

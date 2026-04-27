# Portfolio (Sanity CMS) – Deployment Checklist

If https://www.garmentdecor.com/portfolio doesn’t show the Sanity-driven portfolio (search, category filters, CMS projects), use this checklist.

## 1. Confirm production is built from this branch

Vercel serves one branch as **Production**. If that branch isn’t `Sanity-cms`, the live site will show the old portfolio (e.g. “Client: …”, decoration filters, no search).

- In **Vercel** → your project → **Settings** → **Git** (or **General**).
- Find **Production Branch**. It must be exactly **`Sanity-cms`** (capital S) to match GitHub.
- In **Deployments**, open the deployment that’s assigned to **Production**. Confirm the branch is **Sanity-cms**. If the latest production deployment is from `main` or another branch, either:
  - Change **Production Branch** to **Sanity-cms** and redeploy, or
  - Merge **Sanity-cms** into **main** and keep Production on **main**.

## 2. Sanity environment variables (Production)

The portfolio loads projects from Sanity. These must be set for the **Production** environment:

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Same as in Sanity Studio / manage.sanity.io |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Usually `production` – must match the dataset where you added projects |

- **Vercel** → **Settings** → **Environment Variables**.
- Ensure both are set and applied to **Production** (and to **Preview** if you test there).
- **Redeploy** after changing env vars (or trigger a new deployment from the **Deployments** tab).

## 3. Projects must be published in Sanity

The app only lists projects that have **Publish** applied (so `publishedAt` is set).

- In **Sanity Studio** (e.g. https://www.garmentdecor.com/studio), open each portfolio project.
- If it’s in “Draft”, click **Publish**.
- After publishing, the site will show them on the next request (within the revalidate window, e.g. 60 seconds).

## 4. Cache and revalidation

The portfolio page uses `revalidate = 60` (ISR). After a new deploy or after publishing in Sanity:

- Wait up to 60 seconds, or
- Do a **hard refresh** (Ctrl+Shift+R / Cmd+Shift+R) or open the URL in an **incognito/private** window to avoid browser cache.

## Quick check

- **Old UI** (e.g. “Client: …”, no search, decoration-only filters) → Production is still on an old branch or old deployment. Fix with step 1.
- **New UI but no projects** → Env vars (step 2) or publish status in Sanity (step 3).

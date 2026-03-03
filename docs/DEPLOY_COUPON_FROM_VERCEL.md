# Deploy Coupon Work from Vercel (coupon-management branch)

This guide covers deploying the coupon-management work to Vercel **without** merging into `main` (main has diverged with other admin changes).

---

## Pre-deploy checklist (already done)

- [x] `npx tsc --noEmit` — passed  
- [x] `npm run build` — passed (✓ Compiled successfully, ✓ Generating static pages)  
- [x] Branch `coupon-management` is pushed to GitHub  

---

## Option A: Deploy coupon-management as a Preview (recommended first)

1. Open your project in the **Vercel Dashboard**: https://vercel.com/dashboard  
2. Go to **Deployments**.  
3. Find the latest deployment for branch **coupon-management** (or trigger one: **Deployments** → **Create Deployment** → choose branch `coupon-management`).  
4. Open the **Preview URL** for that deployment to test the coupon flow (checkout field, $0 orders, admin coupons, Resend fix).  
5. If everything looks good, use Option B or C to go live.

---

## Option B: Use coupon-management as Production Branch in Vercel

1. In Vercel: **Project** → **Settings** → **Git**.  
2. Under **Production Branch**, change from `main` to **coupon-management**.  
3. Save.  
4. Go to **Deployments** and **Redeploy** the latest `coupon-management` deployment, or push a new commit to `coupon-management` to trigger a production deploy.  

Your production site will then run from the coupon-management branch.

---

## Option C: Merge coupon-management into main later (after resolving conflicts)

When you want production to stay on `main` and include coupon work:

1. Merge `main` into `coupon-management`:  
   `git checkout coupon-management && git merge main`  
2. Resolve conflicts in `app/admin/page.tsx`, `app/admin/orders/page.tsx`, and `app/admin/orders/[id]/page.tsx` (keep main’s OrderCard/OrderFilters and add coupon/refund UI from coupon-management where appropriate).  
3. Run `npm run build`, then push `coupon-management`.  
4. Merge `coupon-management` into `main` and push `main`.  
5. Vercel will deploy `main` as production.

---

## Environment variables (Vercel)

Ensure these are set in **Project** → **Settings** → **Environment Variables** for Production (and Preview if you use it):

- `RESEND_API_KEY` — required for application-approved and other emails  
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — for checkout  
- `STRIPE_SECRET_KEY` — for payments  
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` — for DB and auth  

See `.env.example` for the full list.

---

## Summary

- **Fastest way to get coupon work live:** Option B (set Production Branch to `coupon-management` in Vercel and redeploy).  
- **To only test:** Option A (use the Preview URL for a `coupon-management` deployment).  
- **To keep production on main:** Option C (resolve conflicts, then merge into main).

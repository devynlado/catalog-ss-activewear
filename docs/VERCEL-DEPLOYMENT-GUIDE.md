# Vercel Deployment Workflow Guide

This guide documents the proper workflow for deploying to Vercel to prevent repeated deployment failures and frustrating back-and-forth error fixing.

---

## 1. Pre-Push Checklist

**ALWAYS do these steps before pushing to `main`:**

```bash
# 1. Run a full local build
npm run build

# 2. Verify it succeeds (should show "✓ Compiled successfully" and exit code 0)
echo $?  # Should output: 0

# 3. If build fails, fix ALL errors before pushing
```

**Never push to main if the local build fails.** Fix all errors locally first, then push once.

---

## 2. Branch Management Rules

### Do:
- Use feature branches for all development (`feature/checkout`, `feature/auth`, etc.)
- Run `npm run build` locally before pushing to any branch
- Only merge/cherry-pick complete, tested features to `main`
- If fixing build errors on `main`, fix ALL errors in one commit

### Don't:
- Push incomplete feature code directly to `main`
- Fix errors one-by-one with multiple pushes (Vercel rebuilds on every push)
- Cherry-pick random commits without verifying the build first
- Force push to `main` without running a local build

### Safe Workflow for Hotfixes to Main:
```bash
# 1. Switch to main
git checkout main

# 2. Make your fix
# ... edit files ...

# 3. Run local build to verify
npm run build

# 4. Only if build passes, commit and push
git add -A && git commit -m "Fix: description" && git push origin main
```

---

## 3. Common TypeScript Errors and Fixes

### Boolean Type Errors

**Error:**
```
Type 'string | true' is not assignable to type 'boolean'.
```

**Cause:** Using `&&` chains that return the last truthy value (a string) instead of a boolean.

**Fix:** Wrap in `Boolean()`:
```typescript
// Before (broken)
const isValid = email && name && address;

// After (fixed)
const isValid = Boolean(email && name && address);
```

---

### Framer Motion Ease Tuple Error

**Error:**
```
Type 'number[]' is not assignable to type 'Easing'.
```

**Cause:** TypeScript infers `[0.25, 0.46, 0.45, 0.94]` as `number[]` instead of a tuple.

**Fix:** Add `as const`:
```typescript
// Before (broken)
transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }

// After (fixed)
transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }
```

---

### Property Does Not Exist Error

**Error:**
```
Property 'sku' does not exist on type 'ProductSize'.
```

**Cause:** Accessing a property that doesn't exist on the type definition.

**Fix:** Check the interface and either:
1. Add the property to the interface, OR
2. Remove/replace the property access

```typescript
// If ProductSize doesn't have 'sku', construct it differently:
// Before (broken)
const sku = sizeInfo?.sku || fallback;

// After (fixed) - construct from available data
const sku = `${product.styleId}-${colorCode}-${sizeName}`;
```

---

### Stripe API Version Mismatch

**Error:**
```
Type '"2024-12-18.acacia"' is not assignable to type '"2026-01-28.clover"'.
```

**Cause:** Stripe SDK updated and requires a newer API version.

**Fix:** Update the version string in `lib/stripe.ts`:
```typescript
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',  // Use version from error message
  typescript: true,
});
```

---

### Module Not Found Error

**Error:**
```
Module not found: Can't resolve '@/components/builder/SomeComponent'
```

**Cause:** File doesn't exist or isn't committed to git.

**Fix:**
1. Check if file exists: `ls -la path/to/file.tsx`
2. If missing, create it or get from another branch: `git show branch:path/to/file.tsx > path/to/file.tsx`
3. Stage and commit: `git add path/to/file.tsx`

---

### Supabase Key Required Error

**Error:**
```
Error: supabaseKey is required.
```

**Cause:** A file imports Supabase client but runs during static generation without env vars.

**Fix:** Either:
1. Remove the problematic route/component from the build
2. Add `export const dynamic = 'force-dynamic'` to the route
3. Ensure the Supabase client is only called in dynamic contexts

---

## 4. Local Build Commands

```bash
# Full production build (recommended before pushing)
npm run build

# Quick TypeScript check only (faster, but doesn't catch all issues)
npx tsc --noEmit

# Check a specific file
npx tsc --noEmit app/checkout/page.tsx

# Run dev server to test functionality
npm run dev

# Clean build cache and rebuild
rm -rf .next && npm run build
```

---

## 5. Recovery Steps When Main is Broken

### Option A: Fix Forward (Preferred)
```bash
# 1. Checkout main
git checkout main

# 2. Run build to see ALL errors
npm run build 2>&1 | tee build-errors.txt

# 3. Fix every error listed
# ... make fixes ...

# 4. Run build again to verify
npm run build

# 5. Only push when build passes
git add -A && git commit -m "Fix all build errors" && git push
```

### Option B: Reset to Known Good Commit
```bash
# 1. Find the last working commit
git log --oneline -20

# 2. Reset main to that commit
git reset --hard <commit-hash>

# 3. Force push (careful - this rewrites history)
git push origin main --force

# 4. Cherry-pick needed changes one at a time, building after each
git cherry-pick <commit-hash>
npm run build  # Verify after each cherry-pick
```

### Option C: Revert Bad Commits
```bash
# Revert the last commit
git revert HEAD

# Revert a specific commit
git revert <commit-hash>

# Push the revert
git push origin main
```

---

## 6. Vercel-Specific Notes

### Build Cache
- Vercel caches node_modules and .next between builds
- If you see stale errors, the cache might be corrupted
- Force a fresh build by making a dummy commit or using Vercel dashboard to redeploy without cache

### Environment Variables
- Ensure all required env vars are set in Vercel dashboard
- Common vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check `.env.local` for the full list

### Node Version
- This project uses Node 20.x (set in `package.json` engines)
- Vercel respects this even if project settings say otherwise
- If you see: `Warning: Due to "engines": { "node": "20.x" }...` - this is normal

### Build Timeout
- Default Vercel build timeout is 45 minutes
- If builds are slow, check for:
  - Large static generation (many pages)
  - API calls during build time
  - Unoptimized images

---

## 7. Quick Reference Checklist

Before every push to `main`:

- [ ] `npm run build` passes locally
- [ ] All TypeScript errors are fixed
- [ ] No missing module imports
- [ ] All new files are committed (`git status`)
- [ ] Feature is complete and tested

---

## 8. Emergency Contacts

If Vercel builds are failing and you can't figure out why:

1. Check Vercel build logs in dashboard for specific error
2. Run the exact same build locally: `npm run build`
3. Check if it's an environment variable issue
4. Check if a dependency needs updating
5. As a last resort, reset to the last known working commit

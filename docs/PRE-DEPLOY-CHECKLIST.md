# Pre-Deploy Checklist

Run through this checklist before pushing to GitHub to avoid Vercel build failures.

---

## Quick Verification Commands

Run these in your terminal before pushing:

```bash
# 1. TypeScript type check (catches type errors)
npx tsc --noEmit

# 2. Lint check
npm run lint

# 3. Full build test (most thorough - runs what Vercel runs)
npm run build
```

If all three pass, you're good to push.

---

## Manual Checklist

### Before Every Push

- [ ] Ran `npx tsc --noEmit` - no errors
- [ ] Ran `npm run lint` - no errors (or only warnings)
- [ ] All new dependencies installed and in `package.json`

### When Adding New Features

- [ ] New environment variables added to Vercel dashboard (if needed)
- [ ] Database migrations created and ready to run
- [ ] New API routes tested locally

### When Renaming/Refactoring

- [ ] Import paths updated in all consuming files
- [ ] Named exports match what importing files expect
- [ ] No orphaned files left behind

---

## Common Build Failures & Fixes

### 1. Module has no exported member

**Error:** `Module '"@/components/Foo"' has no exported member 'Bar'`

**Cause:** Export name doesn't match import name (often after renaming)

**Fix:** Check the actual export name in the source file and update imports:
```typescript
// If file exports: export function BarLegacy() {}
// Import should be: import { BarLegacy as Bar } from '...'
```

### 2. Property does not exist on type

**Error:** `Property 'foo' does not exist on type 'never'`

**Cause:** TypeScript can't infer the type (common with Supabase queries)

**Fix:** Add type assertion:
```typescript
const result = data as { foo: string } | null;
```

### 3. Cannot find module

**Error:** `Cannot find module 'package-name'`

**Cause:** Package not installed or not in package.json

**Fix:** 
```bash
npm install package-name
```

### 4. Type array not assignable (framer-motion)

**Error:** `Type 'number[]' is not assignable to type 'Easing'`

**Cause:** framer-motion ease arrays need tuple typing

**Fix:** Add type assertion to ease arrays:
```typescript
ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
```

### 5. Missing required property

**Error:** `Property 'slug' is missing in type...`

**Cause:** Interface requires a property that's not being provided

**Fix:** Add the missing property to the object being created

---

## Quick Reference

| Check | Command | What it catches |
|-------|---------|-----------------|
| Types | `npx tsc --noEmit` | Type errors, missing properties, bad imports |
| Lint | `npm run lint` | Code style issues, unused variables |
| Build | `npm run build` | Everything above + Next.js specific issues |

---

## If Build Fails on Vercel

1. Copy the error message from Vercel logs
2. Search this document for similar errors
3. Run `npx tsc --noEmit` locally to reproduce
4. Fix the issue and push again

---

*Last updated: January 2026*

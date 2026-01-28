# Garment Decor Design System: "Soft Craft"

A comprehensive style guide for maintaining visual consistency across all Garment Decor digital properties — website, emails, dashboards, and marketing materials.

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Treatment Levels](#treatment-levels)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Soft Craft Patterns](#soft-craft-patterns)
6. [Component Recipes](#component-recipes)
7. [Loading & Empty States](#loading--empty-states)
8. [Form Styling](#form-styling)
9. [Animation Guidelines](#animation-guidelines)
10. [Spacing & Layout](#spacing--layout)
11. [Do's and Don'ts](#dos-and-donts)
12. [Future Phases](#future-phases)

---

## Design Philosophy

**"Soft Craft"** combines:
- **Soft**: Subtle gradients, glassmorphism, grain textures, gentle animations
- **Craft**: Artisanal feel, real product photography, attention to detail

The goal is to feel **premium but approachable** — professional enough for enterprise clients, warm enough for small businesses.

### Core Principles

1. **Warm over Cool** — Use stone/warm neutrals, avoid slate/cool greys
2. **Depth through Subtlety** — Grain textures, soft shadows, backdrop blur
3. **Motion with Purpose** — Animate to guide attention, not to impress
4. **Real over Stock** — Showcase actual decorated products when possible

---

## Treatment Levels

Apply Soft Craft at different intensities based on page purpose. This creates visual hierarchy while maintaining brand consistency.

### FULL Treatment (Premium Pages)

**Apply to:** Services, Locations, About, Contact, Quote, Portfolio

All Soft Craft elements:
- Stone palette (backgrounds, borders)
- Grain texture overlays on sections
- Glassmorphism cards (`bg-white/70 backdrop-blur-sm`)
- Decorative gradient orbs
- Soft section transitions
- Framer Motion animations (stagger, scroll-triggered)
- Brand-tinted shadows

```tsx
// Full treatment section example
<section className="relative py-20 bg-gradient-to-b from-stone-50 via-white to-stone-50/50">
  {/* Grain texture */}
  <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{...grainStyle}} />
  
  {/* Decorative orbs */}
  <div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
  
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}>
    {/* Content */}
  </motion.div>
</section>
```

### MODERATE Treatment (Discovery Pages)

**Apply to:** Guides, Blog

Core elements only:
- Stone palette throughout
- Grain texture on hero/header section only
- Simple card styling (borders, not heavy glassmorphism)
- Basic fade-in animations
- Clean, scannable layouts optimized for browsing

```tsx
// Moderate treatment - grain on header only
<header className="relative py-12 border-b border-stone-200">
  <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{...grainStyle}} />
  {/* Header content */}
</header>

<main className="py-12 bg-stone-50">
  {/* Clean content grid - no extra effects */}
</main>
```

### LIGHT Treatment (Functional Pages)

**Apply to:** Brands, FAQ, Pricing, Resources, Admin, 404

Minimal elements:
- Stone palette only (swap all slate references)
- Clean borders and backgrounds
- No grain, orbs, or glassmorphism
- Minimal or no animations
- Focus on usability and content

```tsx
// Light treatment - just stone palette
<div className="bg-stone-50 border border-stone-200 rounded-xl p-6">
  {/* Functional content */}
</div>
```

### Why This Approach?

1. **Performance** — Heavy effects on catalog pages would slow browsing
2. **Visual Hierarchy** — Effects draw attention to conversion moments
3. **User Fatigue** — Grain/orbs everywhere loses impact; used sparingly they feel special
4. **Maintainability** — Fewer complex components to update long-term
5. **Brand Cohesion** — Stone palette everywhere unifies, effects add polish at key moments

---

## Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-500` | `#EE8935` | Primary CTAs, buttons, links, accents |
| `navy-800` | `#070131` | Headings, titles, dark sections |

### Brand Orange Scale

```
brand-50:  #FEF7F0  — Backgrounds, hover states
brand-100: #FDEAD9  — Light backgrounds, badges
brand-200: #FBD2B2  — Borders, dividers
brand-300: #F8B382  — Secondary accents
brand-400: #F49B52  — Hover states
brand-500: #EE8935  — PRIMARY (CTAs, buttons)
brand-600: #D97118  — Active/pressed states
brand-700: #B45812  — Dark accents
```

### Navy Scale

```
navy-800: #070131   — PRIMARY (headings, dark sections)
navy-700: #0F0F35   — Dark backgrounds
navy-600: #1A1A4A   — Secondary dark
```

### Warm Neutrals (Stone)

**Use these instead of slate for backgrounds and borders:**

```
stone-50:  — Section backgrounds (replaces slate-50)
stone-100: — Card backgrounds (replaces slate-100)
stone-200: — Borders, dividers (replaces slate-200)
```

### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#FAF6F3` | Page background (warm cream) |
| `surface` | `#FFFFFF` | Cards, containers |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `text-navy-800` | `#070131` | Headings, titles |
| `text-slate-600` | — | Body text (OK to use slate for text) |
| `text-slate-500` | — | Secondary/muted text |

### Colors to Avoid

| ❌ Don't Use | ✅ Use Instead |
|-------------|----------------|
| `slate-50` for backgrounds | `stone-50` |
| `slate-100` for backgrounds | `stone-100` |
| `border-slate-*` | `border-stone-*` |
| Pure `white` backgrounds | `bg-white/70` with backdrop blur |

---

## Typography

### Font Family

```css
font-family: 'DM Sans', system-ui, sans-serif;
```

### Heading Scale

| Element | Classes |
|---------|---------|
| H1 (Hero) | `text-4xl sm:text-5xl lg:text-6xl font-bold text-navy-800` |
| H2 (Section) | `text-3xl sm:text-4xl font-bold text-navy-800` |
| H3 (Card) | `text-xl font-bold text-navy-800` |
| H4 (Subsection) | `text-lg font-semibold text-navy-800` |

### Body Text

| Type | Classes |
|------|---------|
| Body Large | `text-lg text-slate-600` |
| Body | `text-base text-slate-600` |
| Body Small | `text-sm text-slate-600` |
| Caption | `text-xs text-slate-500` |

### Labels & Tags

```tsx
// Section label (above headings)
<p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
  Section Label
</p>
```

---

## Soft Craft Patterns

### 1. Grain Texture Overlay

Add subtle noise texture to sections for depth:

```tsx
<div 
  className="pointer-events-none absolute inset-0 opacity-[0.015]"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
  }}
/>
```

**Opacity guidelines:**
- Light sections: `opacity-[0.015]`
- Dark sections: `opacity-[0.03]`

### 2. Glassmorphism Cards

```tsx
className="bg-white/70 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-sm"
```

**Hover state:**
```tsx
className="... hover:shadow-xl hover:shadow-brand-500/5 hover:-translate-y-1 transition-all"
```

### 3. Gradient Background Orbs

Add soft color orbs for depth:

```tsx
{/* Decorative orbs */}
<div className="pointer-events-none absolute -left-32 top-20 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl" />
<div className="pointer-events-none absolute -right-32 bottom-20 h-64 w-64 rounded-full bg-navy-800/5 blur-3xl" />
```

### 4. Section Transitions

Smooth gradient fades between light and dark sections:

**Light section transitioning TO dark:**
```tsx
<div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-navy-800/[0.03] to-transparent" />
```

**Dark section transitioning FROM light:**
```tsx
<div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent" />
```

### 5. Brand-Tinted Shadows

Instead of generic grey shadows, use brand-tinted:

```tsx
// Primary buttons
shadow-lg shadow-brand-500/25

// Navy elements
shadow-lg shadow-navy-800/20

// Cards
shadow-xl shadow-brand-500/5
```

---

## Component Recipes

### Primary Button

```tsx
<button className="
  inline-flex items-center gap-2 
  rounded-xl 
  bg-brand-500 
  px-6 py-3 
  text-base font-semibold text-white 
  shadow-lg shadow-brand-500/25 
  transition-all 
  hover:bg-brand-600 
  hover:shadow-xl 
  hover:-translate-y-0.5
">
  Button Text
  <ArrowRight className="h-5 w-5" />
</button>
```

### Secondary Button (Outline)

```tsx
<button className="
  inline-flex items-center gap-2 
  rounded-xl 
  border-2 border-navy-800 
  bg-transparent 
  px-6 py-3 
  text-base font-semibold text-navy-800 
  transition-all 
  hover:bg-navy-800 
  hover:text-white
">
  Button Text
</button>
```

### Glass Card

```tsx
<div className="
  rounded-2xl 
  bg-white/70 
  backdrop-blur-sm 
  border border-stone-200 
  p-6 
  shadow-sm 
  hover:shadow-xl 
  hover:shadow-brand-500/5 
  hover:-translate-y-1 
  transition-all
">
  {/* Card content */}
</div>
```

### Floating Badge

```tsx
<div className="rounded-2xl bg-white/95 backdrop-blur-sm p-4 shadow-xl border border-stone-200">
  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <p className="font-semibold text-navy-800">Title</p>
      <p className="text-sm text-slate-500">Subtitle</p>
    </div>
  </div>
</div>
```

### Stats Card (Inline)

```tsx
<div className="flex items-center gap-3 rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200 px-4 py-3 shadow-sm">
  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
    <Icon className="h-5 w-5" />
  </div>
  <div>
    <p className="text-xl font-bold text-navy-800">Value</p>
    <p className="text-xs text-slate-500">Label</p>
  </div>
</div>
```

### Icon Circle

```tsx
// Brand (orange)
<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
  <Icon className="h-7 w-7 text-white" />
</div>

// Navy
<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-700 shadow-lg shadow-navy-800/20">
  <Icon className="h-7 w-7 text-white" />
</div>

// Light (for dark backgrounds)
<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
  <Icon className="h-6 w-6 text-brand-400" />
</div>
```

---

## Loading & Empty States

Loading states should feel warm and consistent with the rest of the UI.

### Skeleton Loaders

Use stone tones for skeleton placeholders:

```tsx
// Skeleton card
<div className="animate-pulse">
  <div className="h-48 bg-stone-200 rounded-xl mb-4" />
  <div className="h-4 bg-stone-200 rounded w-3/4 mb-2" />
  <div className="h-4 bg-stone-200 rounded w-1/2" />
</div>

// Skeleton text
<div className="space-y-2 animate-pulse">
  <div className="h-4 bg-stone-200 rounded w-full" />
  <div className="h-4 bg-stone-200 rounded w-5/6" />
  <div className="h-4 bg-stone-200 rounded w-4/6" />
</div>

// Skeleton avatar
<div className="h-12 w-12 bg-stone-200 rounded-full animate-pulse" />
```

### Loading Spinners

```tsx
// Brand spinner
<div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-200 border-t-brand-500" />

// Small inline spinner
<div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-brand-500" />
```

### Empty States

```tsx
// Empty state container
<div className="text-center py-12">
  <div className="mx-auto h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
    <SearchIcon className="h-8 w-8 text-stone-400" />
  </div>
  <h3 className="text-lg font-semibold text-navy-800 mb-2">No results found</h3>
  <p className="text-slate-500 mb-4">Try adjusting your search or filters</p>
  <button className="text-brand-500 font-medium hover:text-brand-600">
    Clear filters
  </button>
</div>
```

### Replacement Mapping

| Before (❌) | After (✅) |
|-------------|-----------|
| `bg-slate-200` (skeletons) | `bg-stone-200` |
| `bg-slate-100` (empty state bg) | `bg-stone-100` |
| `border-slate-200` (spinner) | `border-stone-200` |
| `animate-pulse bg-slate-*` | `animate-pulse bg-stone-*` |

---

## Form Styling

Forms should be clean and functional with warm styling that matches the brand.

### Text Inputs

```tsx
<input
  type="text"
  className="
    w-full rounded-xl 
    border border-stone-300 
    bg-white 
    px-4 py-3 
    text-navy-800 
    placeholder:text-slate-400
    focus:border-brand-500 
    focus:ring-2 
    focus:ring-brand-500/20 
    focus:outline-none
    transition-colors
  "
  placeholder="Enter text..."
/>
```

### Select Dropdowns

```tsx
<select className="
  w-full rounded-xl 
  border border-stone-300 
  bg-white 
  px-4 py-3 
  text-navy-800
  focus:border-brand-500 
  focus:ring-2 
  focus:ring-brand-500/20 
  focus:outline-none
  transition-colors
">
  <option>Select an option</option>
</select>
```

### Textareas

```tsx
<textarea className="
  w-full rounded-xl 
  border border-stone-300 
  bg-white 
  px-4 py-3 
  text-navy-800 
  placeholder:text-slate-400
  focus:border-brand-500 
  focus:ring-2 
  focus:ring-brand-500/20 
  focus:outline-none
  transition-colors
  resize-none
" rows={4} />
```

### Checkboxes & Radios

```tsx
// Checkbox
<input
  type="checkbox"
  className="
    h-5 w-5 
    rounded 
    border-stone-300 
    text-brand-500 
    focus:ring-brand-500/20
  "
/>

// Radio
<input
  type="radio"
  className="
    h-5 w-5 
    border-stone-300 
    text-brand-500 
    focus:ring-brand-500/20
  "
/>
```

### Form States

**Error State:**
```tsx
// Keep red for universal recognition
<input className="border-red-500 focus:border-red-500 focus:ring-red-500/20" />
<p className="mt-1 text-sm text-red-600">This field is required</p>
```

**Success State:**
```tsx
// Keep green for universal recognition
<input className="border-green-500 focus:border-green-500 focus:ring-green-500/20" />
<p className="mt-1 text-sm text-green-600">Looks good!</p>
```

**Disabled State:**
```tsx
<input 
  disabled 
  className="bg-stone-50 border-stone-200 text-slate-400 cursor-not-allowed" 
/>
```

### Form Field Groups

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-navy-800">
    Email Address
  </label>
  <input type="email" className="..." />
  <p className="text-xs text-slate-500">We'll never share your email</p>
</div>
```

### Form Replacement Mapping

| Before (❌) | After (✅) |
|-------------|-----------|
| `border-slate-300` | `border-stone-300` |
| `ring-slate-200` | `ring-stone-200` |
| `focus:ring-slate-*` | `focus:ring-brand-500/20` |
| `bg-slate-50` (disabled) | `bg-stone-50` |
| `border-red-*` (errors) | Keep as-is |
| `border-green-*` (success) | Keep as-is |

---

## Animation Guidelines

### Framer Motion Defaults

```tsx
// Standard fade-in
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}

// Staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};
```

### Hover Animations

```tsx
// Card lift
whileHover={{ y: -4, scale: 1.02 }}
transition={{ type: 'spring', stiffness: 300, damping: 20 }}

// Button press
whileTap={{ scale: 0.98 }}
```

### Scroll-Triggered Animations

```tsx
// Fade in on scroll
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.5 }}
>
```

### Reduced Motion Support

Always respect user preferences:

```tsx
import { useReducedMotion } from 'framer-motion';

const prefersReducedMotion = useReducedMotion();

// Disable parallax/complex animations if user prefers reduced motion
style={{ y: prefersReducedMotion ? 0 : scrollY }}
```

---

## Spacing & Layout

### Section Padding

| Section Type | Classes |
|--------------|---------|
| Standard | `py-20` |
| Large | `py-24` |
| Compact | `py-12 sm:py-16` |

### Container

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
```

### Border Radius Scale

| Use Case | Class |
|----------|-------|
| Small elements (badges, pills) | `rounded-lg` or `rounded-xl` |
| Cards | `rounded-2xl` |
| Large cards, hero images | `rounded-3xl` |
| Circles | `rounded-full` |

### Grid Patterns

```tsx
// 4-column responsive grid
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

// 3-column responsive grid
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

// 2-column with content + image
<div className="grid gap-12 lg:grid-cols-2 lg:items-center">
```

---

## Do's and Don'ts

### ✅ Do

- Use `stone-*` for warm neutral backgrounds and borders
- Add grain texture to full-bleed sections
- Use brand-tinted shadows (`shadow-brand-500/25`)
- Animate elements on scroll with `whileInView`
- Use `backdrop-blur` for glassmorphism effects
- Respect `prefers-reduced-motion`
- Use gradients for icon backgrounds (`from-brand-500 to-brand-600`)

### ❌ Don't

- Use `slate-*` for backgrounds or borders (too cool/grey)
- Use pure white backgrounds without blur/transparency
- Over-animate (every element doesn't need motion)
- Use generic grey shadows
- Forget `pointer-events-none` on decorative elements
- Use solid color icon backgrounds (use gradients)
- Ignore mobile responsiveness

---

## File References

### Homepage Components (Soft Craft Applied)
- `components/home/Hero.tsx`
- `components/home/WhoWeService.tsx`
- `components/home/TurnaroundBanner.tsx`
- `components/home/HowItWorks.tsx`
- `components/home/CategoryGrid.tsx`
- `components/home/ServicesGrid.tsx`
- `components/home/BuiltForScale.tsx`
- `components/home/TrustSignals.tsx`
- `components/home/FinalCTA.tsx`

### Layout Components
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`

### Reusable Primitives
- `components/ui/SectionWrapper.tsx`
- `components/ui/GlassCard.tsx`
- `components/ui/SoftButton.tsx`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial Soft Craft system |
| 1.1 | Jan 2026 | Added treatment levels, loading states, form styling, future phases |

---

## Future Phases

### Phase 2: Email Templates

Email rendering requires different techniques (no backdrop-blur, limited CSS support). Document guidelines for future implementation:

**Email Color Palette:**
```
Background:     #FAF6F3 (warm cream)
Card Background: #FFFFFF
Primary CTA:    #EE8935 (brand-500)
Text Dark:      #070131 (navy-800)
Text Body:      #475569 (slate-600 equivalent)
Border:         #E7E5E4 (stone-200 equivalent)
```

**Email Typography:**
- Fallback: Arial, Helvetica, sans-serif
- Headings: 600 weight, navy color
- Body: 400 weight, 16px line-height 1.5

**Email Structure:**
- Max width: 600px
- Padding: 24px on sides
- Section spacing: 32px
- Border radius: 8px (widely supported)

### Phase 3: PDF Templates

Quote and invoice PDFs should match brand:
- Use brand orange for headers and CTAs
- Stone-toned borders for tables
- Navy headings
- Clean, professional layout

### Future: Dark Mode

Document color mappings for potential dark mode implementation:

| Light Mode | Dark Mode |
|------------|-----------|
| `bg-white` | `bg-navy-800` |
| `bg-stone-50` | `bg-navy-700` |
| `bg-stone-100` | `bg-navy-600` |
| `border-stone-200` | `border-white/10` |
| `text-navy-800` | `text-white` |
| `text-slate-600` | `text-slate-300` |
| `text-slate-500` | `text-slate-400` |

**Dark Mode Considerations:**
- Grain texture: Increase opacity to `0.03`
- Glassmorphism: Use `bg-white/5` instead of `bg-white/70`
- Shadows: Use `shadow-black/20` instead of brand-tinted
- Currently NOT implemented — light mode only for warm brand feel

---

*This style guide is a living document. Update it as the design system evolves.*

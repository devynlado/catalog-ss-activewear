# Email System Guidelines

A comprehensive reference for building, maintaining, and optimizing emails at Garment Decor. This document covers UI/UX design, marketing best practices, and technical implementation standards.

---

## Table of Contents

1. [Design Guidelines (UI/UX)](#design-guidelines-uiux)
2. [Marketing Guidelines](#marketing-guidelines)
3. [Technical Guidelines (Developer)](#technical-guidelines-developer)
4. [Email Templates Reference](#email-templates-reference)
5. [Testing Checklist](#testing-checklist)

---

## Design Guidelines (UI/UX)

### Soft Craft Adaptation for Email

Our "Soft Craft" web design uses glassmorphism, backdrop blur, and CSS variables. Email clients don't support these features, so we adapt the aesthetic while maintaining brand consistency.

### Email-Specific Constraints

| Web Feature | Email Alternative |
|-------------|-------------------|
| `backdrop-blur` | Solid backgrounds with opacity |
| CSS Grid/Flexbox | HTML tables |
| CSS Variables | Inline hex colors |
| Custom fonts | System font stack |
| External stylesheets | Inline styles only |
| SVG backgrounds | Hosted PNG/JPG images |

### Color Palette (Email-Safe)

```
Background (outer):  #FAF6F3  /* warm cream - Soft Craft signature */
Background (alt):    #f8fafc  /* slate-50 fallback */
Card/Content:        #FFFFFF  /* white */
Primary (brand):     #f97316  /* brand-500 orange */
Primary Hover:       #ea580c  /* brand-600 */
Secondary:           #0f172a  /* navy-800 */
Text Dark:           #0f172a  /* navy-800 */
Text Body:           #475569  /* slate-600 */
Text Muted:          #64748b  /* slate-500 */
Text Light:          #94a3b8  /* slate-400 */
Border:              #e7e5e4  /* stone-200 */
Success:             #16a34a  /* green-600 */
Warning:             #d97706  /* amber-600 */
Error:               #dc2626  /* red-600 */
```

### Typography

```css
/* System font stack for email */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Heading styles */
h1: 24-28px, font-weight: 700, color: #0f172a
h2: 18-20px, font-weight: 600, color: #0f172a
h3: 16px, font-weight: 600, color: #0f172a

/* Body text */
body: 16px, font-weight: 400, line-height: 1.6, color: #475569

/* Small/caption */
small: 12-14px, color: #64748b
```

### Standard Email Structure

```
┌─────────────────────────────────────────────┐
│              PREHEADER (hidden)              │
│  50-100 chars preview text                   │
├─────────────────────────────────────────────┤
│                                             │
│              HEADER                          │
│  Background: #f97316 (brand-500)            │
│  Logo (white) + Title + Subtitle            │
│  Height: ~120px                             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│              CONTENT                         │
│  Background: #FFFFFF                        │
│  Padding: 32px                              │
│                                             │
│  - Greeting                                 │
│  - Main message                             │
│  - Info cards (stone background)            │
│  - Data tables                              │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│              CTA SECTION                     │
│  Primary button: #f97316                    │
│  Secondary button: outline                  │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│              FOOTER                          │
│  Background: #0f172a (navy-800)             │
│  Logo (white) + Company name                │
│  Address + Contact                          │
│  Unsubscribe link                           │
│                                             │
└─────────────────────────────────────────────┘
```

### Layout Specifications

- **Max width**: 600px (standard email width)
- **Side padding**: 32px desktop, 20px mobile
- **Section spacing**: 24-32px
- **Border radius**: 8-12px on cards (supported in most clients)
- **Shadows**: `box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05)` (limited support)

### Logo Usage

| Placement | Logo Asset | Background |
|-----------|------------|------------|
| Header | `logo-wordmark-white.svg` | brand-500 (#f97316) |
| Footer | `logo-wordmark-white.svg` | navy-800 (#0f172a) |
| Light bg | `logo-wordmark-dark.svg` | white/cream |

**Hosted Logo URLs:**
```
Header/Footer: https://garmentdecor.com/images/brand/logo-wordmark-white.svg
Light backgrounds: https://garmentdecor.com/images/brand/logo-wordmark-dark.svg
Icon only: https://garmentdecor.com/images/brand/logo-circle-dark.svg
```

### Mobile Responsiveness

Email tables should gracefully stack on mobile:

```html
<!-- Responsive container -->
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
  <tr>
    <td style="padding: 20px;">
      <!-- Content stacks naturally -->
    </td>
  </tr>
</table>
```

For side-by-side elements, use `display: inline-block` with `min-width`:
```html
<td style="display: inline-block; min-width: 280px; width: 48%;">
```

### Dark Mode Considerations

Add meta tags for dark mode support:
```html
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
```

Colors that may invert in dark mode:
- White backgrounds → may become dark
- Dark text → may become light
- Images with transparency → test carefully

### Accessibility Requirements

1. **Alt text**: All images must have descriptive alt text
2. **Color contrast**: Minimum 4.5:1 for body text, 3:1 for large text
3. **Link text**: Descriptive (not "click here")
4. **Heading hierarchy**: Use proper h1 → h2 → h3 order
5. **Font size**: Minimum 14px for body text

### Customer vs Internal Emails

| Aspect | Customer Emails | Internal Emails |
|--------|-----------------|-----------------|
| Header | Full branding, warm colors | Simple, "[INTERNAL]" prefix |
| Logo | Yes, in header + footer | Optional, header only |
| Tone | Friendly, professional | Data-focused, concise |
| CTA | Prominent, branded | Functional links |
| Footer | Full with unsubscribe | Minimal |

---

## Marketing Guidelines

### Subject Line Strategy

| Email Type | Subject Template | Example |
|------------|------------------|---------|
| Quote Confirmation | `Quote #{id} received – we'll respond in 2 hours` | Quote #QT-ABC123 received – we'll respond in 2 hours |
| Quote Recovery | `Your quote is waiting – {count} items saved` | Your quote is waiting – 5 items saved |
| Screen Printing Guide | `Your Screen Printing Prep Guide` | Your Screen Printing Prep Guide |
| Embroidery Guide | `Your Embroidery Prep Guide` | Your Embroidery Prep Guide |
| Recovery Reminder | `Still thinking it over? Your {count} items are waiting` | Still thinking it over? Your 5 items are waiting |

**Internal emails:**
| Email Type | Subject Template |
|------------|------------------|
| Quote Notification | `[INTERNAL] New quote #{id} – ${total}` |
| Contact Notification | `[INTERNAL] New contact: {name}` |

### Subject Line Best Practices

- **Length**: 30-50 characters (mobile-friendly)
- **Personalization**: Include item count, quote ID, or name when available
- **Urgency**: Use sparingly and honestly ("Link expires in 30 days")
- **Avoid**: ALL CAPS, excessive punctuation!!!, spam trigger words (FREE, ACT NOW)

### Preheader Text Strategy

Preheader is the preview text shown after the subject line in inbox view.

| Email Type | Preheader (50-100 chars) |
|------------|--------------------------|
| Quote Confirmation | Your {count} items are being reviewed by our team... |
| Quote Recovery | Click to resume where you left off. Your items are saved for 30 days. |
| Screen Printing Guide | Everything you need for a perfect print – artwork, colors, sizing tips. |
| Embroidery Guide | Professional results, every stitch – prep guide inside. |
| Recovery Reminder | Don't lose your quote – complete it before items go out of stock. |

### UTM Parameter Standards

All links in emails must include UTM parameters for analytics:

```
?utm_source=email
&utm_medium={email_type}
&utm_campaign={campaign_name}
&utm_content={link_location}
```

**Examples:**
```
# Quote recovery CTA button
https://garmentdecor.com/resume-quote/abc123
  ?utm_source=email
  &utm_medium=recovery
  &utm_campaign=exit_intent
  &utm_content=cta_button

# Guide download link
https://garmentdecor.com/pricing?service=screen-printing
  ?utm_source=email
  &utm_medium=guide
  &utm_campaign=screen_printing_guide
  &utm_content=footer_link
```

### Personalization Guidelines

Use personalization to increase engagement:

| Data Point | Usage |
|------------|-------|
| First name | Greeting: "Hi {firstName}," |
| Item count | Subject/preheader: "{count} items saved" |
| Product names | Body: Show actual cart contents |
| Company name | Internal emails: "from {company}" |
| Quote ID | Reference: "Quote #{id}" |

**Fallbacks**: Always provide defaults
```typescript
const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
```

### CAN-SPAM Compliance Checklist

Every customer-facing email MUST include:

- [ ] **Physical address**: 4778 W. Mission Blvd, Montclair CA 91762
- [ ] **Clear sender**: "Garment Decor" in From field
- [ ] **Unsubscribe link**: Functional, one-click unsubscribe
- [ ] **Accurate subject**: No deceptive subjects
- [ ] **Ad identification**: Mark promotional content if applicable

### Token Expiration Policy

| Token Type | Expiration | Rationale |
|------------|------------|-----------|
| Quote recovery | 30 days | Balance urgency with convenience |
| Email verification | 24 hours | Security best practice |
| Password reset | 1 hour | Security best practice |

### Urgency & Scarcity (Use Ethically)

Acceptable urgency messages:
- "Your link expires in 30 days"
- "Complete your quote before prices update"
- "Items in your quote may sell out"

Avoid manipulative tactics:
- Fake countdown timers
- "Only 2 left!" when false
- Pressure language ("ACT NOW OR LOSE EVERYTHING")

### Email Sequence Timing

| Sequence | Timing | Purpose |
|----------|--------|---------|
| Quote recovery | Immediate | Confirm save, provide link |
| Recovery reminder | +24 hours | Re-engage if not recovered |
| Final reminder | +7 days | Last chance before expiration |

---

## Technical Guidelines (Developer)

### Token Security

```typescript
// Generate secure recovery token
import { randomUUID } from 'crypto';

const token = randomUUID(); // 128-bit UUID v4
// Example: "550e8400-e29b-41d4-a716-446655440000"
```

**Security requirements:**
- Use `crypto.randomUUID()` (not nanoid for security tokens)
- Tokens should be single-use for sensitive operations
- Store `expires_at` and enforce on retrieval
- Never expose tokens in URLs for GET requests (use POST where possible)

### Rate Limiting

Prevent email abuse with rate limits:

```typescript
// Rate limit: 3 emails per address per 24 hours
const RATE_LIMIT = 3;
const RATE_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in ms

async function checkRateLimit(email: string): Promise<boolean> {
  const since = new Date(Date.now() - RATE_WINDOW);
  const { count } = await supabase
    .from('exit_captures')
    .select('*', { count: 'exact', head: true })
    .eq('email', email.toLowerCase())
    .gte('email_sent_at', since.toISOString());
  
  return (count || 0) < RATE_LIMIT;
}
```

### Database Schema

```sql
-- Exit captures table with recovery support
CREATE TABLE exit_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  page_url TEXT,
  cart_items JSONB,
  recovery_token TEXT UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_exit_captures_email ON exit_captures(email);
CREATE INDEX idx_exit_captures_token ON exit_captures(recovery_token) 
  WHERE recovery_token IS NOT NULL;
CREATE INDEX idx_exit_captures_expires ON exit_captures(expires_at) 
  WHERE recovered_at IS NULL;
```

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://garmentdecor.com

# Email addresses
QUOTE_EMAIL_TO=quotes@garmentdecor.com
CONTACT_EMAIL_TO=info@garmentdecor.com

# Optional
EMAIL_FROM_NAME=Garment Decor
EMAIL_FROM_DOMAIN=garmentdecor.com
```

### Resend Integration Pattern

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Send email with error handling
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Garment Decor <noreply@garmentdecor.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    if (error) {
      console.error('Resend error:', error);
      throw new Error(error.message);
    }
    
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email send failed:', error);
    // Don't throw - let the API return success even if email fails
    // Log for monitoring, handle gracefully
    return { success: false, error };
  }
}
```

### Error Handling

```typescript
// Recovery page error states
type RecoveryState = 
  | { status: 'loading' }
  | { status: 'success'; cartItems: CartItem[] }
  | { status: 'invalid' }      // Token doesn't exist
  | { status: 'expired' }      // Token past expires_at
  | { status: 'used' }         // Already recovered
  | { status: 'error'; message: string };

// API error responses
return NextResponse.json(
  { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
  { status: 429 }
);

return NextResponse.json(
  { error: 'Invalid token', code: 'TOKEN_INVALID' },
  { status: 404 }
);

return NextResponse.json(
  { error: 'Token expired', code: 'TOKEN_EXPIRED' },
  { status: 410 }  // 410 Gone
);
```

### Logging & Monitoring

Track these metrics:
- Email send success/failure rate
- Recovery link click rate
- Cart recovery conversion rate
- Bounce rate by email type
- Average time to recovery

```typescript
// Log email events
console.log(JSON.stringify({
  event: 'email_sent',
  type: 'quote_recovery',
  email: maskEmail(email),  // Don't log full email
  token: token.slice(0, 8), // Partial token for debugging
  timestamp: new Date().toISOString(),
}));
```

### GDPR & Data Retention

- **Retention period**: 90 days for exit captures
- **Right to deletion**: Implement delete endpoint
- **Data minimization**: Only store necessary cart data
- **Consent**: Exit intent implies consent for recovery email only

```typescript
// Cleanup job (run weekly)
await supabase
  .from('exit_captures')
  .delete()
  .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
  .is('recovered_at', null);
```

---

## Email Templates Reference

### Current Templates

| File | Type | Recipient | Purpose |
|------|------|-----------|---------|
| `quote-confirmation.tsx` | Customer | User | Confirms quote submission |
| `quote-notification.tsx` | Internal | Team | Alerts team of new quote |
| `screen-printing-guide.tsx` | Customer | User | Guide download delivery |
| `embroidery-guide.tsx` | Customer | User | Guide download delivery |
| `contact-notification.tsx` | Internal | Team | Alerts team of contact form |
| `save-quote-recovery.tsx` | Customer | User | Cart recovery link |

### Shared Components

Located in `lib/emails/components.tsx`:

```typescript
// Generate email wrapper with warm background
emailWrapper(content: string): string

// Generate branded header
emailHeader(title: string, subtitle?: string): string

// Generate footer with address and unsubscribe
emailFooter(includeUnsubscribe?: boolean): string

// Generate CTA button with UTM tracking
emailButton(text: string, href: string, utmParams?: UTMParams): string

// Generate info card with stone background
emailCard(content: string): string

// Generate hidden preheader text
emailPreheader(text: string): string
```

---

## Testing Checklist

### Before Sending Any Email

- [ ] Subject line under 50 characters
- [ ] Preheader text set (50-100 chars)
- [ ] All images have alt text
- [ ] All links include UTM parameters
- [ ] Unsubscribe link works (customer emails)
- [ ] Physical address present
- [ ] Plain text version provided
- [ ] Personalization fallbacks work

### Email Client Testing

Test in these clients (priority order):

1. **Gmail** (web + mobile app)
2. **Apple Mail** (macOS + iOS)
3. **Outlook** (web + desktop)
4. **Yahoo Mail**

Check for:
- [ ] Layout renders correctly
- [ ] Images load (not blocked)
- [ ] Links are clickable
- [ ] Colors display correctly
- [ ] Dark mode appearance
- [ ] Mobile responsive layout

### Tools

- **Litmus** or **Email on Acid** - Cross-client preview
- **Mail-tester.com** - Spam score check
- **Resend dashboard** - Delivery analytics

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-01 | Initial | Created comprehensive email guidelines |

---

*This document is the single source of truth for all email development at Garment Decor. Update it when patterns change.*

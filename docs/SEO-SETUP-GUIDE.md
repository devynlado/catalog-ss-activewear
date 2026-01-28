# SEO Setup Guide for Garment Decor

This document outlines the steps to complete your SEO setup after deploying the technical SEO changes.

## 1. Google Search Console Setup

### Step 1: Access Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account (use your business Google account)

### Step 2: Add Your Property
1. Click "Add Property"
2. Choose "Domain" (recommended) or "URL prefix"
3. Enter: `garmentdecor.com`

### Step 3: Verify Ownership
**Option A: DNS Verification (Recommended)**
1. Google will provide a TXT record
2. Add this TXT record to your domain DNS settings (in your domain registrar)
3. Wait 5-10 minutes for propagation
4. Click "Verify" in Google Search Console

**Option B: HTML File Verification**
1. Download the verification HTML file from Google
2. Add it to your `public` folder: `public/google[verification-code].html`
3. Deploy and verify

### Step 4: Submit Your Sitemap
1. In Search Console, go to "Sitemaps" in the left sidebar
2. Enter: `sitemap.xml`
3. Click "Submit"
4. Google will start crawling your site

### Step 5: Request Indexing for Key Pages
1. Go to "URL Inspection" tool
2. Enter each key URL:
   - `https://garmentdecor.com`
   - `https://garmentdecor.com/services/screen-printing`
   - `https://garmentdecor.com/services/embroidery`
   - `https://garmentdecor.com/catalog`
3. Click "Request Indexing" for each

---

## 2. Google Business Profile Setup

### Step 1: Create or Claim Your Profile
1. Go to [Google Business Profile](https://business.google.com)
2. Search for "Garment Decor"
3. If it exists, click "Claim this business"
4. If not, click "Add your business"

### Step 2: Complete Business Information
Fill out ALL fields:

**Basic Info:**
- Business name: `Garment Decor`
- Primary category: `Screen Printing Service`
- Additional categories: 
  - `Embroidery Service`
  - `Custom T-shirt Store`
  - `Promotional Products Supplier`

**Contact:**
- Phone: `(855) 942-7636`
- Website: `https://garmentdecor.com`

**Location:**
- Address: `4950 Arrow Hwy Suite 4, Montclair, CA 91763`
- Service area: Los Angeles County, Orange County, San Bernardino County

**Hours:**
- Monday-Friday: 8:00 AM - 5:00 PM
- Saturday-Sunday: Closed

**Services (Add each as a service):**
- Screen Printing
- Embroidery
- Digital Printing
- Puff Printing
- Jumbo Printing
- Retail Finishing
- Rush Orders

### Step 3: Add Photos
Upload high-quality photos:
- Logo (profile photo)
- Cover photo (facility or team)
- Interior photos (production floor, equipment)
- Work photos (finished products)
- Team photos

### Step 4: Write Business Description
```
Garment Decor is a professional screen printing and embroidery company located in Montclair, California. We specialize in custom apparel decoration for businesses, including contract decorators, merch companies, corporate clients, and distributors.

Our services include screen printing, embroidery, digital printing, puff printing, jumbo oversized prints, and retail finishing. We offer wholesale pricing, fast turnaround times, and serve clients throughout Southern California and nationwide.

With over 15 years of experience, we're committed to delivering premium quality custom apparel on time, every time. Request a quote today!
```

### Step 5: Set Up Messaging (Optional)
Enable messaging so customers can contact you directly through Google.

---

## 3. Getting Reviews

Reviews are critical for local SEO. Here's how to get them:

### Generate Your Review Link
1. In Google Business Profile, go to "Get more reviews"
2. Copy your review link
3. It looks like: `https://g.page/r/[your-place-id]/review`

### Request Reviews
Send this to satisfied customers:
```
Hi [Name],

Thank you for choosing Garment Decor! We hope you're happy with your order.

If you have a moment, we'd really appreciate a Google review. It helps other businesses find us!

[Insert your review link]

Thanks again!
The Garment Decor Team
```

---

## 4. Verification Checklist

After completing the above, verify:

- [ ] Google Search Console shows sitemap submitted
- [ ] No crawl errors in Search Console
- [ ] Google Business Profile is verified
- [ ] Business hours are correct
- [ ] All services are listed
- [ ] Photos are uploaded
- [ ] Review link is working

---

## 5. Ongoing SEO Tasks

### Weekly:
- Check Search Console for crawl errors
- Respond to any Google reviews
- Monitor search performance

### Monthly:
- Review Search Console performance report
- Update Google Business Profile with new photos
- Check for and fix any 404 errors

### Quarterly:
- Audit meta descriptions for top pages
- Review and update FAQ content
- Add new portfolio/case study content

---

## 6. Useful Links

- [Google Search Console](https://search.google.com/search-console)
- [Google Business Profile](https://business.google.com)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)

---

## 7. Testing Your Structured Data

After deployment, test your structured data:

1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter your URLs:
   - Homepage (Organization schema)
   - Any product page (Product schema)
   - FAQ page (FAQ schema)
   - Service page (Service schema)
3. Verify no errors are shown

---

## Notes

- Sitelinks (services appearing under your brand name in search) are automatically determined by Google based on your site structure. The Organization schema we added increases the chances of getting them.
- It can take 2-4 weeks for Google to fully index your site and for rich snippets to appear.
- Core Web Vitals affect rankings - monitor them in Search Console under "Experience" > "Core Web Vitals".

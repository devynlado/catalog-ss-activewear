# GA4 Analytics (Admin Page Visitor Analytics)

The **Garment Decor Analytics** page shows the top 20 most visited pages and their traffic by channel (Direct, Google Ads, Organic Search, etc.). Data comes from **Google Analytics 4** when configured.

## Setup

### 1. GA4 Property ID

In [Google Analytics](https://analytics.google.com/): **Admin** → **Property Settings**. Your **Property ID** is the numeric value (e.g. `123456789`).

Set in `.env.local`:

```env
GA4_PROPERTY_ID=123456789
```

### 2. Service account and credentials

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select (or create) the same project that your GA4 property is linked to.
2. Enable the **Google Analytics Data API**:
   - **APIs & Services** → **Library** → search “Google Analytics Data API” → **Enable**.
3. Create a service account:
   - **APIs & Services** → **Credentials** → **Create Credentials** → **Service account**.
   - Give it a name (e.g. “GA4 Analytics Reader”), then **Done**.
4. Create a key for the service account:
   - Open the service account → **Keys** → **Add Key** → **Create new key** → **JSON** → **Create**.
   - Save the downloaded JSON file securely.
5. Grant the service account access in GA4:
   - In GA4: **Admin** → **Property access management** → **+** → **Add users**.
   - Enter the service account email (e.g. `ga4-reader@your-project.iam.gserviceaccount.com`).
   - Role: **Viewer** (or **Analyst**). Save.

### 3. Add credentials to `.env.local`

Put the **entire contents** of the service account JSON into one env var. Options:

**Option A – Single line (recommended for Vercel/serverless)**  
Minify the JSON to one line and set:

```env
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}
```

**Option B – File path (local only)**  
If you keep the key file on disk (e.g. `./ga4-service-account.json`):

```env
GOOGLE_APPLICATION_CREDENTIALS=./ga4-service-account.json
```

And set `GA4_PROPERTY_ID` as above. The code will use the file when `GA4_SERVICE_ACCOUNT_JSON` is not set.

**Security:** Never commit the JSON key or `.env.local`. Add `ga4-service-account.json` and `.env.local` to `.gitignore`.

### 4. Restart the app

Restart the Next.js dev server (or redeploy) so the new env vars are loaded.

### 5. (Optional) Custom metrics for “Value added to cart” and “Value at checkout”

The **Sales by visitor source** section can show **Value added to cart** and **Value at checkout** if you create two custom metrics in GA4. The site sends the event parameters `cart_value` (with `add_to_cart`) and `checkout_value` (with `begin_checkout`).

**If “checkout_value” (or “cart_value”) doesn’t appear in the list:** GA4 often only shows event parameters it has already received. Do this first:

1. On your site: add a product to cart and go to the **checkout** page so a `begin_checkout` event (with `checkout_value`) fires.
2. In GA4: **Reports** → **Realtime** and confirm `begin_checkout` appears when you hit checkout.
3. Wait a few minutes (sometimes up to 24–48 hours) for the parameter to be available in Admin. Then create the custom metric again.

When creating the metric, if GA4 has a **text field** for “Event parameter”, type the name exactly: `checkout_value` or `cart_value` (lowercase, underscore). If it’s **dropdown-only**, the parameter will appear in the list only after step 1–2 and a short wait.

1. In GA4: **Admin** → **Data display** → **Custom definitions** → **Custom metrics** tab → **Create custom metric**.
2. **First custom metric:**
   - **Metric name:** e.g. `Add to cart value`
   - **Event parameter:** type or select `cart_value` (exactly)
   - **Unit of measurement:** Currency → choose revenue/cost type if asked
   - Save.
3. **Second custom metric:**
   - **Metric name:** e.g. `Checkout value`
   - **Event parameter:** type or select `checkout_value` (exactly)
   - **Unit of measurement:** Currency
   - Save.

The API uses `customEvent:cart_value` and `customEvent:checkout_value`. Data will appear in the admin table after the metrics exist and new events are collected. If you skip this step, those two columns show “—” and the rest of the report still works.

### 6. (Optional) Custom dimension for “CTA to Contact” event columns

The **CTA to Contact** table shows which pages send the most visitors to /contact. The “Contact page views” column uses GA4’s built-in **pageReferrer** dimension. The “Form submissions”, “Phone clicks”, “Email clicks”, and “Location clicks” columns need a **custom dimension** so events can be broken down by the page the user came from.

1. In GA4: **Admin** → **Data display** → **Custom definitions** → **Custom dimensions** tab → **Create custom dimension**.
2. **Dimension name:** e.g. `Contact source page`
3. **Scope:** Event
4. **Event parameter:** type or select `contact_source_page` (exactly; the site sends this with events `contact_form_submit`, `contact_phone_click`, `contact_email_click`, `contact_location_click` on the contact page).
5. Save.

**If `contact_source_page` doesn’t appear in the list yet:** The site sends it on every contact-page action (form submit, phone/email/location click), using the referring page path or `(direct)`. Open your live site, go to the **Contact** page (from any page or directly), then click **Phone**, **Email**, or **Location**, or submit the form once. Within a few minutes (or up to 24–48 hours) the parameter should appear in GA4 so you can create the custom dimension. If the field lets you type the name, enter `contact_source_page` exactly.

After the dimension is created and new contact-page events are collected, those four columns will populate. Until then they stay at 0. “Contact page views” always uses native GA4 data (pageReferrer when pagePath = /contact).

## Behavior

- If both `GA4_PROPERTY_ID` and `GA4_SERVICE_ACCOUNT_JSON` are set, the admin **Page Visitor Analytics** table uses live GA4 data (last 30 days, top 20 pages by page views, by channel).
- If either is missing, the table falls back to **mock data** so the page still loads.
- Only users with the **admin** role can open `/admin/analytics` and call the analytics API.

## Channels shown

| Column           | GA4 default channel   |
|------------------|------------------------|
| Direct           | Direct                 |
| Google Ads       | Paid Search            |
| Organic Search   | Organic Search         |
| Organic Social   | Organic Social         |
| Organic Shopping | Organic Shopping       |
| Referral         | Referral               |
| Paid Shopping    | Paid Shopping          |
| Paid Social      | Paid Social            |
| Other            | Display, Video, Email, Affiliates, Unassigned, etc. |

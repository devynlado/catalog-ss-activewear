# Email to Otto Cap API Support

**To:** api@ottocap.com

**Subject:** Sandbox API - Need sample inventory data to complete integration

---

Hi Otto Cap API Team,

I'm integrating the Otto Cap API with our e-commerce platform (Garment Decor) and making good progress with the sandbox environment.

**What's Working:**
- Authentication at `/authenticate/token/` ✓
- Payment methods endpoint ✓
- Shipping methods endpoint ✓
- Customers endpoint ✓

**Issue:**
The inventory endpoint (`/inventory`) requires `sku` and `supplier` parameters, but every query returns "Not found":

```
GET /inventory?sku=31-069&supplier=SSCb2OTd-a1E8-T4aN-aN0j-aa5m@a4aEE@N
Response: {"detail":"Not found."}
```

I've tried various SKU formats (31-069, 31069, 190-1016-MXDSG from docs, etc.) but none return data.

**Questions:**
1. Does the sandbox have sample inventory data loaded?
2. What is the correct supplier ID for Otto Cap products?
3. Can you provide a sample SKU that exists in the sandbox so I can test the inventory response structure?

I'm ready to proceed with placing 3 test orders once I can successfully query inventory.

**My Credentials:**
- Username: purchasing@garmentdecor.com
- Client ID: YQKf96pBIjLtxTUhn39XLQRSV3NsrWdZBPmwdEai

Thank you!

Best regards,
Devyn Lado
Garment Decor

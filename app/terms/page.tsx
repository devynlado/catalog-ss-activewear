import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Garment Decor - Read our terms and conditions for using our services.',
};

export default function TermsPage() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-navy-800 sm:text-4xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: January 28, 2026</p>
        
        <div className="mt-8 space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-navy-800">1. Acceptance of Terms</h2>
            <p className="mt-3 leading-relaxed">
              By accessing or using the Garment Decor website and services, you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">2. Services Description</h2>
            <p className="mt-3 leading-relaxed">
              Garment Decor provides custom screen printing, embroidery, and apparel decoration services 
              for businesses. Our services include but are not limited to:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Screen printing on garments and promotional items</li>
              <li>Embroidery services</li>
              <li>Digital printing</li>
              <li>Custom apparel sourcing</li>
              <li>Retail finishing and fulfillment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">3. Quotes and Orders</h2>
            <p className="mt-3 leading-relaxed">
              All quotes provided are estimates and valid for 30 days unless otherwise specified. Final 
              pricing may vary based on actual artwork requirements, garment availability, and order specifications.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Orders are not confirmed until payment is received and artwork is approved</li>
              <li>Minimum order quantities may apply depending on the decoration method</li>
              <li>Rush orders may incur additional fees</li>
              <li>Prices are subject to change without notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">4. Artwork and Intellectual Property</h2>
            <p className="mt-3 leading-relaxed">
              You represent and warrant that you own or have the right to use any artwork, logos, or 
              designs submitted for production. You agree to indemnify Garment Decor against any claims 
              arising from the use of submitted artwork.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Artwork must be provided in acceptable formats (vector files preferred)</li>
              <li>Additional art charges may apply for recreating or modifying artwork</li>
              <li>We reserve the right to refuse orders with inappropriate or infringing content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">5. Payment Terms</h2>
            <p className="mt-3 leading-relaxed">
              Payment terms vary based on account status and order type:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>New customers: 50% deposit required, balance due before shipping</li>
              <li>Established accounts: Net 30 terms may be available upon approval</li>
              <li>We accept major credit cards, checks, and wire transfers</li>
              <li>Late payments may incur interest charges of 1.5% per month</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">6. Production and Delivery</h2>
            <p className="mt-3 leading-relaxed">
              Standard production time is 7-10 business days after artwork approval and payment. 
              Delivery times are estimates and not guaranteed.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Rush production available for additional fees</li>
              <li>Shipping costs are calculated based on destination and weight</li>
              <li>Risk of loss transfers to buyer upon delivery to carrier</li>
              <li>We are not responsible for delays caused by carriers or circumstances beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">7. Quality and Tolerances</h2>
            <p className="mt-3 leading-relaxed">
              We strive for the highest quality in all our work. Please note:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>A 3% over/under run is standard in the industry and acceptable</li>
              <li>Color matching is approximate; exact PMS matches cannot be guaranteed on all substrates</li>
              <li>Minor variations in print placement (up to 1/4&quot;) are within tolerance</li>
              <li>Garment colors may vary slightly between dye lots</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">8. Returns and Refunds</h2>
            <p className="mt-3 leading-relaxed">
              Due to the custom nature of our products:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Custom decorated items cannot be returned or refunded</li>
              <li>Defective items must be reported within 7 days of receipt</li>
              <li>We will replace defective items at no charge upon verification</li>
              <li>Blank garment returns may be accepted with prior authorization and restocking fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">9. Limitation of Liability</h2>
            <p className="mt-3 leading-relaxed">
              To the maximum extent permitted by law, Garment Decor&apos;s liability for any claim arising 
              from these terms or our services shall not exceed the amount paid for the specific order 
              in question. We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">10. Account Responsibilities</h2>
            <p className="mt-3 leading-relaxed">
              If you create an account with us, you are responsible for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">11. Cancellation Policy</h2>
            <p className="mt-3 leading-relaxed">
              Orders may be cancelled under the following conditions:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Before artwork approval: Full refund minus any art charges incurred</li>
              <li>After artwork approval but before production: 50% cancellation fee</li>
              <li>After production begins: No cancellation or refund available</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">12. Governing Law</h2>
            <p className="mt-3 leading-relaxed">
              These Terms of Service shall be governed by the laws of the State of California. 
              Any disputes shall be resolved in the courts of San Bernardino County, California.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">13. Changes to Terms</h2>
            <p className="mt-3 leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective 
              immediately upon posting. Your continued use of our services constitutes acceptance 
              of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">14. Contact Information</h2>
            <p className="mt-3 leading-relaxed">
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="mt-3 rounded-lg bg-white p-4 border border-stone-200">
              <p className="font-medium text-navy-800">Garment Decor</p>
              <p className="mt-1">4950 Arrow Hwy Suite 4</p>
              <p>Montclair, CA 91763</p>
              <p className="mt-2">
                Email: <a href="mailto:legal@garmentdecor.com" className="text-brand-500 hover:underline">legal@garmentdecor.com</a>
              </p>
              <p>
                Phone: <a href="tel:+18559427636" className="text-brand-500 hover:underline">(855) 942-7636</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Garment Decor - Learn how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-navy-800 sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: January 28, 2026</p>
        
        <div className="mt-8 space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-navy-800">1. Introduction</h2>
            <p className="mt-3 leading-relaxed">
              Garment Decor (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting 
              your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard 
              your information when you visit our website or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">2. Information We Collect</h2>
            <p className="mt-3 leading-relaxed">We may collect information about you in various ways, including:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Personal Information:</strong> Name, email address, phone number, company name, 
                shipping address, and billing information when you request a quote or place an order.
              </li>
              <li>
                <strong>Account Information:</strong> If you create an account, we collect your login 
                credentials and profile information.
              </li>
              <li>
                <strong>Order Information:</strong> Details about your orders, including product specifications, 
                artwork files, quantities, and delivery preferences.
              </li>
              <li>
                <strong>Communication Data:</strong> Messages you send to us, including quote requests, 
                support inquiries, and feedback.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with our website, including 
                pages visited, time spent, and actions taken.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">3. How We Use Your Information</h2>
            <p className="mt-3 leading-relaxed">We use the information we collect to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Process and fulfill your orders</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send you quotes, order confirmations, and shipping updates</li>
              <li>Improve our website and services</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">4. Information Sharing</h2>
            <p className="mt-3 leading-relaxed">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Service Providers:</strong> Third-party vendors who assist with payment processing, 
                shipping, email delivery, and website analytics.
              </li>
              <li>
                <strong>Business Partners:</strong> Suppliers and manufacturers who help fulfill your orders.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">5. Data Security</h2>
            <p className="mt-3 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal 
              information against unauthorized access, alteration, disclosure, or destruction. However, 
              no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">6. Cookies and Tracking</h2>
            <p className="mt-3 leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience on our website. 
              You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">7. Your Rights</h2>
            <p className="mt-3 leading-relaxed">Depending on your location, you may have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt out of marketing communications</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">8. California Privacy Rights</h2>
            <p className="mt-3 leading-relaxed">
              California residents have additional rights under the California Consumer Privacy Act (CCPA), 
              including the right to know what personal information we collect and the right to request deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">9. Children&apos;s Privacy</h2>
            <p className="mt-3 leading-relaxed">
              Our services are not directed to individuals under 18. We do not knowingly collect personal 
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">10. Changes to This Policy</h2>
            <p className="mt-3 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-navy-800">11. Contact Us</h2>
            <p className="mt-3 leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="mt-3 rounded-lg bg-white p-4 border border-stone-200">
              <p className="font-medium text-navy-800">Garment Decor</p>
              <p className="mt-1">4950 Arrow Hwy Suite 4</p>
              <p>Montclair, CA 91763</p>
              <p className="mt-2">
                Email: <a href="mailto:privacy@garmentdecor.com" className="text-brand-500 hover:underline">privacy@garmentdecor.com</a>
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

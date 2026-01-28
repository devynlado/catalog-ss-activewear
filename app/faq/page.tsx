'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    title: 'Pricing',
    items: [
      {
        question: 'How are your prices determined?',
        answer: (
          <>
            <p>Our prices are custom quoted per project. Pricing depends on:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Garment type</strong> (e.g., t-shirts, sweatshirts, performance wear)</li>
              <li><strong>Print method</strong> (screen printing, embroidery, digital squeegee)</li>
              <li><strong>Number of colors &amp; placements</strong></li>
              <li><strong>Order quantity</strong> (larger orders receive volume discounts)</li>
            </ul>
          </>
        ),
      },
      {
        question: 'Do you offer bulk discounts?',
        answer: 'Yes! We offer tiered pricing, meaning the more you order, the cheaper it gets. Our minimum is 50 pieces and we offer price breaks at 75, 100, 150, 250, 500, and 1000.',
      },
      {
        question: 'Do you offer price matching?',
        answer: "We're committed to offering the best value possible. If you receive a lower quote elsewhere, bring it to your sales rep before finalizing your order—we're happy to match it when possible.",
      },
    ],
  },
  {
    title: 'Turnaround',
    items: [
      {
        question: 'What is your standard turnaround time?',
        answer: (
          <>
            <p>Our standard production turnaround time is <strong>10 business days</strong> from the date of <strong>final artwork approval</strong> and <strong>receipt of all blank garments</strong>.</p>
            <p className="mt-2">Turnaround may vary depending on:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Current production volume</li>
              <li>Order size and complexity</li>
              <li>Decoration method (screen printing, embroidery, DTF, etc.)</li>
              <li>Add-on services (relabeling, folding, bagging, etc.)</li>
              <li>Shipping or delivery requirements</li>
            </ul>
          </>
        ),
      },
      {
        question: 'What is your rush order turnaround time?',
        answer: (
          <>
            <p>Rush orders are typically completed within <strong>2–4 business days</strong>, depending on the scope of the project and our current production capacity.</p>
            <p className="mt-2">Rush turnaround is contingent on the following:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Artwork approval</strong> and <strong>blank garment delivery</strong> must be finalized upfront</li>
              <li>All order details (sizes, styles, print specs) must be confirmed with no revisions</li>
              <li>Availability of your requested garments from our suppliers</li>
            </ul>
            <p className="mt-2"><strong>Rush fees apply</strong> and are quoted based on order complexity, decoration method, and required ship/pickup date. Please contact your sales rep as early as possible to confirm if a rush slot is available. Rush jobs are scheduled on a first-come, first-served basis.</p>
          </>
        ),
      },
      {
        question: 'How do I know when a job is complete in production?',
        answer: (
          <>
            <p>You&apos;ll receive a notification from our team as soon as your job is complete. This notification will include:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>A summary of your finished order</li>
              <li>Tracking information (if shipping)</li>
              <li>Pickup instructions (if local)</li>
            </ul>
            <p className="mt-2">If you&apos;re working directly with a sales representative, they will also follow up to ensure everything meets your expectations and confirm that your order is en route or ready for pickup.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Quote',
    items: [
      {
        question: 'How do I request a quote?',
        answer: (
          <>
            <p>You can request a quote by filling out our online quote form, emailing us directly, or giving us a call. To speed up the process, please include as much information as possible, such as:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Quantity per style and size</li>
              <li>Garment type or brand preference</li>
              <li>Number of print locations (front, back, sleeve, etc.)</li>
              <li>Design files or artwork references</li>
              <li>Desired delivery or in-hand date</li>
            </ul>
            <p className="mt-2">The more detail you provide, the faster and more accurately we can quote your project.</p>
          </>
        ),
      },
      {
        question: 'What does my sales rep do during the quote process?',
        answer: (
          <>
            <p>Your sales rep plays a key role in gathering all the details needed to build your quote accurately and efficiently. This includes:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Confirming the garment styles, colors, and sizes you&apos;re requesting</li>
              <li>Verifying current stock availability and lead times with suppliers</li>
              <li>Recommending alternate options if certain items are low or unavailable</li>
              <li>Ensuring artwork and print specs are clear for accurate cost estimation</li>
              <li>Coordinating add-ons like relabeling, folding, or custom packaging if needed</li>
            </ul>
            <p className="mt-2">Our goal is to provide a quote that reflects the <em>true</em> cost and timeline of your project — no surprises.</p>
          </>
        ),
      },
      {
        question: 'Does my quote include everything, or will there be extra charges later?',
        answer: (
          <>
            <p>Your sales rep works to include all relevant costs upfront, such as:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Garment pricing</li>
              <li>Print setup fees</li>
              <li>Add-on services (tags, folding, packing, etc.)</li>
              <li>Estimated shipping or delivery fees</li>
            </ul>
            <p className="mt-2">If you make changes after receiving your quote (e.g. artwork edits, size/quantity updates), we&apos;ll revise the pricing accordingly and get your approval before moving forward.</p>
          </>
        ),
      },
      {
        question: 'How long is pricing valid after receiving a quote?',
        answer: "Quotes are typically valid for 30 days. Due to industry-wide fluctuations in garment availability and wholesale pricing, costs may change outside that window. If your quote has expired, just reach out — we'll gladly refresh it with updated pricing.",
      },
      {
        question: 'Will my sales rep check garment stock before sending my quote?',
        answer: "Yes — we check real-time garment availability with our suppliers during the quote process. However, since inventory levels can change quickly, we can only reserve stock after you approve your quote and we place the order. If stock becomes unavailable in the meantime, we'll contact you immediately to discuss alternatives before printing begins.",
      },
      {
        question: 'What happens if a product is out of stock after I approve my quote?',
        answer: (
          <>
            <p>If a garment becomes unavailable after quote approval and before production, we&apos;ll notify you right away and offer the following options:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Suggest a comparable replacement (same price point and quality)</li>
              <li>Adjust the order with your input</li>
              <li>Requote the order if the replacement item significantly affects pricing</li>
            </ul>
            <p className="mt-2">We&apos;ll never substitute products without your approval. Your satisfaction and transparency in the process are our top priorities.</p>
          </>
        ),
      },
    ],
  },
  {
    title: 'Artwork Approval',
    items: [
      {
        question: 'What is your artwork approval process?',
        answer: (
          <>
            <p>Our <strong>artwork approval process</strong> serves as a formal contract that outlines the exact specifications for how your custom merchandise will be produced. Before your order enters production, you&apos;ll receive a digital proof to review and approve.</p>
            <p className="mt-2">The approval includes the five core elements of your order:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Mockups</strong> – A visual representation of your design on the garment</li>
              <li><strong>Placement</strong> – The exact location of the artwork (e.g., front, back, sleeve)</li>
              <li><strong>Dimensions</strong> – The final width and height of the design in inches</li>
              <li><strong>Process</strong> – The decoration method (screen printing, digital screen printing, or embroidery)</li>
              <li><strong>Color</strong> – The ink or thread colors we&apos;ll use to execute the design</li>
            </ul>
            <p className="mt-2">Please <strong>review the artwork approval carefully</strong> and only select "Approve" if every detail is correct. If you need changes, select "Decline" and include your requested edits. Once approved, production begins based on the information outlined in the artwork approval.</p>
          </>
        ),
      },
      {
        question: 'How do I request revisions to my artwork?',
        answer: (
          <>
            <p>If you notice something that needs adjusting — like placement, sizing, or colors — simply select "Decline" when reviewing your proof and submit your requested changes. Your sales rep or designer will revise it and send a new version for your approval.</p>
            <p className="mt-2"><strong>Important:</strong> Approving artwork locks in the production specs. Changes requested after approval may:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Delay your production schedule</li>
              <li>Incur additional charges</li>
              <li>In some cases, be impossible to accommodate depending on how far along production is</li>
            </ul>
          </>
        ),
      },
      {
        question: 'Can I make changes after approving?',
        answer: 'Post-approval changes may delay your order and may incur additional costs. We advise only approving once all details are 100% correct.',
      },
      {
        question: 'What happens if I approve artwork with a mistake?',
        answer: "If you notice an error after approving your artwork—such as a misspelling, incorrect color, or misplacement—reach out to us immediately so we can make an adjustment to the artwork approval for re-approval. While we cannot guarantee that changes can be implemented once production has started, we will make every effort to intervene if the timing allows. Please keep in mind that your artwork approval is a binding agreement. Garment Decor is not responsible for any mistakes present in a file that was approved, so it's crucial to review all elements carefully.",
      },
      {
        question: 'Can I approve artwork over email or by phone?',
        answer: 'No — all artwork must be approved through our online system. This ensures a clear record of what was approved and protects both parties from miscommunication.',
      },
    ],
  },
  {
    title: 'Manufacturing Guidelines',
    items: [
      {
        question: 'What is your quality control process?',
        answer: (
          <>
            <p>Our quality control process is built into every stage of production to ensure your order meets our standards and your expectations. Here&apos;s how we do it:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Pre-Production:</strong> Every order begins with a digital artwork approval that confirms placement, size, colors, and decoration method. No job proceeds to production without your sign-off.</li>
              <li><strong>Garment Check-In:</strong> All blank garments are staged for production to ensure the correct garment color and style are being produced.</li>
              <li><strong>In-Process Checks:</strong> Our press operators conduct test prints to confirm alignment, color accuracy, and ink coverage. For embroidery, we run a test sew-out before final production.</li>
              <li><strong>Final Inspection:</strong> Once printed or embroidered, each piece is checked for correct placement, design accuracy, and print quality before being packed.</li>
            </ul>
          </>
        ),
      },
      {
        question: 'What is your standard decoration placement?',
        answer: (
          <>
            <p>Our standard print placements are based on industry norms and optimized for the most balanced visual appearance on the garment. Below are our default positioning guidelines:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li><strong>Full Front:</strong> Centered and placed approximately 2&quot;–3&quot; below the front collar seam</li>
              <li><strong>Left Chest:</strong> Positioned approximately 7&quot; down from the shoulder seam, aligned with the wearer&apos;s heart</li>
              <li><strong>Full Back:</strong> Centered and placed approximately 2.5&quot;–3.5&quot; below the back collar seam</li>
            </ul>
            <p className="mt-2">These measurements may be slightly adjusted based on garment style, size, or decoration method to ensure optimal results. If you require custom placement, please specify during the artwork approval process.</p>
          </>
        ),
      },
      {
        question: 'Do you use different stencil sizes when producing an order?',
        answer: 'By default, all items within a single order will be decorated using the same image size across all garment sizes, unless a different size is specifically requested and noted on the approved artwork. If you require a variation in image size (for example, a smaller print on youth or ladies\' garments), it will be treated as a separate design, and additional setup and production charges will apply.',
      },
      {
        question: 'What is your image and placement variance policy?',
        answer: 'We will do everything we can to ensure images are printed in a consistent location on all garments within a run. However, small variations should be expected due to human involvement and require a 1 inch acceptable variance. If there are no requests made for specific locations, Garment Decor will resort to industry standard practices to ensure consistent placement.',
      },
      {
        question: 'Do you print over seams or near collars?',
        answer: 'We do our very best to produce the most professional looking prints. However, printing on seams, collars, pockets, zippers or variety of fabrics is subject to distortion, print imperfections, and/or other small inconsistencies. These are all considered acceptable goods and will not be considered misprints. An image size printed within 1 inch of any seam is subject to distortion and print imperfections.',
      },
      {
        question: 'When printing on hoodies, do you align the design with the center of the garment or the center of the pocket pouch?',
        answer: "To ensure your design looks balanced when worn, we align prints to the center of the hoodie based on the sleeves—not the pouch. Since pouches are often sewn slightly crooked from the factory, this method keeps your artwork visually centered when worn, even if the pouch is a bit off.",
      },
      {
        question: 'Why did you not tell me about a potential scenario regarding my production order?',
        answer: "At Garment Decor, we work hard to raise awareness of potential production challenges, but it's important to note that we cannot predict every possible outcome. We aim to be transparent, but we also rely on your input when making decisions during the ordering process. We will not assume responsibility for print imperfections that arise from printing too closely to seams, zippers, pockets, or collars, particularly when the customer requests this specific placement.",
      },
    ],
  },
  {
    title: 'Spoilage Policy & Allowance',
    items: [
      {
        question: 'What is your spoilage policy?',
        answer: 'Our spoilage policy applies to screen printed or embroidered garments that do not meet our quality control standards. These items are considered unacceptable and are removed from production to ensure only high-quality products are delivered.',
      },
      {
        question: 'How much spoilage do you allow per order?',
        answer: 'Spoilage percentage is determined by several factors, including the number of print or embroidery locations required, artwork complexity, fabric difficulty, and technical positioning. Given these variables, our spoilage policy allows for up to 5% spoilage. However, historically, our average spoilage rate has been closer to 2% for the orders we produce.',
      },
      {
        question: "Why don't you re-print spoiled items or include them in the order?",
        answer: 'A large percentage of our customer base is reselling the apparel or using it for employee wear, which means we take great pride in passing off only quality merchandise that we stand behind. We do not include spoiled garments in an order unless we find it professionally reasonable to do so. To keep our prices competitive and affordable, we have made the decision to move forward with removing spoiled items from an order.',
      },
      {
        question: 'Can you provide an example of what might happen with spoilage in an order?',
        answer: "For example, if 100 garments are ordered and 3 small shirts are misprinted, the order meets our spoilage policy since 97% of the total was fulfilled successfully. While the loss may be concentrated in one size, it is still within acceptable industry standards. Unless specifically requested on the order that an exact quantity is needed, a customer would not qualify for a reprint of the 3 small shirts although they would be refunded.",
      },
    ],
  },
  {
    title: 'Customer-Owned Garments & Liability',
    items: [
      {
        question: 'What happens if you find an item that is spoiled?',
        answer: 'In the instance of identifying a spoiled garment, the item is removed from your order and repurposed for sample fabric.',
      },
      {
        question: 'What is your policy on decorating expensive garments?',
        answer: "Due to the wholesale nature of bulk production and cost effective pricing, we reserve the right to refuse accepting customer supplied products should the ratio of blank product cost significantly outweigh the production charges associated with decorating such an expensive garment. We only provide insurance for items when we supply the products ourselves. If you are supplying your own products, the responsibility for damaged goods will fall to the customer.",
      },
      {
        question: 'What do you do with garments that are spoiled in production?',
        answer: 'Garments that are spoiled in production are carefully inspected and removed from the production line. They are not shipped to customers. Depending on the nature of the issue, we may either recycle the fabric or dispose of the garment in an environmentally responsible manner.',
      },
      {
        question: 'When will I be notified if there is spoilage in my order?',
        answer: 'Spoilage is addressed after production is complete and during the packing and shipping stage. At that time, we update your invoice to reflect only the accurate quantities of approved items being shipped. Once the invoice is adjusted, you will be able to view the final count and the revised balance due.',
      },
      {
        question: 'What happens if I receive an item in my order that is spoiled?',
        answer: "While we maintain strict quality control, our process involves human labor and there is a small chance—typically less than 1%—that a misprint or defect could make it through to your final shipment. If you receive a spoiled item in your order, please notify us promptly. We'll review the issue against the approved artwork or sample and determine an appropriate resolution, which may include a refund or credit.",
      },
      {
        question: 'Do you offer refunds on spoiled items?',
        answer: 'If any items are spoiled during production, we will adjust your invoice to reflect only the items that were successfully produced. Our front office will review the order and ensure that the final amount charged corresponds to the quantity of acceptable products. You will receive a credit or refund for the spoiled goods based on the adjusted total.',
      },
    ],
  },
  {
    title: 'Exact Quantity Necessary',
    items: [
      {
        question: 'Do you offer exact quantity fulfillment?',
        answer: 'Garment Decor can fulfill exact quantity orders, but only when this requirement is clearly communicated and confirmed prior to order approval.',
      },
      {
        question: "What are the chances my order won't be 100% complete?",
        answer: 'While we strive for accuracy, Garment Decor reserves the right to decline exact quantity guarantees on orders with high complexity—such as multiple print locations or high-value garments. These projects carry a higher risk of spoilage and may not be eligible for exact count fulfillment.',
      },
      {
        question: 'Why does exact quantity come with an additional charge?',
        answer: 'Fulfilling an exact quantity requires us to order extra blanks, pre-schedule production, and implement additional measures to guarantee this. Because of these added steps and labor, an exact quantity order may incur an additional fee depending on the scope of the project.',
      },
      {
        question: 'Are incomplete orders common?',
        answer: "Not at all. We take pride in fulfilling orders as completely as possible. That said, due to the nature of custom manufacturing, minor spoilage may occur. Please refer to our spoilage policy to better understand how we manage those scenarios.",
      },
    ],
  },
  {
    title: 'Re-Labeling Services',
    items: [
      {
        question: 'Are you able to re-label a blank product?',
        answer: (
          <>
            <p>Yes, we can re-label a blank product, but it&apos;s important to understand the type of label currently on the garment to determine the best approach for rebranding.</p>
            <p className="mt-2"><strong>Tear-Away Labels:</strong> If your shirts come with tear-away tags, we will remove them free of charge and print your custom neck label in its place.</p>
            <p className="mt-2"><strong>Cut-Away Labels:</strong> Some garments may come with cut-away labels, which are designed to be removed by cutting. While we can remove these as well, it requires additional labor and may incur extra charges.</p>
          </>
        ),
      },
      {
        question: 'What are the downsides of a tear away label when doing a re-label?',
        answer: 'While we remove tear-away labels free of charge, there may be some minor downsides to this process. Small pieces of the label may remain in the garment\'s seam, or the stitching on the backside of the neck may experience slight damage. We are not responsible for removing all remnants of the label unless seamstress services are requested as part of your order.',
      },
      {
        question: 'What issues arise if the garment has a cut away label?',
        answer: 'Garments with cut-away labels require additional labor to remove the existing label. A seamstress will need to unstitch the label and resew the area, which involves more time and effort. Due to the extra labor involved, an additional surcharge will be applied if this service is required.',
      },
      {
        question: 'What issues arise with screen printed neck tags?',
        answer: 'Screen printed neck tags can sometimes cause ink to bleed through to the opposite side of the garment, especially if the artwork has heavy ink coverage or if the fabric is thin. This may result in a visible print on the outside of the garment.',
      },
      {
        question: 'How do you avoid ink from bleeding through the backside?',
        answer: 'To minimize the risk of ink bleeding through to the backside, we default to using light grey ink for neck tag production. This color is effective at reducing bleed-through and works well with most garment colors, ensuring a clean and professional finish.',
      },
    ],
  },
  {
    title: 'Color Accuracy',
    items: [
      {
        question: 'Do you offer an exact color match based on my design?',
        answer: 'We cannot guarantee ink colors based on visual mockups due to monitors varying significantly from one computer to the next. Therefore, Garment Decor will assign a color code or Pantone number from our ink selection list and often use our best judgement. As a result, your finished product may look slightly different in color than your original artwork. We\'ll include the color code or Pantone number in your artwork approval for you to confirm before we proceed with production.',
      },
      {
        question: 'Do you offer pantone matching based on a PMS code I provide you for screen printing?',
        answer: 'Should your design require a specific color, Garment Decor requires a Pantone number to be provided by the client in order to accurately match the color in a design.',
      },
      {
        question: 'Do you offer pantone matching based on a PMS code I provide you for embroidery?',
        answer: "Since Pantone matching in our embroidery department is not possible, we will work to assign the closest thread color available that is in stock prior to proceeding. Due to this, we cannot guarantee thread colors match 100% to your original artwork. Confirmation of this thread color will be required before producing your garments to ensure approval and satisfaction.",
      },
      {
        question: 'What thread supplier do you use for your embroidery services?',
        answer: 'We use Madeira Polyneon thread.',
      },
      {
        question: 'Do you offer exact pantone matches on re-orders?',
        answer: "Due to the nature of printing and different fabric lots, we cannot guarantee exact ink color matches on reorders. We will make every effort to match the original color as best as possible by using our Pantone mixing system and printing it with the correct PMS color. If you know a reorder will be likely, please let us know and we'll try to keep ink on hand if at all possible.",
      },
    ],
  },
  {
    title: 'Garments Supplied by Garment Decor',
    items: [
      {
        question: "I'm not sure which blank to choose. Can I request samples?",
        answer: "Absolutely. If you're undecided on which garment to use, we strongly recommend ordering blank samples before proceeding with a full production run. This helps ensure you're confident in your selection.",
      },
      {
        question: 'What is the cost of blank samples?',
        answer: 'Blank samples are billable items and are priced based on the specific garment selected. Shipping costs also apply and will vary depending on your location and order size.',
      },
      {
        question: 'Can I apply my sample costs to my final order?',
        answer: 'Yes, in most cases. If blank samples are returned in unused and undamaged condition before your production run begins, we can apply a credit toward your final invoice.',
      },
      {
        question: "What if I'm unhappy with the blanks after decoration?",
        answer: 'Once garments are decorated, Garment Decor cannot be held responsible for dissatisfaction related to color, fit, shape, or style. While we do our best to guide you toward a suitable option, we expect you to review product details and, if needed, test samples in advance to make an informed decision.',
      },
      {
        question: 'What if I find defects in the blank garments used in my order?',
        answer: (
          <>
            <p>While we strive to catch any visible garment defects during the production process, <strong>Garment Decor is not responsible for manufacturer-related issues</strong> such as fabric inconsistencies, mislabeled sizing, loose threads, label inconsistencies, or minor blemishes.</p>
            <p className="mt-2"><strong>To reduce the risk of shortages due to defects, we strongly recommend ordering at least 5% extra of each size.</strong> If you do encounter garments with noticeable defects, please contact us. We may offer a credit or refund for garments that are clearly affected by manufacturer flaws.</p>
          </>
        ),
      },
      {
        question: "What happens if the blank items don't fit who I intended them for?",
        answer: "We do our best to provide garment size specs for each product. If size specs are not listed on our site, we recommend you confirm and verify them on the manufacturers' site. If there's any doubt about whether you'll like the selected garment, we recommend ordering a blank sample first.",
      },
    ],
  },
  {
    title: 'Customer Supplied Garments',
    items: [
      {
        question: 'What do I need to do when supplying my own garments for an order?',
        answer: 'When providing your own garments, you must include an itemized list that clearly outlines each style, color, size, and quantity being delivered. Garment Decor is not responsible for any issues that arise from shipments lacking proper documentation. All shipments must include an order number on the exterior of the box, along with tracking information and a corresponding order confirmation.',
      },
      {
        question: "What's the process once my garments arrive at your facility?",
        answer: 'Upon delivery, we perform a garment check-in to reconcile the received items against your submitted itemized list. This helps us confirm the correct quantities and styles were delivered before production begins.',
      },
      {
        question: 'What happens if your team counts a different quantity than what I shipped?',
        answer: 'If our count differs from the quantity you stated, Garment Decor is not liable for the discrepancy. We will proceed based on the count we verify during our check-in process and recommend confirming your shipment carefully before sending.',
      },
      {
        question: 'Is there a fee for sending in my own garments?',
        answer: 'Yes, we may charge a sorting and processing fee per unit when handling customer-supplied goods. This fee covers the additional labor and care required to ensure each item is ready for decoration.',
      },
      {
        question: 'What is your policy on customer-supplied garments and insurance coverage?',
        answer: (
          <>
            <p>Please note that all customer-supplied items are left at your own risk. Our insurance coverage only extends to the value of the <em>decoration service itself</em>, not the garment.</p>
            <p className="mt-2">For example, if you&apos;re providing a $100 jacket for a $5 screen print, our liability is limited to the $5 service—not the replacement cost of the garment.</p>
            <p className="mt-2">If you want peace of mind with full insurance coverage, we recommend letting us supply the blank garments.</p>
          </>
        ),
      },
      {
        question: 'What else should I know about shipping garments to your warehouse?',
        answer: "Our facility is monitored by 24/7 video surveillance. If a dispute arises regarding your shipment, we can provide footage of your delivery within five business days upon request. However, it's still your responsibility to provide accurate order documentation and ensure your shipment is properly labeled and traceable.",
      },
    ],
  },
  {
    title: 'Shipping Options & Carriers',
    items: [
      {
        question: 'What shipping carrier do you use?',
        answer: 'We ship via USPS, UPS, & FedEx.',
      },
      {
        question: 'What shipping methods do you offer?',
        answer: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Ground Shipping (5-7 business days)</li>
            <li>Expedited Shipping (2-3 business days)</li>
            <li>Overnight Shipping (Next-day delivery)</li>
          </ul>
        ),
      },
      {
        question: 'Do you charge for shipping?',
        answer: "Shipping expenses are the responsibility of the client and will be added to your invoice unless otherwise agreed upon prior to your order. Shipping costs are not normally included on quotes.",
      },
      {
        question: 'Can I use my own shipping account #?',
        answer: "Customer supplied shipping account #'s can be provided. Please contact your account rep to provide them with this information. We will then list this information on your order and send you the tracking once it has been shipped.",
      },
      {
        question: 'Do you offer blind shipping?',
        answer: 'Blind shipping is available upon request. Please reach out to your account representative to arrange this service. Orders are not blind shipped by default, so be sure to request it in advance.',
      },
      {
        question: 'Do you offer will call pick up?',
        answer: 'Yes! Our will call address is 4778 W Mission Blvd. Montclair, CA 91762.',
      },
    ],
  },
  {
    title: 'Delivery Status & Support',
    items: [
      {
        question: 'How will I know if my order has shipped?',
        answer: "Once your order has been shipped, you will receive an email notification that includes your tracking number, carrier information, and a link to monitor the delivery status. If your order is being split into multiple shipments, you may receive multiple tracking notifications. Please check your spam or promotions folder if you haven't received shipping details within the expected timeframe.",
      },
      {
        question: 'What should I do if my package is delayed?',
        answer: "If your package is delayed, we recommend starting by checking the tracking link for the most up-to-date information. If you notice any issues or the package seems to be stuck in transit, please reach out to us. We're here to help and will gladly follow up with the carrier.",
      },
      {
        question: 'What if my package is lost?',
        answer: (
          <>
            <p>If your tracking information hasn&apos;t updated or your package is marked as &quot;Delivered&quot; but cannot be located, please follow these steps:</p>
            <ol className="mt-2 list-decimal pl-5 space-y-1">
              <li>Check with neighbors, building staff, or others who may have received the package on your behalf.</li>
              <li>Contact the shipping carrier directly with your tracking number to initiate an investigation.</li>
              <li>Notify your Garment Decor account representative so we can help facilitate a claim if needed.</li>
            </ol>
            <p className="mt-2">Please note that all shipments are sent <strong>FOB (Freight on Board)</strong> — meaning the responsibility for the package transfers to the customer once the carrier picks it up from our facility.</p>
          </>
        ),
      },
      {
        question: 'What happens if my order shows up damaged?',
        answer: 'If your order arrives with visible damage, please inspect the shipment immediately and document the condition with clear photos. Garment Decor is not responsible for damage incurred during transit. However, we will gladly assist in filing a damage claim with the carrier on your behalf. To support your claim, please notify us within 48 hours of delivery.',
      },
      {
        question: "Who's responsible for shipping once it leaves your facility?",
        answer: "Garment Decor assumes no responsibility for goods once they have left our facility. All shipments are considered FOB (Freight on Board), meaning ownership and responsibility transfer to the customer as soon as the carrier picks up the order. This includes any risks associated with delays, damage, theft, or loss during transit.",
      },
    ],
  },
  {
    title: 'Packaging & Fulfillment',
    items: [
      {
        question: 'How do you package your orders?',
        answer: 'All orders will be bulk packaged which is generally folded by the dozen for shirts and half dozens for fleece, unless the order includes retail finish. Based on the garment variation and other factors, we might deviate from our typical packaging procedures if we find it professionally reasonable to do so.',
      },
      {
        question: 'What type of boxes do you ship out of?',
        answer: 'We prioritize sustainability by re-using the corrugated boxes that our suppliers use to ship the blank products. This helps reduce waste, minimize our environmental impact, and ensures your items are safely packaged for delivery.',
      },
    ],
  },
  {
    title: 'Incorrect Orders',
    items: [
      {
        question: "How do I proceed if there's a mistake in my order?",
        answer: "If there's a mistake, please contact us right away with clear photos of the issue. We will then need the returned items to rectify the problem. Once we have the chance to inspect the items, we will either reprint, refund, or issue a credit, depending on the situation.",
      },
      {
        question: 'Scenario 1: The wrong garment was used (style, color, or size)',
        answer: "If you received a different garment than what was approved in your quote or proof (for example, the wrong shirt color or brand): We'll reprint your order using the correct garments at no additional cost to you. We may request photos or ask you to return the incorrect items before proceeding with the reprint.",
      },
      {
        question: 'Scenario 2: The print is incorrect (wrong design, color, or placement)',
        answer: "If the artwork differs from the approved mockup — such as the wrong ink color, placement, or even a different design — that's on us. We'll reprint the affected items to match the approved proof. We may request photos or return of misprinted items for quality assurance.",
      },
      {
        question: 'Scenario 3: You received fewer items than ordered',
        answer: "If your packing slip says 100 pieces but you received only 95, this could be due to spoilage or fulfillment error. We'll verify the shortage and offer a refund for the missing items.",
      },
      {
        question: 'Scenario 4: You received more items than ordered',
        answer: 'This sometimes happens due to overproduction. Lucky you! Extra items are yours to keep at no additional charge unless otherwise noted during order setup.',
      },
      {
        question: 'Scenario 5: A few prints have minor flaws, but most of the order is correct',
        answer: "Occasional flaws can occur in the production process, especially on large runs. We follow an industry standard spoilage allowance. If the spoilage is within standard limits, we may not offer a reprint unless you've specifically requested 100% exact quantity. If it exceeds acceptable limits, we'll reprint or refund the flawed items.",
      },
      {
        question: 'Why do you need the affected garments returned for resolution?',
        answer: 'Returning the garments allows us to properly assess the issue and ensure the appropriate resolution. We cannot proceed with processing any claims for reprints or credits unless we are given the opportunity to rectify the issue through the returned items.',
      },
    ],
  },
  {
    title: 'Cancellation Process',
    items: [
      {
        question: 'Do you offer changes or cancellations to an order?',
        answer: 'Orders are immediately processed upon payment of your order and blank garments are ordered from our suppliers. We do this quickly to secure the stock and get it on its way to our warehouse.',
      },
      {
        question: 'Do you charge a re-stocking fee on orders that are changed or cancelled after approval?',
        answer: 'There is a 20% restocking fee if you wish to cancel or change your order after you have paid.',
      },
      {
        question: 'Why is there a re-stocking fee?',
        answer: 'We assess this cost because there are charges associated with shipping back the blank product to our suppliers and a fee imposed by the warehouse.',
      },
      {
        question: 'When can I not change or cancel an order?',
        answer: 'Orders cannot be changed or canceled if the order has gone through the artwork approval stage. Please do not approve or place your order if you are not 100% sure that you are wanting to move forward or if the order is subject to cancellation from factors outside of your control.',
      },
    ],
  },
  {
    title: 'Non-refundable Items',
    items: [
      {
        question: 'Do you offer refunds for shipping delays?',
        answer: "No, shipping delays caused by UPS, FedEx, or USPS are out of our control and the responsibility is on the customer once the freight is on board. If you need a guaranteed delivery, we recommend using expedited shipping on your order to factor in any potential shipping delays.",
      },
      {
        question: 'What cannot be returned?',
        answer: (
          <>
            <p>Since every order is custom-made, we follow a 3-step approval process: quote, artwork approval, and pre-production photo samples. Once all three steps are completed, returns are generally not accepted. However, returns may be considered if your items meet the following criteria:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Items that do not match the approved artwork approval</li>
              <li>Items that fall outside of our manufacturing variance parameters</li>
            </ul>
          </>
        ),
      },
      {
        question: 'My tracking says "Delivered," but I didn\'t receive my package. What should I do?',
        answer: "If your tracking information shows that your order was delivered but you haven't received it, we recommend first checking with neighbors, household members, or your local delivery carrier. If the package is still missing, please contact us. We'll assist you in filing a claim with the carrier. Please note that all shipments are sent FOB, meaning lost shipments do not automatically qualify for a refund, but we will do everything we can to help resolve the issue.",
      },
      {
        question: 'What else is not covered?',
        answer: (
          <ul className="list-disc pl-5 space-y-1">
            <li>Issues stemming from customer-supplied garments (see our Blank Garment Policy)</li>
            <li>Garments that shrink, fade, or behave differently due to post-care not following washing guidelines</li>
            <li>Design or spelling errors approved by the customer during the mockup stage</li>
          </ul>
        ),
      },
    ],
  },
];

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-stone-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="pr-4 text-sm font-medium text-slate-900">{item.question}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-brand-500'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-[2000px] pb-4' : 'max-h-0'
        )}
      >
        <div className="text-sm text-slate-600 leading-relaxed">
          {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
        </div>
      </div>
    </div>
  );
}

function FAQCategorySection({ category }: { category: FAQCategory }) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="self-start rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-stone-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">{category.title}</h2>
      </div>
      <div className="px-6">
        {category.items.map((item, index) => (
          <FAQAccordionItem
            key={index}
            item={item}
            isOpen={openItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set([0]));

  // Filter categories based on search
  const filteredCategories = searchQuery
    ? faqCategories
        .map(category => ({
          ...category,
          items: category.items.filter(
            item =>
              item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (typeof item.answer === 'string' &&
                item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
          ),
        }))
        .filter(category => category.items.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="bg-[#070131] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Frequently Asked Questions
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
              Everything you need to know about working with Garment Decor. 
              Can&apos;t find what you&apos;re looking for?{' '}
              <Link href="/contact" className="text-brand-400 hover:text-brand-300 underline">
                Contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="relative -mt-6">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white py-4 pl-12 pr-4 text-sm shadow-lg placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredCategories.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {filteredCategories.map((category, index) => (
                <FAQCategorySection key={index} category={category} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
              <HelpCircle className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No results found</h3>
              <p className="mt-2 text-sm text-slate-600">
                We couldn&apos;t find any questions matching &quot;{searchQuery}&quot;.
                Try a different search term or{' '}
                <Link href="/contact" className="text-brand-600 hover:text-brand-700">
                  contact us
                </Link>{' '}
                directly.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-stone-200 bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold text-slate-900">Still have questions?</h2>
          <p className="mt-2 text-slate-600">
            Our team is ready to help you with your next project.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              Contact Us
            </Link>
            <a
              href="tel:+18559427636"
              className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-stone-50"
            >
              Call (855) 942-7636
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

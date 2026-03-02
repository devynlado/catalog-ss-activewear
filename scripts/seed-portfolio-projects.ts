/**
 * Seed portfolio projects from old.garmentdecor.com into Sanity.
 * Run from project root: npm run seed:portfolio  (or npx tsx scripts/seed-portfolio-projects.ts)
 * Requires in .env.local: NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 */

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from 'next-sanity';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET');
  process.exit(1);
}
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN. Create a token at https://sanity.io/manage with Editor permissions.');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

/** Portable text: one paragraph */
function ptParagraph(text: string) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style: 'normal',
    children: [{ _type: 'span', _key: '1', text: text }],
    markDefs: [],
  };
}

const projects = [
  {
    _type: 'project',
    title: 'Custom Streetwear Printing: Lane Seven LS16005 Lunar Rock by Garment Decor',
    slug: { _type: 'slug', current: 'custom-streetwear-printing-lane-seven-ls16005-lunar-rock-by-garment-decor' },
    tags: ['Screen Printing', 'Tops', 'Streetwear'],
    product: 'Lane Seven LS16005 Urban Heavy Tee',
    decoration: 'screen-printing',
    materials: 'Oversize Fit 7.66 oz 100% combed cotton jersey',
    designName: 'I Love EDM',
    shortDescription:
      'A man holding the front view of the Lane Seven LS16005 Urban Heavy Tee in Lunar Rock showcases a bold and vibrant "I Love EDM" design expertly screen-printed by Garment Decor. The spacious front panel of this premium tee provides the perfect canvas for detailed and eye-catching designs.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we specialize in creating bold, standout apparel for clients across various industries. Our recent project for the Lane Seven LS16005 Urban Heavy Tee in Lunar Rock perfectly showcases our screen printing capabilities, combining premium heavyweight fabric with a vibrant "I Love EDM" design.'
      ),
      ptParagraph(
        'Attention to detail is key, and the neck label view of this custom-printed Lane Seven tee demonstrates Garment Decor\'s dedication to branding excellence. Featuring a smooth, tear-away label, the shirt ensures maximum comfort while providing the perfect spot for custom branding. Add your brand\'s neck label for a professional, retail-ready finish that enhances your streetwear line\'s identity.'
      ),
    ],
    testimonialQuote:
      "The yoke view highlights the impeccable craftsmanship of the Lane Seven LS16005 tee. Its sturdy stitching and seamless construction ensure durability, making it ideal for heavy use. Garment Decor's high-quality screen printing ensures the design maintains its boldness even when viewed from different angles.",
    testimonialAuthor: 'Streetwear Client',
    publishedAt: new Date().toISOString(),
  },
  {
    _type: 'project',
    title: '3D Puff Screen Printed Los Angeles Apparel 1801GD T-Shirts & LS14001 Hoodies for Swish Studios',
    slug: { _type: 'slug', current: 'screen-print-puff-ink-for-swish-studios' },
    tags: ['Puff Screen Printing', 'Retail Finishing', 'Screen Printing', 'Shirts', 'Sweatshirts', 'Tops'],
    product: '6.5oz Garment Dye Crew Neck T-Shirt Style 1801GD and LS14001 Premium Pullover Hoodie',
    decoration: 'puff-screen-printing',
    materials:
      'Unisex • Made in Los Angeles, Calif. • 6.5 oz/yd2/ 220 g/m2 • 18/1 Open-end Cotton • 100% Shrink Free Garment dye Cotton',
    designName: 'All Hit No Misses',
    client: 'Swish Studios',
    shortDescription:
      'At Garment Decor, we completed a bulk screen printing project for Swish Studios, producing 750 Los Angeles Apparel 1801GD t-shirts and 350 LS14001 Premium Pullover Hoodies. Both garments featured a large puff ink design, which added texture and dimension to the black apparel.',
    longDescription: [
      ptParagraph(
        'We used puff ink to create a raised, textured design on both the t-shirts and hoodies. This technique made the white design stand out boldly against the black fabric, delivering a professional and eye-catching look. Our state-of-the-art equipment, including our M&R Challenger 3 16/18 automatic screen printing presses, allowed us to meet the project\'s tight deadlines without compromising on quality.'
      ),
      ptParagraph(
        'We provided retail finish services for both the t-shirts and hoodies. This included folding, bagging, and size sticker application, ensuring the garments were ready for sale upon delivery.'
      ),
    ],
    testimonialQuote:
      "Swish Studios was impressed with the speed and quality of our work. They shared that the puff ink design exceeded their expectations and that Garment Decor's rush screen printing service helped them meet their tight deadline for a product launch. The retail finishing added a professional touch, ensuring the products were ready for immediate sale.",
    testimonialAuthor: 'Swish Studios',
    publishedAt: new Date().toISOString(),
  },
  {
    _type: 'project',
    title: 'Jumbo Screen Printing for LA Apparel 1801GD: Black Wall Street T-Shirts',
    slug: { _type: 'slug', current: 'jumbo-screen-printing-for-la-apparel-1801gd-black-wall-street-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: 'jumbo-screen-printing',
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Black Wall Street',
    client: 'New Haven Festivals Inc.',
    shortDescription:
      'A man holding this back view highlights the smooth and professional finish of the Black Wall Street T-Shirt, printed by Garment Decor on a white Los Angeles Apparel 1801GD Garment Dye Crew Neck, ensuring style and quality for New Haven Festivals Inc.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we specialize in creating bold, standout apparel for clients across various industries. Our recent project for New Haven Festivals Inc. perfectly showcases our jumbo screen printing capabilities, combining the Los Angeles Apparel 1801GD Garment Dye Crew Neck with the Black Wall Street Homecoming design.'
      ),
      ptParagraph(
        'The full back coverage jumbo print (17.5" x 23") creates a striking visual that celebrates a cultural event with vibrant, oversized graphics. The premium LA Apparel 1801GD fabric—6.5 oz garment-dyed cotton—provides the ideal canvas for bold, high-impact decoration.'
      ),
    ],
    testimonialQuote:
      'A close-up of the intricate Black Wall Street design from New Haven Festivals Inc. printed on a white 6.5oz LA Apparel 1801GD T-Shirt by Garment Decor, emphasizing the vibrant colors and fine details of the jumbo screen print.',
    testimonialAuthor: 'New Haven Festivals Inc.',
    publishedAt: new Date().toISOString(),
  },
  {
    _type: 'project',
    title: 'Custom Embroidery on Otto Cap Trucker Hats for Streetwear Brands',
    slug: { _type: 'slug', current: 'custom-embroidery-on-otto-cap-trucker-hats-for-streetwear-brands' },
    tags: ['Embroidery', 'Trucker Hat'],
    product: 'Otto Cap 39-165 5 Panel High Crown Mesh Back Trucker Hat',
    decoration: 'embroidery',
    materials: '5-panel cap Plastic Adjustable Snap Polyester Foam Front 100% Polyester Front Panel w/ Lining',
    designName: 'Sunset Oil Mini Mart',
    shortDescription:
      'A man holding a detailed front view of the Otto Cap 39-165 5-panel high crown mesh back trucker hat in Kelly-White-Kelly, showcasing Garment Decor\'s custom embroidery services with a Sunset Oil Mini Mart logo.',
    longDescription: [
      ptParagraph(
        'Garment Decor delivers custom embroidery on premium headwear for streetwear brands and retailers. This project features the Otto Cap 39-165 5 Panel High Crown Mesh Back Trucker Hat in multiple colorways, each adorned with the vibrant Sunset Oil Mini Mart logo.'
      ),
      ptParagraph(
        'Our embroidery team uses high-quality thread and precise digitizing to ensure crisp, durable logos that stand up to wear. The 5-panel construction and foam front provide a structured, retail-ready look ideal for brands and events.'
      ),
    ],
    testimonialQuote:
      'Front view of mass-produced Otto Cap 39-165 trucker hats showcasing variety of colors with high-quality custom embroidery by Garment Decor, featuring the vibrant Sunset Oil Mini Mart design.',
    testimonialAuthor: 'Streetwear Brand',
    publishedAt: new Date().toISOString(),
  },
  {
    _type: 'project',
    title: "Why Streetwear Brands Love Garment Decor's Digital Squeegee Print on AS Colour Tees",
    slug: { _type: 'slug', current: 'why-streetwear-brands-love-garment-decors-digital-squeegee-print-on-as-colour-tees' },
    tags: ['Digital Screen Printing', 'Tops'],
    product: 'AS Colour 5080 Heavy Tee',
    decoration: 'digital-screen-printing',
    materials: 'Oversized Heavyweight, 8.2 oz 100% carded cotton',
    designName: 'Welcome Las Vegas',
    shortDescription:
      "Capture the essence of streetwear with Garment Decor's vibrant custom digital squeegee prints on the AS Colour 5080 Heavy Tee. This 'Welcome Las Vegas' design is perfect for brands seeking bold and durable custom apparel.",
    longDescription: [
      ptParagraph(
        'Digital squeegee printing combines the durability of screen printing with the flexibility of full-color digital artwork. For this project, we printed the "Welcome Las Vegas" design on the AS Colour 5080 Heavy Tee—an oversized, 8.2 oz heavyweight tee that has become a streetwear staple.'
      ),
      ptParagraph(
        'Showcase every detail of your custom designs with Garment Decor\'s digital squeegee printing. The precision and vibrancy of the print highlight why streetwear brands choose us for bold, photorealistic apparel that stands up to repeated wear and washing.'
      ),
    ],
    testimonialQuote:
      "Zoomed in Front view of the OAD117 Large Canvas Tote in natural color, customized with precision and vibrant artwork of Milkyway Brands x Nordstrom x Jordan Brand event using digital squeegee printing by Garment Decor. Perfect for branding and marketing campaigns.",
    testimonialAuthor: 'Streetwear Brand',
    publishedAt: new Date().toISOString(),
  },
  // --- 16 projects from old.garmentdecor.com/portfolio (added for migration) ---
  {
    _type: 'project',
    title: 'Custom Screen Printing for Alternative Apparel AA1070 Tees: Stand Out',
    slug: { _type: 'slug', current: 'custom-screen-printing-for-alternative-apparel-aa1070-tees-stand-out' },
    tags: ['Screen Printing', 'Tops'],
    product: 'Alternative Apparel AA1070 Unisex Go-To T-Shirt',
    decoration: 'screen-printing',
    materials: 'Unisex classic fit Garment-washed 100% combed and ringspun cotton',
    designName: "Snoopy's Surf Shop Hawaii",
    shortDescription:
      'A man holding the full back view of the Alternative Apparel AA1070 Unisex Go-To T-Shirt in Brown Sepia, showcasing the Snoopy\'s Surf Shop-inspired custom screen print design printed by Garment Decor.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we provide expert custom screen printing services tailored to clothing brands and collaborations. Premium garment expertise, quick turnaround, retail finishing, and custom neck tags help elevate branding for direct-to-consumer sales.'
      ),
      ptParagraph(
        'If you\'re looking for custom screen printing services with fast production, contact Garment Decor today. We specialize in high-quality, efficient solutions for clothing brands and collaborations.'
      ),
    ],
    publishedAt: '2024-06-15T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Jumbo Prints for Distressed Shirts: Streetwear That Stands Out',
    slug: { _type: 'slug', current: 'custom-jumbo-prints-for-distressed-shirts-streetwear-that-stands-out' },
    tags: ['Jumbo', 'Screen Printing', 'Tops'],
    product: 'Custom Distressed Tees',
    decoration: 'jumbo-screen-printing',
    materials: 'Relaxed and Oversized Fit Garment Dyed Shirt 6.5oz/y2 100% USA Cotton Drop Shoulder',
    designName: 'Skeleton Bat by Lost Intricacy',
    shortDescription:
      'A man holding the detailed front view of a distressed streetwear shirt featuring the custom jumbo screen print of Lost Intricacy Skeleton Bat in Las Vegas design printed by Garment Decor for an eye-catching finish.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we provide expert custom screen printing services tailored to clothing brands and collaborations. Jumbo screen printing creates bold, oversized graphics that stand out on streetwear and distressed garments.'
      ),
      ptParagraph(
        'Our state-of-the-art equipment ensures precise, vibrant prints on premium blanks. Quick turnaround, retail finishing, and custom neck tags make us the choice for clothing brands and collaborations.'
      ),
    ],
    publishedAt: '2024-06-14T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Screen Printing for Independent Trading SS4500 Hoodies',
    slug: { _type: 'slug', current: 'custom-screen-printing-for-independent-trading-ss4500-hoodies' },
    tags: ['Screen Printing', 'Sweatshirts'],
    product: 'Independent Trading SS4500 Midweight Hooded Sweatshirt',
    decoration: 'simulated-process',
    materials: 'Pouch pocket 8.5 oz./yd² 80/20 ring-spun cotton/polyester blend fleece with 100% cotton face',
    designName: 'Until Failure',
    shortDescription:
      'A man holding the Independent Trading SS4500 Midweight Hoodie to display its back design, the "Until Failure" artwork, and a custom screen printed by Garment Decor for standout streetwear appeal.',
    longDescription: [
      ptParagraph(
        'Simulated process printing utilizes halftones to create photorealistic designs. For this project we delivered crisp, detailed artwork on the Independent Trading SS4500 Midweight Hoodie—a streetwear staple with a soft fleece face and durable construction.'
      ),
      ptParagraph(
        'Garment Decor\'s screen printing expertise ensures vibrant, long-lasting prints that stand up to wear and washing. We offer quick turnaround, retail finishing, and custom neck tags for brands and collaborations.'
      ),
    ],
    publishedAt: '2024-06-13T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Customized Screen Printed Independent IND20PNT Fleece Pants with Puff Ink',
    slug: { _type: 'slug', current: 'custom-wholesale-screen-printed-jogger-pants-by-garment-decor' },
    tags: ['Bottoms', 'Puff Screen Printing', 'Screen Printing', 'Spot Color'],
    product: "Independent IND20PNT Men's Midweight Fleece Pant",
    decoration: 'puff-screen-printing',
    materials:
      '8.5 oz. (280gm) cotton/polyester blend fleece. Solid Colors & Camo: 80% Cotton/20% Polyester with 100% Cotton Face Yarn. Grey Heather: 52% Cotton/48% Polyester. Elastic waistband with drawcord, 1×1 ribbing at ankle cuffs, relaxed fit.',
    designName: 'Sorry for the Weight',
    shortDescription:
      'A man holding the Independent Trading Co. IND20PNT Midweight Fleece Pants in Grey Heather showcases a bold "Sorry For The Weight" design custom puff screen printed by Garment Decor. The design, printed vertically down the left leg, features thick, raised lettering in a sleek red puff ink finish.',
    longDescription: [
      ptParagraph(
        'We completed a bulk order of 150 Independent IND20PNT Men\'s Midweight Fleece Pants in gray, using red puff ink to create a bold design with the phrase "Sorry for the Weight." These pants are ideal for clothing brands looking to release stylish winter joggers.'
      ),
      ptParagraph(
        'Sample before production allowed the client to review the design before full production. Our M&R Challenger 3 16/18 automatic screen printing presses ensured precise puff ink application. We delivered in 4 business days with rush screen printing and wholesale pricing.'
      ),
    ],
    publishedAt: '2024-06-12T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom 3D Puff Screen Printed LA Apparel 1801GD T-Shirts with Vibrant Orange Ink',
    slug: { _type: 'slug', current: 'd-puff-printing-sweater' },
    tags: ['Puff Screen Printing', 'Screen Printing', 'Spot Color'],
    product: 'Los Angeles Apparel 1801GD T-Shirt',
    decoration: 'puff-screen-printing',
    materials: '50% US Cotton / 50% Polyester',
    designName: 'Uninterrupted',
    shortDescription:
      'Garment Decor recently completed a custom order of LA Apparel 1801GD t-shirts in white, screen printed with a unique 3D puff and regular plastisol ink design in bold orange. The combination of 3D puff ink with standard plastisol created a striking two-dimensional effect.',
    longDescription: [
      ptParagraph(
        'We applied 3D puff ink in select parts of the design and standard plastisol ink in others, creating a dynamic, two-dimensional look. The 3D puff ink provides a raised, textured effect that contrasts with the flat, smooth finish of the plastisol ink.'
      ),
      ptParagraph(
        'Our state-of-the-art M&R Challenger 3 16/18 automatic screen printing presses allowed us to execute this design with accuracy and speed. We provided a sample before production so the client could approve the balance of puff and plastisol elements.'
      ),
    ],
    publishedAt: '2024-06-11T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Screen Printed and Embroidered Made Blanks Ready To Dye Varsity Crewneck for Archangel',
    slug: { _type: 'slug', current: 'baby-angel' },
    tags: ['Puff Screen Printing', 'Screen Printing', 'Spot Color', 'Sweatshirts'],
    product: 'Made Blanks Ready To Dye Varsity Crewneck Dyed Orange',
    decoration: 'puff-screen-printing',
    materials:
      '14oz | 80% organic cotton, 20% recycled polyester fleece. 5 needle double stitch, side gusset. 16oz 100% cotton 1 x 1 ribbed cuff and waistbands. True to size.',
    designName: 'Arch Angel',
    shortDescription:
      'At Garment Decor, we completed a custom order of 750 Made Blanks Ready To Dye Varsity Crewnecks in dyed orange for the clothing brand Archangel. This project required both puff screen printing on the back and tonal embroidery in orange thread on the front, produced in just three business days.',
    longDescription: [
      ptParagraph(
        'We used puff ink screen printing on the back of the crewneck, creating a raised, textured look. On the front we applied tonal embroidery with orange thread for a subtle yet cohesive appearance. The Made Blanks Ready To Dye Varsity Crewneck in dyed orange provides an excellent foundation for custom apparel.'
      ),
      ptParagraph(
        'Our Barudan embroidery machines and M&R screen printing presses ensure flawless results. We provided a sample before production and offer retail finish services including screen-printed neck tags, folding, bagging, and size stickers.'
      ),
    ],
    publishedAt: '2024-06-10T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Jumbo Screen Printing for Streetwear Clothing Brands',
    slug: { _type: 'slug', current: 'custom-jumbo-screen-printing-for-streetwear-clothing-brands' },
    tags: ['Jumbo', 'Screen Printing', 'Tops'],
    product: 'Custom-cut and sewn t-shirt',
    decoration: 'jumbo-screen-printing',
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Lost Intricacy',
    shortDescription:
      'Front view of a custom-made streetwear tee featuring premium jumbo screen printing of Lost Intricacy Design printed by Garment Decor. Perfect for brands looking to make a statement with bold, oversized designs.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we provide expert custom screen printing services tailored to clothing brands and collaborations. Jumbo screen printing allows for oversized, high-impact graphics that define streetwear and limited-run drops.'
      ),
      ptParagraph(
        'Premium garment expertise, quick turnaround, retail finishing, and custom neck tags help elevate branding for direct-to-consumer sales. We specialize in high-quality, efficient solutions for clothing brands and collaborations.'
      ),
    ],
    publishedAt: '2024-06-09T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Screen Printing for JPEG MAFIA | American Apparel 1304 Long Sleeve',
    slug: { _type: 'slug', current: 'why-agencies-choose-garment-decor-for-bold-jumbo-screen-prints-on-apparel' },
    tags: ['Jumbo', 'Shirts', 'Tops'],
    product: 'American Apparel – Heavyweight Cotton Long Sleeve Tee – 1304',
    decoration: 'jumbo-screen-printing',
    materials: 'Relaxed fit 6 oz./yd² (US) 100% Cotton',
    designName: 'I LAY DOWN MY LIFE FOR YOU Tour Longsleeve Tee (Black)',
    client: 'JPEG MAFIA',
    shortDescription:
      'We recently partnered with JPEG MAFIA to create custom merchandise for his fans. The project featured American Apparel Heavyweight Cotton Long Sleeve Tees (Style 1304) in black, with bold, high-quality screen printing to match his signature aesthetic.',
    longDescription: [
      ptParagraph(
        'Before any large-scale production we sent real photos of the sample garment for approval. This allowed us to confirm placement and size of the design, match ink colors to the approved digital proof, and ensure the merchandise looked exactly as expected.'
      ),
      ptParagraph(
        'The design featured bold, intricate artwork that required precision. We used high-opacity inks for vibrancy on black fabric, consistent placement on every shirt, and durable prints that withstand repeated washing. Our M&R Challenger 3 16/18 automatic screen printing presses delivered on time for his merchandise drop.'
      ),
    ],
    testimonialQuote:
      "Garment Decor was instrumental in making my merch vision come to life. The print quality on the American Apparel long sleeves was incredible, and their sample approval process made it easy to trust the final product. Fans love the pieces, and I'll definitely be back!",
    testimonialAuthor: 'JPEG MAFIA',
    publishedAt: '2024-06-08T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Jumbo Screen Printed Shaka Wear 7.5oz Max Heavyweight Tee Style SHMH',
    slug: { _type: 'slug', current: 'elevate-your-brand-with-jumbo-prints-on-shaka-wear-7-5oz-max-heavyweight-tees' },
    tags: ['Jumbo', 'Screen Printing', 'Tops'],
    product: 'Shaka Wear 7.5oz Max Heavyweight Tee',
    decoration: 'jumbo-screen-printing',
    materials: '100% Cotton Drop Shoulder Style (Boxy Fit) Garment dyed for a retro/vintage look Oversized fit',
    designName: 'B***H TEE (Rihanna)',
    client: "Rihanna's Merchandise Team",
    shortDescription:
      'At Garment Decor, we screen printed 3,500 Shaka Wear 7.5oz Max Heavyweight Tees (Style SHMH) featuring a jumbo front design for Rihanna\'s merchandise line. This bulk order was completed in just 5 business days, ensuring the pre-sale launch went smoothly.',
    longDescription: [
      ptParagraph(
        'We used our jumbo screen printing capabilities to produce a large, bold design covering a significant portion of the shirt\'s front. Vibrant plastisol inks ensured the artwork was sharp and long-lasting. The Shaka Wear Max Heavyweight Tee (Style SHMH) is a staple for premium custom printing: 100% USA Cotton, 7.5 oz/yd², oversized unisex fit, shrink-free.'
      ),
      ptParagraph(
        'We always provide a sample before production so clients can review and approve designs. Completing an order of this magnitude required precision and efficiency—our team\'s expertise and advanced equipment allowed us to meet the 5-business-day deadline.'
      ),
    ],
    testimonialQuote:
      "Garment Decor exceeded our expectations with their speed and quality! The jumbo design came out bold and vibrant, and they delivered all 3,500 t-shirts in just 5 days. The team was professional, and their production efficiency was unmatched. Highly recommend!",
    testimonialAuthor: "Rihanna's Merchandise Team",
    publishedAt: '2024-06-07T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Puff Embroidery for Yupoong 6089 Caps: Elevate Your Streetwear Brand',
    slug: { _type: 'slug', current: 'custom-puff-embroidery-for-yupoong-6089-caps-elevate-your-streetwear-brand' },
    tags: ['Embroidery', 'Headwear', 'Puff', 'Snapback'],
    product: 'Yupoong Classics 6089 Premium Flat Bill Snapback Cap',
    decoration: 'embroidery',
    materials: 'Structured, six-panel, high-profile Snapback closure 80/20 acrylic/wool',
    designName: 'Dark Horse Records',
    shortDescription:
      'A man proudly displays the front view of a Yupoong 6089 Premium Flat Bill Snapback Cap with Dark Horse Records logo adorned with vibrant custom puff embroidery by Garment Decor, ideal for streetwear brands.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we provide expert custom screen printing and embroidery services tailored to clothing brands and collaborations. Puff embroidery on headwear creates a raised, premium look that stands out for streetwear and music brands.'
      ),
      ptParagraph(
        'Quick turnaround, retail finishing, and custom neck tags help elevate branding for direct-to-consumer sales. We specialize in high-quality, efficient solutions for clothing brands and collaborations.'
      ),
    ],
    publishedAt: '2024-06-06T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Elevate AS Colour 5161 Relax Hoodies with Custom Puff Embroidery',
    slug: { _type: 'slug', current: 'elevate-as-colour-5161-relax-hoodies-with-custom-puff-embroidery' },
    tags: ['Embroidery', 'Puff', 'Sweatshirts'],
    product: 'AS Colour 5161 Relax Hoodie',
    decoration: 'embroidery',
    materials:
      'Relaxed Fit Midweight, 9.4 oz, 80% cotton 20% recycled polyester CVC fleece. Pre-shrunk, pullover hood, drop shoulder, kangaroo pocket, self-fabric lined hood, no drawcord, sleeve cuff ribbing.',
    designName: 'Hardwood LA',
    shortDescription:
      'AS Colours 5161 Relax Hood Bone Custom Puff Embroidery. A zoomed-in shot of the AS Colour 5161 Relax Hoodie with Hardwood LA\'s design with custom puff embroidery embroidered by Garment Decor, highlighting its detailed texture and design quality.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we provide expert custom embroidery and screen printing services tailored to clothing brands and collaborations. The AS Colour 5161 Relax Hoodie is a relaxed, midweight fleece ideal for puff embroidery and left-chest logos.'
      ),
      ptParagraph(
        'Premium garment expertise, quick turnaround, retail finishing including screen-printed neck tags, and fold & bag make us the choice for streetwear and lifestyle brands. We specialize in high-quality, efficient solutions for clothing brands and collaborations.'
      ),
    ],
    publishedAt: '2024-06-05T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: "Custom Embroidered Caps: Perfect for Your Sports Team's Winning Look",
    slug: { _type: 'slug', current: 'custom-embroidered-caps-perfect-for-your-sports-teams-winning-look' },
    tags: ['Embroidery', 'Trucker Hat'],
    product: 'Custom Made 5 Panel Perforated Hat',
    decoration: 'embroidery',
    materials: '5-panel cap Flat Bill Snapback Caps Waterproof Laser Cut Hole Perforated Hat',
    designName: 'Green Ball Hooligans Pickleball',
    shortDescription:
      'Showcasing a range of custom embroidered Green Ball Hooligans Pickleball sports caps by Garment Decor in different colors, produced in bulk to suit sports teams of all sizes. High-quality embroidery ensures every logo stands out.',
    longDescription: [
      ptParagraph(
        'At Garment Decor, we provide expert custom embroidery services for sports teams, leagues, and events. Our embroidery ensures sharp, durable logos that stand up to wear and washing. Bulk pricing and quick turnaround help teams meet deadlines.'
      ),
      ptParagraph(
        'Premium garment expertise, retail finishing, and a wide selection of blank caps make us the choice for sports and spirit wear. We specialize in high-quality, efficient solutions for teams and organizations.'
      ),
    ],
    publishedAt: '2024-06-04T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom 3D Puff Embroidered OTTO CAP 31-069 Baseball Caps | Brand Merch',
    slug: { _type: 'slug', current: 'custom-embroidery-for-otto-cap-31-069-perfect-for-streetwear-brands' },
    tags: ['Embroidery', 'Headwear', 'Snapback'],
    product: 'OTTO CAP 31-069 5 Panel Mid Profile Baseball Cap',
    decoration: 'embroidery',
    materials: '5-panel cap Plastic Adjustable Snap Cotton Blend Twill 65% Polyester / 35% Cotton – Structured Firm Front Panel',
    designName: 'The Cactus Club',
    shortDescription:
      'We delivered 450 OTTO CAP 31-069 5 Panel Mid Profile Baseball Caps in four business days with our rush embroidery service. These caps featured 3D puff embroidery on the front panel in green thread to match the brim, plus a logo on the side.',
    longDescription: [
      ptParagraph(
        'The OTTO CAP 31-069 is a top choice for brands due to its structured design and 5-panel construction. We used Madeira Polyneon threads and expert digitizing (Vitor Digitizing) for precise, durable, eye-catching results. The green/white combination provided a clean, professional look.'
      ),
      ptParagraph(
        'We ensured client satisfaction with our sample before production process including text and email photos of the first hat. Our 30 total heads across Barudan embroidery machines (five machines, six heads each) enable high capacity and rush turnaround.'
      ),
    ],
    testimonialQuote:
      "Garment Decor's 3D puff embroidery was exactly what we needed for our custom caps. The side logo placement and color matching were perfect, and they delivered everything on time—even with a rush order!",
    testimonialAuthor: 'Saguaro Street',
    publishedAt: '2024-06-03T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Digital Screen Printed Black Gildan 5400 Long Sleeves for Girls in Purgatory',
    slug: { _type: 'slug', current: 'standout-tour-merch-custom-digital-squeegee-long-sleeves-for-concerts' },
    tags: ['Digital Screen Printing', 'Screen Printing', 'Sweatshirts', 'Tops'],
    product: '5400 Gildan Heavy Cotton™ Long Sleeve T-Shirt',
    decoration: 'digital-screen-printing',
    materials: '5.3 oz./yd² (US) Classic Fit 100% Cotton',
    designName: 'Girls in Purgatory',
    client: 'Girls in Purgatory',
    shortDescription:
      'At Garment Decor, we created 350 black Gildan 5400 long sleeves for the clothing brand Girls in Purgatory, featuring a stunning full-color graphic on the front using our digital squeegee hybrid printing system.',
    longDescription: [
      ptParagraph(
        'We used our digital squeegee hybrid printing system: a white base layer with water-based inks, followed by a sharp, vibrant full-color design digitally printed on top. This technique ensures outstanding color accuracy and sharpness for detailed artwork.'
      ),
      ptParagraph(
        'We completed this project in just 3 business days. We always provide a sample before production so clients can review and approve designs. Our state-of-the-art equipment allowed us to meet the client\'s tight deadline without compromising on quality.'
      ),
    ],
    testimonialQuote:
      "Garment Decor brought our vision to life with incredible detail and vibrant colors. The digital screen printing was flawless, and the quick 3-day turnaround saved our timeline. We couldn't have asked for better service!",
    testimonialAuthor: 'Girls in Purgatory Team',
    publishedAt: '2024-06-02T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Custom Digital Screen Printing On Los Angeles Apparel 1801GD T-Shirts',
    slug: { _type: 'slug', current: 'premium-digital-squeegee-printing-for-1801gd-la-apparel-tees' },
    tags: ['Digital Screen Printing', 'Shirts', 'Tops'],
    product: 'Los Angeles Apparel 6.5oz Garment Dye Crew Neck T-Shirt Style 1801GD',
    decoration: 'digital-screen-printing',
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Racing Heritage',
    client: 'Team Ruckus Racing',
    shortDescription:
      'At Garment Decor, we completed a bulk order of 580 Los Angeles Apparel 1801GD t-shirts with front and back full-color digital screen printing. The order was produced in just 3 business days with our quick turnaround service.',
    longDescription: [
      ptParagraph(
        'We used our digital squeegee hybrid printing system: a base layer of white water-based ink, followed by vibrant full-color prints on the front and back. The Los Angeles Apparel 1801GD is 100% USA Cotton, 6.5 oz/yd², generous fit, garment dyed for a shrink-free, broken-in feel—ideal for detailed, multi-color designs.'
      ),
      ptParagraph(
        'We included retail finish service: folding, bagging, size stickers, and custom screen-printed neck tags so the garments were ready for direct-to-consumer sales. We provided a sample before production and delivered in 3 business days.'
      ),
    ],
    testimonialQuote:
      "Garment Decor exceeded all expectations! Their digital screen printing delivered vibrant, detailed designs that were exactly what we envisioned. The retail finishing, especially the screen printed neck tags, made our products look polished and ready for sale. Plus, they completed the order in just 3 days. Amazing work!",
    testimonialAuthor: 'Team Ruckus Racing',
    publishedAt: '2024-06-01T12:00:00.000Z',
  },
  {
    _type: 'project',
    title: 'Digital Squeegee Los Angeles Apparel 1810GD & Independent Trading IND420XD',
    slug: { _type: 'slug', current: 'digital-squeegee-los-angeles-apparel-1810gd-independent-trading-ind420xd' },
    tags: ['Digital Screen Printing', 'Retail Finishing', 'Sweatshirts', 'Tops'],
    product: 'IND420XD Independent Trading Mainstreet 420gm Heavyweight Pullover Hood',
    decoration: 'digital-screen-printing',
    materials:
      'Premium Heavyweight 12.5oz./420gm 3-end fleece 100% cotton face yarns 75% cotton / 25% polyester',
    designName: 'Street City Apparel',
    shortDescription:
      'We completed a project for Street City Apparel using a combination of traditional screen printing, digital screen printing (digital squeegee), and retail finish services. We customized Los Angeles Apparel 1810 pocket long sleeves and Independent Trading IND420XD hoodies in black.',
    longDescription: [
      ptParagraph(
        'The back of each IND420XD hoodie and 1810GD long sleeve featured a full-color digital screen print (digital squeegee) for the Porsche design. The front used traditional screen printing with plastisol inks for a bold two-color design. This multi-technique approach delivered vibrant colors and precise detail.'
      ),
      ptParagraph(
        'We included custom screen-printed neck tags, folding, bagging, and labeling so every garment was retail-ready. The project was completed in 5 business days with our rush screen printing service. We provided a sample before production for approval of colors, placement, and finishing.'
      ),
    ],
    publishedAt: '2024-05-31T12:00:00.000Z',
  },
];

async function main() {
  const total = projects.length;
  console.log(`Seeding ${total} portfolio projects to Sanity...\n`);
  for (let i = 0; i < total; i++) {
    const doc = projects[i] as Record<string, unknown>;
    const slug = (doc.slug as { current: string }).current;
    try {
      await client.createOrReplace({
        ...doc,
        _id: `project-${slug}`,
      });
      console.log(`  [${i + 1}/${total}] Created: ${doc.title}`);
    } catch (err) {
      console.error(`  [${i + 1}/${total}] Failed (${slug}):`, err);
    }
  }
  console.log('\nDone. View at /portfolio and in Studio at /studio.');
}

main();

/**
 * Import 44 portfolio projects from old.garmentdecor.com into Sanity.
 * This script ONLY adds new items — it will NOT modify existing portfolio content.
 * Uses createIfNotExists to safely skip any already-imported items.
 *
 * Run: npx tsx scripts/seed-portfolio-import.ts
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

function ptParagraph(text: string) {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style: 'normal',
    children: [{ _type: 'span', _key: '1', text }],
    markDefs: [],
  };
}

const newProjects = [
  // 1
  {
    _type: 'project',
    title: 'Custom Screen Printed Los Angeles Apparel HF09 Heavy Fleece Hoodies',
    slug: { _type: 'slug', current: 'custom-screen-printed-los-angeles-apparel-hf09-heavy-fleece-hoodies' },
    tags: ['Screen Printing', 'Spot Color', 'Sweatshirts', 'Tops'],
    product: 'Los Angeles Apparel HF09 – Heavy Fleece Hoodie',
    decoration: ['screen-printing'],
    materials: 'Loose fit for a full range of motion Made from our premium 14oz heavyweight fleece to keep you warm Kangaroo front pocket for storage',
    designName: '"MAGNETO" by Booted Comics',
    client: 'Booted Comics',
    quantity: '1,350 units',
    turnaround: '7 business days',
    shortDescription:
      'At Garment Decor, we specialize in screen printing for bulk orders that demand precision, speed, and quality. For this project, we screen-printed 1,350 Los Angeles Apparel HF09 Heavy Fleece Hoodies in black for a clothing brand called Booted Comics. The back featured a 4-color design, while the front featured a 2-color design, showcasing bold and vibrant artwork on both sides of the hoodie.',
    longDescription: [
      ptParagraph(
        'The Los Angeles Apparel HF09 is a premium hoodie designed for comfort and customization. Style: HF09, Material: 100% Heavy Cotton Fleece, Weight: 14 oz/yd², Fit: Oversized, unisex. This hoodie is ideal for premium customization and is often chosen by clothing brands for its heavyweight feel and shrink-free properties.'
      ),
      ptParagraph(
        'We brought the client\'s vision to life using vibrant plastisol inks. Back Design: Screen printed in 4 colors, ensuring the design was detailed and visually striking. Front Design: Screen printed in 2 colors, creating a complementary and balanced look.'
      ),
    ],
    testimonialQuote:
      "Garment Decor nailed it! The designs on the front and back were vibrant and flawless. The attention to detail, especially with the screen-printed neck tags and retail finishing, made our hoodies retail-ready. Plus, they delivered 1,350 hoodies in just 7 days! Incredible service.",
    testimonialAuthor: 'Booted Comics',
    publishedAt: '2024-12-20T12:00:00.000Z',
  },
  // 2
  {
    _type: 'project',
    title: 'Custom Jumbo Screen Printing and Tonal Embroidery on IND420XD Independent Hoodie',
    slug: { _type: 'slug', current: 'custom-screen-printing-and-embroidered-logo-on-ind420xd-independent-hoodie' },
    tags: ['Embroidery', 'Screen Printing', 'Simulated Screen Printing', 'Tonal', 'Tops'],
    product: 'IND420XD Independent Trading Co. – Mainstreet Hooded Sweatshirt',
    decoration: ['jumbo-screen-printing', 'embroidery', 'simulated-process'],
    materials: 'Premium Heavyweight 12.5oz./420gm 3-end fleece, Specialty yarns for a durable dry hand feel, 75% cotton / 25% polyester.',
    designName: 'Chris Jacoub: Gravity Hoodie',
    client: 'Chris Jacoub',
    shortDescription:
      'At Garment Decor, we specialize in screen printing and custom embroidery for clothing brands seeking unique and professional decoration options. Recently, we completed a customization project for the Independent Trading IND420XD Premium Hoodie, combining tonal embroidery on the front with jumbo simulated process screen printing on the back.',
    longDescription: [
      ptParagraph(
        'The front design features a black-on-black tonal embroidery, achieving a sleek, minimalistic look on the black hoodie. This technique is ideal for clients seeking subtle yet premium branding. For this project, we used Madeira Polyneon black thread, which offers a smooth, durable finish while maintaining a refined tone-on-tone appearance.'
      ),
      ptParagraph(
        'The back design brought the hoodie to life with a jumbo simulated process screen printing technique. This vibrant artwork features a stunning space design with planets, an astronaut, and multiple colors. Our simulated process printing method allowed us to reproduce the intricate details and bright colors of the space-themed artwork, creating a visually striking result.'
      ),
    ],
    testimonialQuote:
      "Garment Decor delivered beyond our expectations! The tonal embroidery on the front was subtle yet striking, and the jumbo screen-printed space design on the back truly brought our vision to life. The colors were vibrant, and the quality was outstanding. Their attention to detail and quick turnaround made all the difference. We'll definitely be back for future projects!",
    testimonialAuthor: 'Chris Jacoub',
    publishedAt: '2024-12-19T12:00:00.000Z',
  },
  // 3
  {
    _type: 'project',
    title: 'High-Quality Silicone Transfer Printing for Custom Backpacks and Gym Bags',
    slug: { _type: 'slug', current: 'high-quality-silicone-transfer-printing-for-custom-backpacks-and-gym-bags' },
    tags: ['Bags', 'Transfers'],
    product: 'Archer Bag',
    decoration: ['screen-printing'],
    materials: 'Made in USA',
    designName: 'Archer Back Pack and Archer Duffel Bag',
    client: 'Archer',
    shortDescription:
      'When it comes to decorating accessories like backpacks and gym bags, Garment Decor specializes in silicone transfer printing—a premium technique that provides a high-quality, durable finish. Recently, we worked with Archer, a clothing brand that wanted custom branding on their bags. By using large white silicone transfers, we achieved a professional, high-end look that was both eye-catching and built to last.',
    longDescription: [
      ptParagraph(
        'Silicone transfers offer a range of benefits, especially for frequently used items like backpacks and gym bags. They have a soft, high-end texture that feels premium, are fade and crack resistant, and have a raised 3D effect that adds depth to the design.'
      ),
      ptParagraph(
        'For Archer\'s custom order, we used large silicone transfers on both backpacks and gym bags, ensuring the logo was consistently applied across all items. The soft texture and high-quality finish of the silicone transfer give each bag a refined, professional look, perfect for retail or promotional use.'
      ),
    ],
    publishedAt: '2024-12-18T12:00:00.000Z',
  },
  // 4
  {
    _type: 'project',
    title: "Tonal Screen Printing for a Subtle, Minimal Look – Garment Decor's Specialty Service",
    slug: { _type: 'slug', current: 'tonal-screen-printing-for-a-subtle-minimal-look-garment-decors-specialty-service' },
    tags: ['Screen Printing', 'Shirts', 'Spot Color', 'Tonal'],
    product: 'Various',
    decoration: ['screen-printing'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Tonal Screen Printing',
    shortDescription:
      'For brands looking for a subtle, understated aesthetic, tonal screen printing is the perfect solution. At Garment Decor, we specialize in this technique, which involves screen printing a similar ink shade to the fabric, creating a "there-but-not-there" effect. This method is ideal for clients who want their branding to be present yet low-key, achieving a minimal look that speaks to sophistication and subtlety.',
    longDescription: [
      ptParagraph(
        'Tonal screen printing uses ink that closely matches the fabric color, resulting in a design that appears subtle and blends seamlessly with the garment. This technique is especially popular with clients who prefer a soft, non-dominant logo over vibrant or high-contrast prints.'
      ),
      ptParagraph(
        'At Garment Decor, we offer an extensive range of custom Pantone colors to ensure your tonal print matches the fabric perfectly. Our team can mix and match colors to find the ideal shade for your project, ensuring that the print aligns seamlessly with the garment color for a true tonal effect.'
      ),
    ],
    publishedAt: '2024-12-17T12:00:00.000Z',
  },
  // 5
  {
    _type: 'project',
    title: 'Custom Screen Printed Los Angeles Apparel 1801GD Streetwear T-Shirts',
    slug: { _type: 'slug', current: 'custom-screen-printed-los-angeles-apparel-1801gd-streetwear-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Shirts', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Lost Intricacy',
    quantity: '500 units',
    turnaround: '3 business days',
    shortDescription:
      "At Garment Decor, we're known for our ability to deliver high-quality, custom screen printing with fast turnarounds. Recently, we completed an order for 500 Los Angeles Apparel 1801GD t-shirts, featuring a vintage-style, 8-color simulated process design on the front, a text-based spot color design on the back, and custom woven labels sewn in by our seamstress.",
    longDescription: [
      ptParagraph(
        'The front of each t-shirt features a jumbo 8-color simulated process design. Using grunge layers in Photoshop, we added distress effects that give the artwork a worn, vintage appearance. This simulated process technique allows for smooth color transitions, making it perfect for full-color designs with a vintage aesthetic.'
      ),
      ptParagraph(
        'To enhance the t-shirts\' retail appeal, we added custom woven labels sewn in by our professional seamstress. This retail finish included poly bags and size stickers for a professional, distribution-ready presentation.'
      ),
    ],
    publishedAt: '2024-12-16T12:00:00.000Z',
  },
  // 6
  {
    _type: 'project',
    title: 'Rush Screen Printing on A4 N4190 Mesh Football Jerseys',
    slug: { _type: 'slug', current: 'rush-screen-printing-on-a4-n4190-mesh-football-jerseys' },
    tags: ['Screen Printing', 'Spot Color', 'Tops'],
    product: 'A4 N4190 Football Jerseys',
    decoration: ['screen-printing', 'rush'],
    materials: '100% Polyester Mesh 5.3 ounces per square yard Moisture wicking Odor resistant Stain release',
    designName: 'Cool Kicks Athletics XXL',
    quantity: '250 units',
    turnaround: '3 business days',
    shortDescription:
      'At Garment Decor, we take pride in delivering high-quality screen printing with fast turnaround times. Recently, we completed a project for a client that involved screen printing the front of A4 N4190 Practice Football Jerseys. These mesh jerseys are perfect for athletic teams and events, and we screen-printed the design in 3 vibrant colors using plastisol inks.',
    longDescription: [
      ptParagraph(
        'The A4 N4190 Practice Jersey in white is a lightweight, breathable mesh fabric, making it ideal for sportswear. We screen-printed a 3-color design on the front of the jersey using vibrant plastisol inks. Screen printing on mesh fabric requires precision to ensure that the ink sits evenly on the textured surface.'
      ),
      ptParagraph(
        'As part of our full-service screen printing, we also provided retail finishing for this project. This included folding, bagging, and labeling each jersey, ensuring they were ready for immediate distribution.'
      ),
    ],
    publishedAt: '2024-12-15T12:00:00.000Z',
  },
  // 7
  {
    _type: 'project',
    title: 'Custom AS Colour 5146 Heavy Hoodies, 5026 Classic Tees, and 5071 Classic Long Sleeves',
    slug: { _type: 'slug', current: 'custom-as-colour-5146-heavy-hoodies-5026-classic-tees-and-5071-classic-long-sleeves' },
    tags: ['Screen Printing', 'Simulated Screen Printing', 'Spot Color', 'Sweatshirts', 'Tops'],
    product: 'Hoodies – AS Colour 5146 Heavy Hood | White Tee – AS Colour 5026 Classic Tee | Long Sleeves – AS Colour 5071 Classic L/S',
    decoration: ['simulated-process'],
    materials: '100% combed cotton Relaxed Fit Heavyweight',
    designName: 'GOAT Fuel Merch',
    client: 'Goat Fuel',
    shortDescription:
      "At Garment Decor, we specialize in delivering premium screen printing services on high-quality garments, and our recent project for Goat Fuel is a perfect example. For this collection, we screen printed AS Colour 5146 Heavy Hoodies, AS Colour 5026 Classic Tees, and AS Colour 5071 Classic Long Sleeves.",
    longDescription: [
      ptParagraph(
        'The AS Colour 5146 Heavy Hood and AS Colour 5071 Classic Long Sleeves featured a 5-color gradient shift, creating a vibrant, eye-catching design that stood out against the black fabric. We first applied a base white screen print to ensure the colors popped and remained true to the original design.'
      ),
      ptParagraph(
        'For the AS Colour 5026 Classic Tees in white, we screen printed a black ink design with a grayscale gradient shift. This minimalist yet impactful design used varying shades of black and gray to create a gradient effect, giving the artwork depth and a modern, sleek appearance.'
      ),
    ],
    publishedAt: '2024-12-14T12:00:00.000Z',
  },
  // 8
  {
    _type: 'project',
    title: 'Custom Simulated Process Screen Printing on Gildan 67000 Softstyle CVC T-Shirts',
    slug: { _type: 'slug', current: 'custom-simulated-process-screen-printing-on-gildan-67000-softstyle-cvc-t-shirts' },
    tags: ['Screen Printing', 'Simulated Screen Printing', 'Tops'],
    product: '67000 Gildan – Softstyle® CVC T-Shirt – Sustainable Style',
    decoration: ['simulated-process', 'rush'],
    materials: '4.6 oz./yd², 60/40 cotton/polyester, 30 singles Softstyle high stitch density, soft ring-spun cotton',
    designName: 'Be Out Day | Fix My Sole',
    quantity: '250 units',
    turnaround: '2 business days',
    shortDescription:
      'At Garment Decor, we specialize in rush screen printing projects without sacrificing quality. Recently, we completed an order of 250 Gildan 67000 Softstyle CVC T-shirts for a client\'s event in Atlanta. Using our simulated process screen printing technique, we printed an intricate 8-color design on the front and a sleek black ink design on the back.',
    longDescription: [
      ptParagraph(
        'For the front design, we used our simulated process screen printing technique, which is ideal for creating vibrant, detailed images with smooth color transitions. The 8-color design on the front of these Gildan 67000 t-shirts came out sharp and detailed, thanks to our use of vibrant plastisol inks.'
      ),
      ptParagraph(
        'On the back of the t-shirt, we printed a single-color design in black ink. While simple in execution, the sharpness and contrast of black ink on white fabric make the design stand out. This combination of full-color printing on the front and single-color printing on the back provides a balanced look.'
      ),
    ],
    publishedAt: '2024-12-13T12:00:00.000Z',
  },
  // 9
  {
    _type: 'project',
    title: 'Rush Order Screen Printing on Shaka Wear Max Heavyweight Style SHMHSS T-Shirts',
    slug: { _type: 'slug', current: 'rush-order-screen-printing-on-shaka-wear-max-heavyweight-style-shmhss-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Simulated Screen Printing', 'Tops'],
    product: 'Shaka Wear Max Heavyweight Garment Dye Short Sleeve in Shadow',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'rush'],
    materials: "100% USA Cotton • 7.5 oz / 255 – 260 GSM, Fits slightly oversized on the chest and length",
    designName: 'THE SPOT FREAK SHOW',
    quantity: '750 units',
    turnaround: '3 business days',
    shortDescription:
      'At Garment Decor, we take pride in delivering high-quality screen printing services even on the tightest deadlines. Recently, we completed a rush screen printing order for 750 Shaka Wear Max Heavyweight Garment Dye Short Sleeve t-shirts in the color Shadow. The project required our jumbo screen printing service and was finished in just 3 business days.',
    longDescription: [
      ptParagraph(
        'For this project, we used our simulated process screen printing technique to print a 7-color design on the front of the Shaka Wear Max Heavyweight t-shirts. This method is perfect for producing high-detail designs, as it uses halftones to create smooth color gradients, mimicking the look of full-color artwork.'
      ),
      ptParagraph(
        'The Shaka Wear Max Heavyweight t-shirt is known for its durability and premium feel, making it an excellent choice for screen printing. The garment dye process gives the fabric a rich, deep color, and the heavyweight cotton holds ink beautifully.'
      ),
    ],
    publishedAt: '2024-12-12T12:00:00.000Z',
  },
  // 10
  {
    _type: 'project',
    title: 'Jumbo Screen Printing and Embroidery on LA Apparel 1801GD T-Shirts',
    slug: { _type: 'slug', current: 'jumbo-screen-printing-and-embroidery-on-la-apparel-1801gd-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Shirts', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'embroidery', 'simulated-process'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Growing Pains T Shirt',
    quantity: '250 units',
    turnaround: '5 business days',
    shortDescription:
      "At Garment Decor, we're always pushing the boundaries of custom apparel, offering unique services like combining screen printing and embroidery on a single garment. Recently, we completed a project that featured jumbo screen printing on the back and tonal embroidery on the front of black LA Apparel 1801GD t-shirts.",
    longDescription: [
      ptParagraph(
        'For this project, we utilized two different techniques to create a standout piece. On the back of the t-shirt, we applied a jumbo screen print using the simulated process technique, which allows for vibrant, detailed artwork even on dark fabrics. On the front, we opted for a small tonal embroidery design in black thread, creating a subtle, sophisticated look.'
      ),
      ptParagraph(
        'To ensure the t-shirts were retail-ready, we added custom screen printed neck tags and poly bagged each garment. The neck tags were printed with care instructions, sizing details, and the client\'s branding.'
      ),
    ],
    publishedAt: '2024-12-11T12:00:00.000Z',
  },
  // 11
  {
    _type: 'project',
    title: 'Rush Jumbo Screen Printing Simulated Process on LA Apparel 1801GD shirts',
    slug: { _type: 'slug', current: 'rush-jumbo-screen-printing-simulated-process-on-la-apparel-1801gd-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'rush'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Fight Club T-shirt (Black)',
    quantity: '150 units',
    turnaround: '2 business days',
    shortDescription:
      'At Garment Decor, we specialize in creating bold, high-quality custom apparel with fast turnaround times. Recently, we had the exciting opportunity to produce 150 Fight Club movie t-shirts featuring a jumbo screen print design on both the front and back of the shirts. Using our expertise in simulated process screen printing, we captured every detail of the artwork.',
    longDescription: [
      ptParagraph(
        'For this project, we used simulated process screen printing to bring the Fight Club design to life. This technique allows us to create detailed, full-color images on dark garments by blending plastisol inks. The design featured 6 colors, including various shades of pink, tan, green, white, and red.'
      ),
      ptParagraph(
        'We chose the LA Apparel 1801GD t-shirt in black for its heavyweight construction and high-quality feel. As part of our retail finish service, we added custom screen-printed neck tags to each t-shirt, elevating the overall presentation.'
      ),
    ],
    publishedAt: '2024-12-10T12:00:00.000Z',
  },
  // 12
  {
    _type: 'project',
    title: 'Rush Screen Printing for the 2024 Boston Celtics NBA Championship T-Shirts',
    slug: { _type: 'slug', current: 'rush-screen-printing-for-the-2024-boston-celtics-nba-championship-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'rush'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: '2024 NBA Champs',
    quantity: '350 units',
    turnaround: '2 business days',
    shortDescription:
      "When the Boston Celtics clinched the NBA Championship in 2024, our team was trusted to produce 350 custom street wear t-shirts celebrating this monumental victory. With a tight deadline, we needed to deliver top-quality t-shirts in just two business days.",
    longDescription: [
      ptParagraph(
        'For this project, the design featured the iconic Boston Celtics colors with intricate detailing. We used simulated process screen printing with 8 colors, including multiple shades of yellow, green, tan, white, gray, and gold. We separated the design into various color channels, using half-tones to simulate a full-color print.'
      ),
      ptParagraph(
        'We chose the LA Apparel 1801GD t-shirt in black for its heavyweight durability and soft feel. Our client also requested custom screen-printed neck tags to give the t-shirts a premium, retail-ready finish.'
      ),
    ],
    publishedAt: '2024-12-09T12:00:00.000Z',
  },
  // 13
  {
    _type: 'project',
    title: 'Jumbo 8-Color Screen Printing for Kill Bill-Inspired T-Shirts Delivered in Just 2 Days',
    slug: { _type: 'slug', current: 'jumbo-8-color-screen-printing-for-kill-bill-inspired-t-shirts-delivered-in-just-2-days' },
    tags: ['Blog', 'Jumbo', 'Screen Printing', 'Shirts', 'Simulated Screen Printing'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'rush'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Kill Bill',
    quantity: '350 units',
    turnaround: '2 business days',
    shortDescription:
      "When our client approached us with a Kill Bill-inspired design for their clothing brand, they needed a bold, cinematic print on premium t-shirts—and they needed it fast. We created an 8-color simulated process print for the LA Apparel 1801GD t-shirts in black, capturing the vibrant shades of yellow, red, white, and gray from the iconic movie.",
    longDescription: [
      ptParagraph(
        'The Kill Bill design featured a striking combination of multiple shades of yellow, red, white, and gray, which we brought to life using our simulated process printing technique. This 8-color technique allowed us to blend colors seamlessly and capture every shade and detail of the design with precision.'
      ),
      ptParagraph(
        'As part of our commitment to providing a premium product, we added custom screen-printed neck tags to the t-shirts and provided retail finish service including folding, bagging, and labeling.'
      ),
    ],
    publishedAt: '2024-12-08T12:00:00.000Z',
  },
  // 14
  {
    _type: 'project',
    title: 'Jumbo 8-Color Screen Printing for Scarface on LA Apparel 1801GD T-Shirts',
    slug: { _type: 'slug', current: 'jumbo-8-color-screen-printing-for-scarface-on-la-apparel-1801gd-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'Scarface Tony Montana',
    shortDescription:
      "For one of our clothing brand clients, we took on the challenge of producing a Scarface-inspired design with bold, cinematic flair. The design demanded vibrant colors and sharp detail to capture the essence of the iconic film, and we knew that jumbo 8-color screen printing was the way to go.",
    longDescription: [
      ptParagraph(
        'The Scarface-inspired design featured a bold, cinematic look with a mix of vibrant colors and intricate shading. Using our 8-color simulated process screen printing technique, we achieved photorealistic results, with sharp detail and smooth color transitions.'
      ),
      ptParagraph(
        'To further elevate the Scarface-inspired tees, we added custom screen-printed neck tags and provided retail finish service including folding, bagging, and labeling.'
      ),
    ],
    publishedAt: '2024-12-07T12:00:00.000Z',
  },
  // 15
  {
    _type: 'project',
    title: "Jumbo 8-Color Screen Printing for Frank Ocean's Tour Merch in Just 3 Days",
    slug: { _type: 'slug', current: 'jumbo-8-color-screen-printing-for-frank-oceans-tour-merch-in-just-3-days' },
    tags: ['Jumbo', 'Screen Printing', 'Shirts', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'rush'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'SHUTUPPLS FRANK OCEAN 1.14',
    client: "Frank Ocean",
    quantity: '800 units',
    turnaround: '3 business days',
    shortDescription:
      "When Frank Ocean needed high-quality tour merchandise on a tight deadline, we were ready to deliver. Tasked with screen printing 800 t-shirts with an 8-color simulated process design, we turned to the Los Angeles Apparel 1801GD in black, ensuring a premium product that matched the artist's vision.",
    longDescription: [
      ptParagraph(
        "We used simulated process screen printing to bring Frank Ocean's intricate artwork to life on the front and back of the t-shirts. This 8-color technique allows for smooth gradients, detailed shading, and a full range of vibrant colors."
      ),
      ptParagraph(
        "To enhance the branding and give these tees a retail-ready look, we added custom screen-printed neck tags and offered retail finishing services, which included folding, bagging, and labeling the t-shirts for direct-to-retail display."
      ),
    ],
    publishedAt: '2024-12-06T12:00:00.000Z',
  },
  // 16
  {
    _type: 'project',
    title: "Screen Printing 250 Custom LA Apparel HF09GD Hoodies for H.E.R.'s Concert",
    slug: { _type: 'slug', current: 'screen-printing-250-custom-la-apparel-hf09gd-hoodies-for-h-e-r-s-concert' },
    tags: ['Jumbo', 'Screen Printing', 'Simulated Screen Printing', 'Sweatshirts', 'Tops'],
    product: 'HF09 – Heavy Fleece Hoodie (Garment Dye)',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'rush'],
    materials: 'Unisex • Made in U.S.A. • Pre-Washed for a no-shrink true fit. • 14 oz/yd2 Super Heavy Weight • Oversized Fit 100% U.S. Cotton',
    designName: 'H.E.R.',
    client: 'H.E.R.',
    quantity: '250 units',
    turnaround: '3 business days',
    shortDescription:
      "When the iconic artist H.E.R. needed custom hoodies for her upcoming concert, we knew time was of the essence. We were asked for jumbo screen printing on the back of 250 Los Angeles Apparel HF09GD hoodies using our simulated process screen printing technique, all within just 3 business days.",
    longDescription: [
      ptParagraph(
        'We utilized our 4-color (base white, highlight white, light gray, and black inks) simulated process screen printing method. This advanced technique was essential in achieving the intricate gradient details required for the design while ensuring that the print looked flawless on the black fleece.'
      ),
      ptParagraph(
        'In addition to the jumbo design, we added custom screen-printed neck tags, which elevated the hoodie\'s premium feel. Our retail finish services included folding, bagging, and adding size labels.'
      ),
    ],
    publishedAt: '2024-12-05T12:00:00.000Z',
  },
  // 17
  {
    _type: 'project',
    title: 'Jumbo 8-Color Screen Printing on 1,500 Los Angeles Apparel 1801GD T-Shirts',
    slug: { _type: 'slug', current: 'jumbo-8-color-screen-printing-on-1500-los-angeles-apparel-1801gd-t-shirts' },
    tags: ['Jumbo', 'Screen Printing', 'Shirts', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process', 'large-orders'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'KENDRICK LAMAR TEE BY RG',
    quantity: '1,500 units',
    turnaround: '7 business days',
    shortDescription:
      'When we were approached to screen print 1,500 Los Angeles Apparel 1801GD black t-shirts with a jumbo 8-color simulated process design, we knew we had to deliver high-quality results—and fast. With just 7 business days to complete the job, we combined our expertise in simulated process screen printing with efficient workflow management.',
    longDescription: [
      ptParagraph(
        'We used simulated process printing to produce the 8-color design on these shirts, allowing us to replicate photorealistic and high-detail artwork with fewer ink colors. We printed the jumbo design across the back of the shirts, using our M&R automatic Challenger 3 16/18 screen printing presses.'
      ),
      ptParagraph(
        'As part of our retail finish service, we added custom screen-printed neck tags to each t-shirt and packaged each t-shirt in poly bags, complete with size stickers, making them retail-ready for immediate sale.'
      ),
    ],
    publishedAt: '2024-12-04T12:00:00.000Z',
  },
  // 18
  {
    _type: 'project',
    title: 'We Screen Printed a Jumbo 8-Color Screen Print for Dreams Clothing Co',
    slug: { _type: 'slug', current: 'we-screen-printed-a-jumbo-8-color-screen-print-for-dreams-clothing-co' },
    tags: ['Jumbo', 'Screen Printing', 'Shirts', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'simulated-process'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    designName: 'DREAM$ ® Astro-Boyz Tee',
    client: 'Dreams Clothing Co',
    quantity: '750 units',
    turnaround: '5 business days',
    shortDescription:
      "When Dreams Clothing Co came to us with a bold vision for their latest t-shirt collection, we knew we had to go big—literally. They wanted vibrant, detailed artwork on both the front and back of the LA Apparel 1801GD black t-shirts, using our 8-color simulated process technique.",
    longDescription: [
      ptParagraph(
        'Simulated process printing is a highly specialized technique that\'s perfect for full-color designs on darker fabrics. We utilized high mesh counts and precision-tensioned screens to ensure the sharpest details and smooth color transitions.'
      ),
      ptParagraph(
        'Dreams Clothing Co wanted their brand to shine through every detail, so we also added retail finish with screen-printed neck tags, plus folding, bagging, and size tagging.'
      ),
    ],
    publishedAt: '2024-12-03T12:00:00.000Z',
  },
  // 19
  {
    _type: 'project',
    title: "Boost Your Brand's Buzz: Why Jumbo Screen Printing is a Game-Changer for Your Merch",
    slug: { _type: 'slug', current: 'boost-your-brands-buzz-why-jumbo-screen-printing-is-a-game-changer-for-your-merch' },
    tags: ['Jumbo', 'Screen Printing', 'Shirts', 'Simulated Screen Printing'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['jumbo-screen-printing', 'rush'],
    materials: 'Made in USA 18 Singles 6.5oz/y2 100% Cotton',
    quantity: '1,500 units',
    turnaround: '2 business days',
    shortDescription:
      'We created these 1,500 custom jumbo screen printed t-shirts in just 48 hours! We used tan, brown, white, and black screen print inks to print the artwork. The client chose the LA Apparel 1801GD, a 6.5 oz heavyweight t-shirt in black, which is a top choice for streetwear brands due to its thick collar, oversized fit, and premium fabric.',
    longDescription: [
      ptParagraph(
        'Jumbo screen printing is a game-changer for merch because it allows for oversized, high-impact graphics that dominate the garment. This technique creates bold statements that are impossible to ignore, making it ideal for streetwear brands and event merchandise.'
      ),
    ],
    publishedAt: '2024-12-02T12:00:00.000Z',
  },
  // 20
  {
    _type: 'project',
    title: 'Custom 3D Puff Embroidered Flexfit 110® Cool & Dry Mini Pique Caps',
    slug: { _type: 'slug', current: 'mtiz-mindset-puff-embroidered-flexfit-hat' },
    tags: ['Embroidery', 'Headwear', 'Puff', 'Snapback'],
    product: '110P Flexfit – 110® Mini-Piqué Cap',
    decoration: ['embroidery'],
    materials: '100% polyester Structured, six-panel, mid-profile Permacurv® visor Elasticized D-Ring hook-and-loop closure',
    designName: 'MTIZ Mindset',
    quantity: '250 units',
    shortDescription:
      'At Garment Decor, we specialize in delivering high-quality custom embroidery services. Recently, we completed a project for a clothing brand client, customizing 250 Flexfit 110® Cool & Dry Mini Pique Caps. This performance cap is known for its water-repellent fabric, quick-drying properties, and moisture-wicking capabilities.',
    longDescription: [
      ptParagraph(
        'To elevate the design, we used 3D Puff embroidery in white, giving the cap a premium and textured appearance that makes the design stand out. This technique adds depth and creates a professional look, perfect for high-end branding.'
      ),
    ],
    publishedAt: '2024-12-01T12:00:00.000Z',
  },
  // 21
  {
    _type: 'project',
    title: 'ASW : Custom Screen Printed Tie-Dye Hoodies',
    slug: { _type: 'slug', current: 'custom-screen-printed-tie-dye-hoodies' },
    tags: ['Screen Printing', 'Simulated Screen Printing', 'Sweatshirts', 'Tops'],
    product: '680VR Dyenomite – Blended Hooded Tie-Dyed Sweatshirt',
    decoration: ['simulated-process'],
    materials: '8 oz./yd², 50/50 cotton/polyester Double lined hood 1×1 athletic ribbed knit cuffs and waistband with spandex',
    designName: 'Love Is : Solidarity by Uninterrupted',
    client: 'Uninterrupted',
    shortDescription:
      'Are you looking for a fresh way to showcase your company\'s logo or a unique statement on a hoodie for your team? Garment Decor is the answer! We just did a fantastic job on these custom screen printed tie dye hoodies for Uninterrupted, and the results speak for themselves.',
    longDescription: [
      ptParagraph(
        'We had such a blast working on this project and collaborating with Uninterrupted. Their creative team took the initial design of "Love is Solidarity" and made it something truly unique to their brand. We worked closely with them to ensure that the colors and designs perfectly matched their vision.'
      ),
    ],
    publishedAt: '2024-11-30T12:00:00.000Z',
  },
  // 22
  {
    _type: 'project',
    title: 'Custom Embroidered The North Face Connector Backpacks for Amazon',
    slug: { _type: 'slug', current: 'dlx5-custom-the-north-face-backpack' },
    tags: ['Accessories', 'Embroidery'],
    product: 'The North Face® Connector Backpack',
    decoration: ['embroidery'],
    materials: '600D polyester, 1200D polyester, 450D x 300D heather polyester, FlexVent™ suspension system',
    designName: 'Amazon warehouse DLX5',
    client: 'Amazon',
    quantity: '350 units',
    shortDescription:
      "Garment Decor recently partnered with Amazon's DLX5 Los Angeles warehouse to produce premium branded merchandise for their team. We customized 350 The North Face Connector Backpacks with Amazon's logo, creating a thoughtful, high-quality gift that aligns with Amazon's brand standards.",
    longDescription: [
      ptParagraph(
        "Using our Barudan Embroidery machines, we embroidered Amazon's logo onto each backpack with precise stitching that maintains the brand's iconic look. Our advanced embroidery technology ensures durability, making each backpack a long-lasting promotional item."
      ),
    ],
    publishedAt: '2024-11-29T12:00:00.000Z',
  },
  // 23
  {
    _type: 'project',
    title: 'Simulated Process Screen Printed ComfortWash GDH280 Long Sleeves for a Clothing Brand',
    slug: { _type: 'slug', current: 'custom-simulated-screen-printing' },
    tags: ['Screen Printing', 'Simulated Screen Printing', 'Sweatshirts', 'Tops'],
    product: 'GDH280 ComfortWash by Hanes – Garment-Dyed Jersey Hooded Long Sleeve T-Shirt',
    decoration: ['simulated-process', 'rush'],
    materials: '5.5 oz./yd², US grown, 100% ringspun cotton Relaxed fit Double-needle stitched throughout',
    designName: 'Long Live KayB',
    quantity: '350 units',
    turnaround: '4 business days',
    shortDescription:
      'Garment Decor recently completed a bulk screen printing project, producing 350 ComfortWash GDH280 hooded long sleeve t-shirts in charcoal with a 6-color design. Using simulated process printing, they ensured vibrant, detailed artwork and a rapid turnaround of 4 business days.',
    longDescription: [
      ptParagraph(
        'Simulated process screen printing is perfect for reproducing detailed, colorful artwork with fewer screens, making it an ideal choice for complex designs. The result is a bright, highly detailed print that captures the essence of the artwork.'
      ),
    ],
    testimonialQuote:
      "Garment Decor delivered above and beyond! The simulated process printing made our 6-color design stand out vividly on the charcoal long sleeves. They rushed the order in just 4 days, and the quality was top-notch.",
    publishedAt: '2024-11-28T12:00:00.000Z',
  },
  // 24
  {
    _type: 'project',
    title: 'Custom Branded The North Face® Groundwork Backpacks for Alignment Health',
    slug: { _type: 'slug', current: 'alignment-health-custom-embroidered-backpack' },
    tags: ['Bags', 'Embroidery'],
    product: 'NF0A3KX6 The North Face® Groundwork Backpack',
    decoration: ['embroidery', 'rush'],
    materials: '600D polyester, 450D x 300D heather polyester, 1200D polyester FlexVent™ suspension system',
    designName: 'Alignment Health',
    client: 'Alignment Health',
    quantity: '250 units',
    turnaround: '4 business days',
    shortDescription:
      "For this recent project, Garment Decor created 250 The North Face® Groundwork Backpacks in classic black, custom embroidered with Alignment Health's logo. Known for its durability and functional design, this backpack was an excellent choice for Alignment Health's corporate gifting needs.",
    longDescription: [
      ptParagraph(
        "With an order completion time of just four days, our rush embroidery services ensured Alignment Health received their custom-branded backpacks on schedule. Each backpack features their logo embroidered with precision, providing a professional look that aligns with the brand's high standards."
      ),
    ],
    testimonialQuote:
      "Garment Decor provided the perfect blend of quality and speed for our custom backpacks. The embroidery work was top-notch, and they delivered on time for our corporate gifting needs!",
    testimonialAuthor: 'Alignment Health',
    publishedAt: '2024-11-27T12:00:00.000Z',
  },
  // 25
  {
    _type: 'project',
    title: 'Promotional Embroidered OTTO Cap 31-069 Hats for Goat Fuel and Lakers',
    slug: { _type: 'slug', current: 'promotional-hats-made-in-usa' },
    tags: ['Embroidery', 'Headwear', 'Snapback'],
    product: '31-069 OTTO CAP 5 Panel Mid Profile Baseball Cap',
    decoration: ['embroidery'],
    materials: 'Cotton Blend Twill 65% Polyester / 35% Cotton – Structured Firm Front Panel',
    designName: 'GOAT Fuel',
    client: 'Goat Fuel',
    quantity: '500 units',
    shortDescription:
      'At Garment Decor, we specialize in custom embroidery services for clothing brands looking to create high-quality promotional merchandise. Recently, we completed a bulk embroidery project of 500 OTTO Cap 31-069 5 Panel Mid Profile Baseball Caps for Goat Fuel, featuring both their logo in white and the Laker\'s logo in team colors.',
    longDescription: [
      ptParagraph(
        "We embroidered the Goat Fuel logo in white, which stands out beautifully on the black background, and the Laker's logo in its signature purple and gold, maintaining the team's classic look."
      ),
    ],
    publishedAt: '2024-11-26T12:00:00.000Z',
  },
  // 26
  {
    _type: 'project',
    title: 'Custom Embroidered OTTO CAP 32-467 Trucker Hats for Local Pop-Up Event',
    slug: { _type: 'slug', current: 'custom-embroidered-trucker-hat-mid-profile' },
    tags: ['Embroidery', 'Headwear', 'Trucker Hat'],
    product: '32-467 OTTO CAP 5 Panel Mid Profile Mesh Back Trucker Hat',
    decoration: ['embroidery'],
    materials: 'Polyester Foam Front 100% Polyester – Front Panel w/ Lining',
    designName: "Claremont Farmer's Market",
    quantity: '185 units',
    shortDescription:
      "Garment Decor recently collaborated with a local clothing brand to produce 185 custom embroidered OTTO CAP 32-467 5 Panel Mid Profile Mesh Back Trucker Hats for their pop-up at Claremont's Farmer's Market. The hats featured clean, white embroidery on both the front and side.",
    longDescription: [
      ptParagraph(
        'The OTTO CAP 32-467 Mesh Back Trucker Hat is perfect for clothing brands. Its breathable mesh back and structured fit make it a standout choice, especially for pop-ups and events where brand visibility is key.'
      ),
    ],
    testimonialQuote:
      "Garment Decor's quick service and top-notch quality were essential for our pop-up at Claremont's Farmer's Market. Our hats looked incredible, and they turned heads!",
    publishedAt: '2024-11-25T12:00:00.000Z',
  },
  // 27
  {
    _type: 'project',
    title: 'Custom Embroidered OTTO Cap 32-467 Mesh Back Trucker Hats',
    slug: { _type: 'slug', current: 'wholesale-embroidered-trucker-hat' },
    tags: ['Embroidery', 'Headwear', 'Trucker Hat'],
    product: '32-467 OTTO CAP 5 Panel Mid Profile Mesh Back Trucker Hat',
    decoration: ['embroidery'],
    materials: 'Polyester Foam Front 100% Polyester – Front Panel w/ Lining',
    designName: "LA's",
    quantity: '750 units',
    shortDescription:
      'At Garment Decor, we specialize in providing high-quality custom embroidery services for clothing brands, and our recent project for 750 OTTO Cap 32-467 Mesh Back Trucker Hats is a great example. These red hats featured a bold LA text-based design in white embroidery on the front and additional white text embroidered on the side.',
    longDescription: [
      ptParagraph(
        "The OTTO Cap 32-467 5 Panel Mid Profile Mesh Back Trucker Cap is a favorite for clothing brands looking for custom headwear. Its mesh back ensures breathability, and the 5-panel structure offers ample space for detailed embroidery designs."
      ),
    ],
    publishedAt: '2024-11-24T12:00:00.000Z',
  },
  // 28
  {
    _type: 'project',
    title: 'Custom Embroidered Decky Style 211 Foam Trucker Hats',
    slug: { _type: 'slug', current: 'custom-embroidery-on-a-foam-trucker-hat' },
    tags: ['Embroidery', 'Headwear', 'Trucker Hat'],
    product: '211-BLK 5 Panel High Profile Structured Foam Trucker, Black',
    decoration: ['embroidery'],
    materials: 'Fabric: 55% Foam, 45% Nylon Closure: Plastic Snapback',
    designName: 'High-End Club',
    quantity: '475 units',
    shortDescription:
      'At Garment Decor, we specialize in creating custom embroidered merchandise for clothing brands with precision and high-quality materials. Recently, we embroidered 475 black Decky #211 5 Panel High Profile Structured Foam Trucker Hats, featuring a vibrant multi-color design.',
    longDescription: [
      ptParagraph(
        'The Decky #211 Foam Trucker Hat is a top choice for clothing brands looking for bold, custom embroidered headwear that stands out.'
      ),
    ],
    publishedAt: '2024-11-23T12:00:00.000Z',
  },
  // 29
  {
    _type: 'project',
    title: 'Custom Embroidered Champion CD400 Crewneck Sweatshirts | Brand Merch',
    slug: { _type: 'slug', current: 'custom-embroidered-cartoon-characters' },
    tags: ['Embroidery', 'Sweatshirts', 'Tops'],
    product: 'CD400 Champion – Garment-Dyed Crewneck Sweatshirt',
    decoration: ['embroidery'],
    materials: '10 oz./yd², 90/10 no-shrink cotton/polyester Double-needle stitched throughout V-notch',
    designName: 'Patrick Star',
    shortDescription:
      "At Garment Decor, we're always pushing the boundaries of apparel customization. Recently, we had the pleasure of custom embroidering Champion CD400 Garment-Dyed Crewneck Sweatshirts with a detailed design of Patrick Star, giving this popular character a new, premium look.",
    longDescription: [
      ptParagraph(
        "Embroidery adds depth and a three-dimensional look to the character, which wouldn't be achievable with standard screen printing. Our skilled team ensured every stitch was precise, resulting in a detailed, high-quality embroidered design that will last."
      ),
    ],
    testimonialQuote:
      "Garment Decor's embroidery work is outstanding! The details in the Patrick Star design on our crewnecks came out better than we could have imagined. Their team is professional and quick—truly top-notch quality.",
    publishedAt: '2024-11-22T12:00:00.000Z',
  },
  // 30
  {
    _type: 'project',
    title: 'Custom Embroidered Valucap VC100 Lightweight Twill Caps | Brand Merch',
    slug: { _type: 'slug', current: 'wholesale-custom-embroidery-for-your-brand' },
    tags: ['Dad Cap', 'Embroidery', 'Headwear', 'Snapback'],
    product: 'Valucap – Lightweight Twill Cap – VC100',
    decoration: ['embroidery'],
    materials: '65/35 polyester/cotton twill Structured, six-panel, mid-profile Pre-curved visor Sewn eyelets Snapback closure',
    designName: 'Big John Energy',
    quantity: '850 units',
    shortDescription:
      'At Garment Decor, we\'re proud to create custom, high-quality headwear for clothing brands looking to stand out. Recently, we completed a bulk embroidery project for 850 Valucap Lightweight Twill Caps (VC100) in black, featuring a bold "Big John Energy" design.',
    longDescription: [
      ptParagraph(
        'The Valucap VC100 Lightweight Twill Cap combines style and functionality. Its lightweight material provides a comfortable, breathable fit, making it an excellent choice for custom branding, especially in bulk orders.'
      ),
    ],
    testimonialQuote:
      'Garment Decor\'s embroidery quality exceeded our expectations! The "Big John Energy" caps came out looking fantastic, and the fast service was essential for our launch.',
    publishedAt: '2024-11-21T12:00:00.000Z',
  },
  // 31
  {
    _type: 'project',
    title: 'Wholesale Custom Embroidery on Towels',
    slug: { _type: 'slug', current: 'wholesale-custom-embroidery-on-towels' },
    tags: ['Accessories', 'Embroidery'],
    product: 'C3060 Carmel Towel Company – Velour Beach Towel',
    decoration: ['embroidery'],
    materials: '100% cotton velour Fiber-reactive dyed Hemmed edges',
    designName: 'LA Lakers x Goat Fuel',
    shortDescription:
      'Are you looking for a great place to get wholesale custom embroidery on towels? Look no further than Garment Decor! We offer quality embroidery services at competitive prices. Whether you\'re looking to personalize towels, robes, blankets or any other type of fabric garment- we can help!',
    longDescription: [
      ptParagraph(
        'At Garment Decor, our goal is to always ensure that the highest quality product is delivered to our customers. We use state-of-the-art machinery and technology to ensure that every stitch is tightly woven and well made.'
      ),
    ],
    publishedAt: '2024-11-20T12:00:00.000Z',
  },
  // 32
  {
    _type: 'project',
    title: 'Custom Embroidered OTTO CAP 32-934 Trucker Hats for Local Clothing Brand',
    slug: { _type: 'slug', current: 'custom-hat-embroidery-los-angeles-downtown' },
    tags: ['Embroidery', 'Headwear', 'Trucker Hat'],
    product: '32-934 OTTO CAP 5 Panel Mid Profile Mesh Back Trucker Hat',
    decoration: ['embroidery'],
    materials: 'Front: 100% Combed Ring Spun Cotton Back: 100% Polyester – Structured Firm Front Panel',
    designName: 'Satin and Fill Stitches',
    quantity: '500 units',
    shortDescription:
      'At Garment Decor, we specialize in creating high-quality, custom headwear for clothing brands. Recently, we partnered with a local brand to produce 500 custom embroidered OTTO CAP 32-934 5 Panel Mid Profile Mesh Back Trucker Hats in black, featuring a clean, white embroidered design.',
    longDescription: [
      ptParagraph(
        'The OTTO CAP 32-934 combines a structured front with a mesh back, providing both style and comfort for everyday wear. Its black base and mesh construction allow the white embroidered design to stand out, creating a classic and professional look.'
      ),
    ],
    testimonialQuote:
      'Garment Decor nailed it! The quality of the embroidery is outstanding, and the hats have been a huge hit with our customers.',
    publishedAt: '2024-11-19T12:00:00.000Z',
  },
  // 33
  {
    _type: 'project',
    title: 'Rush Embroidered 6089M YP Classics Flat Bill Snapback Caps for Manila Squad',
    slug: { _type: 'slug', current: 'hat-logo-embroidery-near-me' },
    tags: ['Embroidery', 'Headwear', 'Snapback'],
    product: '6089M YP Classics – Flat Bill Snapback Cap',
    decoration: ['embroidery', 'rush'],
    materials: '80/20 acrylic/wool',
    designName: 'Offroad Culture',
    client: 'Manila Squad',
    quantity: '150 units',
    shortDescription:
      "Garment Decor recently completed a rush order for Manila Squad, a clothing brand seeking high-quality custom embroidered caps to enhance their branding. We produced 150 YP Classics 6089M Flat Bill Snapback Caps in purple, showcasing the Manila Squad logo prominently on the front.",
    longDescription: [
      ptParagraph(
        'This snapback style offers a popular base for custom branding, with its structured build and versatile snapback closure appealing to a wide range of customers.'
      ),
    ],
    testimonialQuote:
      "We were on a tight deadline, and Garment Decor delivered! The quality of the embroidery is top-notch, and the caps came out looking exactly how we wanted.",
    testimonialAuthor: 'Manila Squad',
    publishedAt: '2024-11-18T12:00:00.000Z',
  },
  // 34
  {
    _type: 'project',
    title: 'Custom Digital Screen Printing on Independent SS4500 Hoodies with Full-Color Designs',
    slug: { _type: 'slug', current: 'betray-the-hype-digital-squeegee-hoody' },
    tags: ['Digital Screen Printing', 'Screen Printing', 'Sweatshirts', 'Tops'],
    product: 'SS4500 – CLASSICS Independent Midweight Hooded Pullover Sweatshirt',
    decoration: ['digital-screen-printing'],
    materials: '80/20 cotton/polyester blend fleece with 100% cotton face',
    designName: 'Betraythehype.com',
    quantity: '300 units',
    shortDescription:
      'At Garment Decor, we specialize in delivering vibrant, full-color designs using our advanced Digital Screen Printing technique. Recently, we produced 300 SS4500 Midweight Hooded Pullover Sweatshirts in white, featuring full-color prints on both the front and back.',
    longDescription: [
      ptParagraph(
        'Our Digital Screen Printing process allows for detailed, full-color designs with vibrant, smooth gradients and sharp details. Whether you\'re printing complex logos or multi-color artwork, this technique ensures your designs stand out.'
      ),
    ],
    publishedAt: '2024-11-17T12:00:00.000Z',
  },
  // 35
  {
    _type: 'project',
    title: 'Rush Embroidered OTTO Cap Style No. 141-1070 Mesh Back Trucker Hats with 3D Puff Logo',
    slug: { _type: 'slug', current: 'custom-puff-embroidery-on-trucker-hats-by-garment-decor' },
    tags: ['Embroidery', 'Headwear', 'Puff', 'Trucker Hat'],
    product: '141-1070 OTTO CAP "OTTO SNAP" Camouflage 6 Panel Mid Profile Mesh Back Trucker Snapback Hat',
    decoration: ['embroidery', 'rush'],
    materials: 'Front 65% Polyester / 35% Cotton Back 100% Polyester Mesh – Structured Firm Front Panel',
    quantity: '950 units',
    shortDescription:
      'For brands needing high-quality custom embroidery with a quick turnaround, Garment Decor is the go-to partner. We recently completed a rush embroidery order of 950 OTTO Cap Style No. 141-1070 6 Panel Mid Profile Mesh Back Trucker Snapback Hats. The design featured a bold, white 3D puff logo.',
    longDescription: [
      ptParagraph(
        'The OTTO Snapback Trucker Hat is a popular choice for promotional and branded merchandise, thanks to its structured profile and stylish design. This style is especially well-suited for 3D puff embroidery, allowing logos and letters to appear raised and textured.'
      ),
    ],
    testimonialQuote:
      "Our hats came out even better than we imagined! The 3D puff logo is perfect, and Garment Decor's rush embroidery service saved us. Highly recommend them for quality and efficiency.",
    publishedAt: '2024-11-16T12:00:00.000Z',
  },
  // 36
  {
    _type: 'project',
    title: 'Custom Embroidered Orange OTTO CAP 39-165 High Crown Mesh Back Trucker Hats for Camp Scoville',
    slug: { _type: 'slug', current: 'wholesale-customized-embroidered-trucker-hats-for-scoville' },
    tags: ['Embroidery', 'Headwear', 'Trucker Hat'],
    product: '39-165 OTTO CAP 5 Panel High Crown Mesh Back Trucker Hat',
    decoration: ['embroidery', 'rush'],
    materials: '100% Polyester – Front Panel w/ Lining',
    designName: 'Camp Scoville',
    client: 'Camp Scoville',
    quantity: '150 units',
    turnaround: '4 business days',
    shortDescription:
      "At Garment Decor, we're dedicated to delivering high-quality custom merch with efficient turnaround. Recently, we partnered with Camp Scoville to produce orange OTTO CAP 39-165 5 Panel High Crown Mesh Back Trucker Hats embroidered with their logo.",
    longDescription: [
      ptParagraph(
        "These OTTO CAP 39-165 hats are ideal for promotional events, combining a high crown and mesh back to offer both style and comfort. The orange color made Camp Scoville's branding stand out, creating a striking look that attendees would easily recognize."
      ),
    ],
    testimonialQuote:
      "Garment Decor's fast turnaround and quality embroidery exceeded our expectations! Our hats looked amazing and arrived on time for our event.",
    testimonialAuthor: 'Camp Scoville',
    publishedAt: '2024-11-15T12:00:00.000Z',
  },
  // 37
  {
    _type: 'project',
    title: 'Custom 450 Digital Screen Printed Gildan® H000 T-Shirts for a Clothing Brand',
    slug: { _type: 'slug', current: 'custom-wholesale-digital-squeegee-by-garment-decor' },
    tags: ['Digital Screen Printing', 'Screen Printing', 'Shirts', 'Tops'],
    product: 'H000 – Gildan – Hammer™ T-Shirt',
    decoration: ['digital-screen-printing'],
    materials: '100% combed ringspun cotton',
    designName: 'Death Defeated',
    quantity: '450 units',
    shortDescription:
      'At Garment Decor, we specialize in Digital Screen Printing powered by M&R to deliver vibrant, full-color designs with unmatched precision. Recently, we produced custom designs on Gildan® H000 Adult T-Shirts, showcasing a detailed digital screen print on the front.',
    longDescription: [
      ptParagraph(
        'Our digital squeegee technology allows us to produce vivid, detailed prints with smooth gradients and sharp colors, ideal for clothing brands looking for high-quality, full-color designs.'
      ),
    ],
    publishedAt: '2024-11-14T12:00:00.000Z',
  },
  // 38
  {
    _type: 'project',
    title: 'Custom Screen Printed Q-Tees Q800 Tote Bags for Lush Life Clothing Brand',
    slug: { _type: 'slug', current: 'custom-screen-printed-tote-bag-for-small-companies' },
    tags: ['Bags', 'Screen Printing', 'Spot Color'],
    product: 'Q800 Q-Tees – Promotional Tote',
    decoration: ['screen-printing'],
    materials: '100% heavy cotton canvas',
    designName: 'Lush Life',
    client: 'Lush Life',
    quantity: '650 units',
    shortDescription:
      "At Garment Decor, we recently completed a custom screen printing project for Lush Life, a clothing brand seeking high-quality promotional tote bags. We printed 650 Q-Tees Q800 Promotional Tote Bags in white, featuring a unique, hand-sketched design in black ink.",
    longDescription: [
      ptParagraph(
        "The Q-Tees Q800 is an excellent choice for brands looking for versatile, high-quality tote bags that offer a professional look and durability. This tote's smooth surface ensures a clear, crisp print, perfect for detailed designs."
      ),
    ],
    publishedAt: '2024-11-13T12:00:00.000Z',
  },
  // 39
  {
    _type: 'project',
    title: 'Custom Simulated Process Screen Printed Los Angeles Apparel 1801GD T-Shirts',
    slug: { _type: 'slug', current: 'simulated-screen-printing-on-shirt' },
    tags: ['Screen Printing', 'Simulated Screen Printing', 'Tops'],
    product: '1801GD Los Angeles Apparel',
    decoration: ['simulated-process'],
    materials: 'Made of 100% USA cotton, beefy, durable, and absorbent, virtually shrink-free as a result of garment dyeing',
    designName: 'Madrugada Clothing',
    quantity: '350 units',
    shortDescription:
      'At Garment Decor, we specialize in high-quality screen printing, using advanced techniques like simulated process printing to bring complex designs to life. Recently, we silk-screened 350 Los Angeles Apparel 1801GD t-shirts in black, featuring a bold 6-color simulated process design.',
    longDescription: [
      ptParagraph(
        'The Los Angeles Apparel 1801GD t-shirt is the ideal canvas for screen printing, offering a smooth, durable surface that holds ink beautifully, even after multiple washes.'
      ),
    ],
    publishedAt: '2024-11-12T12:00:00.000Z',
  },
  // 40
  {
    _type: 'project',
    title: 'Custom 3D Puff Embroidery on Caps: YP Classics, OTTO, and Flexfit Showcase',
    slug: { _type: 'slug', current: 'puff-embroidery-hats-ideas-will-inspire' },
    tags: ['Dad Cap', 'Embroidery', 'Headwear', 'Puff', 'Snapback'],
    product: 'YP Classics® lightly structured 5-panel snapback cap, Style No. 31-069 OTTO CAP 5 Panel, Flexfit 110® Pro-Formance® cap',
    decoration: ['embroidery'],
    shortDescription:
      'Our Puff Embroidery Portfolio showcases the bold, raised effect that 3D puff embroidery can add to any logo, creating a standout look that brings your brand to life. This technique uses foam beneath the embroidery stitches, resulting in a three-dimensional texture that enhances visibility and style.',
    longDescription: [
      ptParagraph(
        '3D puff embroidery uses foam under the embroidery thread to create a raised, three-dimensional look. This process requires multiple passes to achieve a smooth, raised finish without compromising durability. Puff embroidery involves extra materials and precision, making it a premium option compared to standard embroidery.'
      ),
    ],
    testimonialQuote:
      "Garment Decor's 3D puff embroidery really brought our brand logo to life. The texture and quality are unmatched!",
    publishedAt: '2024-11-11T12:00:00.000Z',
  },
  // 41
  {
    _type: 'project',
    title: "Custom Embroidered Independent Trading Co. SS3000 Midweight Sweatshirts for Netflix's Corporate Merchandise",
    slug: { _type: 'slug', current: 'netflix-tonal-technique-embroidered-logo' },
    tags: ['Embroidery', 'Puff', 'Tonal'],
    product: 'Independent Trading Co SS3000 Midweight Sweatshirt',
    decoration: ['embroidery'],
    materials: '8.5 oz cotton/polyester blend fleece Solid Colors: 80% Cotton/20% Polyester with 100% cotton face yarn',
    designName: 'Netflix',
    client: 'Netflix',
    shortDescription:
      'Garment Decor recently partnered with Netflix to create a sleek and professional corporate gift for the holidays. We custom embroidered Independent Trading Co. SS3000 Midweight Sweatshirts in white with white thread, achieving a refined tonal look that aligns perfectly with Netflix\'s brand identity.',
    longDescription: [
      ptParagraph(
        'These Independent Trading Co. Midweight Sweatshirts are an excellent choice for corporate merch due to their durability and comfort. The tonal white-on-white embroidery gives a subtle yet classy touch, highlighting the brand in a way that\'s both sophisticated and understated.'
      ),
    ],
    testimonialQuote:
      'Working with Garment Decor made our corporate gifting easy. The tonal sweatshirts looked fantastic, and the quality was unmatched!',
    testimonialAuthor: 'Netflix',
    publishedAt: '2024-11-10T12:00:00.000Z',
  },
  // 42
  {
    _type: 'project',
    title: 'Custom Screen Printed Lane Seven LST002 Vintage Crewneck Tees for Sugarhill Clothing',
    slug: { _type: 'slug', current: 'wholesale-screen-print-on-t-shirts' },
    tags: ['Screen Printing', 'Spot Color'],
    product: 'Lane Seven LST002 Vintage Crewneck Tee',
    decoration: ['screen-printing', 'retail-finishing'],
    materials: '30 Singles 4.3 oz 100% Cotton Jersey Side Seamed. Tight-knit. Double-needle topstitched.',
    designName: 'Sugarhill',
    client: 'Sugarhill Clothing',
    quantity: '600 units',
    turnaround: '5 business days',
    shortDescription:
      'Garment Decor recently partnered with Sugarhill Clothing to produce 600 Lane Seven LST002 Vintage Crewneck Tees in vintage black and vintage camel. Each shirt was screen printed with Sugarhill\'s design using our high-quality, vibrant plastisol inks.',
    longDescription: [
      ptParagraph(
        "The Lane Seven LST002 Vintage Crewneck Tee provided an excellent canvas for Sugarhill's designs. Its vintage look and feel aligned well with Sugarhill's brand aesthetic. With our quick turnaround service, we produced 600 of these tees within 5 business days."
      ),
    ],
    testimonialQuote:
      "Garment Decor provided a perfect finish for our custom vintage tees. The retail-ready look with neck tags, folding, and bagging made these products stand out in our collection!",
    testimonialAuthor: 'Sugarhill Clothing',
    publishedAt: '2024-11-09T12:00:00.000Z',
  },
  // 43
  {
    _type: 'project',
    title: "Custom Screen Printed Los Angeles Apparel 1801GD T-Shirts for LeBron James's Clothing Brand",
    slug: { _type: 'slug', current: 'the-shop-uninterrupted-custom-screen-printing-on-la-apparel-1801' },
    tags: ['Screen Printing', 'Shirts', 'Spot Color'],
    product: '6.5oz Garment Dye Crew Neck T-Shirt Style 1801GD',
    decoration: ['screen-printing'],
    materials: '100% Cotton / Plastisol inks',
    designName: 'The Shop Uninterrupted',
    client: "LeBron James",
    quantity: '150 units',
    shortDescription:
      "Garment Decor recently partnered with a clothing brand owned by LeBron James to create 150 custom Los Angeles Apparel 1801GD t-shirts in orange, white, and chocolate. This project highlighted our premium screen printing capabilities, with vibrant ink used for both the front and back designs.",
    longDescription: [
      ptParagraph(
        'The 1801GD t-shirt is an ideal canvas for high-quality screen printing, especially for brands prioritizing durability and color integrity. The garment dye process ensures that the color remains vibrant and true, even after multiple washes.'
      ),
    ],
    publishedAt: '2024-11-08T12:00:00.000Z',
  },
  // 44
  {
    _type: 'project',
    title: 'Full-Color Digital Squeegee on white AS Colour Classic Tee 5026 for Clothing Brand Client',
    slug: { _type: 'slug', current: 'digital-squeegee-champions' },
    tags: ['Digital Screen Printing', 'Screen Printing', 'Shirts'],
    product: 'AS Colour Classic Tee 5026',
    decoration: ['digital-screen-printing', 'rush'],
    materials: 'Heavy weight, 6.5 oz, 22-singles, 100% combed cotton Relaxed Fit Neck ribbing, side seamed, preshrunk',
    designName: 'Qtfl',
    quantity: '1,500 units',
    turnaround: '5 business days',
    shortDescription:
      'At Garment Decor, we specialize in high-quality, full-color printing for clothing brands, using cutting-edge technology to bring designs to life with precision and speed. Recently, we completed an order of 1,500 AS Colour Classic Tee 5026 t-shirts in white, decorated with full-color digital screen prints.',
    longDescription: [
      ptParagraph(
        'The AS Colour Classic Tee 5026 is a top choice for clothing brands due to its quality fabric and versatile fit. The tear-away label offers a flexible option for brands wishing to add their own woven labels.'
      ),
    ],
    testimonialQuote:
      "Garment Decor's Digital Squeegee service exceeded our expectations. They delivered vibrant color and detail in a fraction of the time—perfect for our brand's launch!",
    publishedAt: '2024-11-07T12:00:00.000Z',
  },
];

async function main() {
  const total = newProjects.length;
  console.log(`Importing ${total} NEW portfolio projects to Sanity...\n`);
  console.log('Using createIfNotExists — existing projects will NOT be modified.\n');

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < total; i++) {
    const doc = newProjects[i] as Record<string, unknown>;
    const slug = (doc.slug as { current: string }).current;
    const id = `project-${slug}`;
    try {
      const result = await client.createIfNotExists({
        ...doc,
        _id: id,
      });
      if (result._createdAt === result._updatedAt) {
        console.log(`  [${i + 1}/${total}] Created: ${doc.title}`);
        created++;
      } else {
        console.log(`  [${i + 1}/${total}] Already exists (skipped): ${slug}`);
        skipped++;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already exists')) {
        console.log(`  [${i + 1}/${total}] Already exists (skipped): ${slug}`);
        skipped++;
      } else {
        console.error(`  [${i + 1}/${total}] Failed (${slug}):`, err);
      }
    }
  }
  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  console.log('View at /portfolio and in Studio at /studio.');
}

main();

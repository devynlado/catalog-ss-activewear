'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Google Reviews — manually curated 5-star reviews shown as a carousel.      */
/*                                                                            */
/*  HOW TO EDIT:                                                              */
/*  Replace the entries in the `reviews` array below with the real            */
/*  testimonials. Keep `name` as initials only (e.g. "Rina S.") and paste     */
/*  the testimonial text into `text`. Add up to 25 entries.                   */
/* -------------------------------------------------------------------------- */

interface GoogleReview {
  name: string; // client initials, e.g. "John D."
  text: string; // testimonial text
}

const reviews: GoogleReview[] = [
  {
    name: "Adam M.",
    text: "Garment Decor provides exceptional service from start to finish! Their communication was constant, the quality of the work was absolutely perfect, and the shipping was outstanding. Honestly, in this day and age, it's hard to find a company that delivers this level of service and professionalism. I only wish I could hire their entire team! Highly recommended!",
  },
  {
    name: "Amber A.",
    text: "I am extremely happy with the work from Garment Decor! They did an amazing job on our apparel, and the quality of the printing and finished products exceeded my expectations. Everything came out beautiful, professional, and exactly how I envisioned it. I highly recommend Garment Decor for anyone looking for quality custom apparel and great service. We will definitely be using them again!",
  },
  {
    name: "Scott S.",
    text: "Garment Decor did a great job on our 3-color screenprinted tote bags! It was easy to design and order them online. Garment Decor provided quick and concise communication about the process. They then texted me a pic of the bags on-press to approve the art. They product was printed and delivered promptly — And they look great. I'm very happy with their work and will definitely use them again.",
  },
  {
    name: "Sean T.",
    text: "I found Garment decor on the internet and was not dissapointed. I started and order with them, but had to back out at the last moment. They were professional about it. I came back and placed an order and they came through and surpassed my expectations.",
  },
  {
    name: "Justeen Y.",
    text: "Garment Decor always comes through! Great service. Fast, friendly, always working hard to deliver on time with amazing quality work. I refuse to work with anyone else and have built such a good relationship with the staff. Been with them for years and really appreciate all they do. My business is thriving thanks to them.",
  },
  {
    name: "Mateo G.",
    text: "Was skeptical at first because of several factors that made it seem to good to be true: all high reviews, very polished website, fast and personable customer service, and a reasonable price. However, I was wrong to be skeptical. Very happy with the shirts I ordered and the whole process. The art team made sure I liked the colors and location of the print and let me change them several times with no complaints.",
  },
  {
    name: "Shawn H.",
    text: "Best in the business. Adryan was knowledgeable, gave good advice, got us a quote super quickly and was very reasonably priced. Highly recommend to work with him and this amazing team!",
  },
  {
    name: "Ethan T.",
    text: "Unbelievable experience!! The customer service was outrageous. They picked up my goods from a local blanks supplier in the morning and printed and shipped same day. They even send pre-production press checks before every single job and print location. I'll definitely be using them A TON!",
  },
  {
    name: "Torie W.",
    text: "I've been working with Garment Decor for nearly 8 years now, and they've consistently exceeded expectations with every single order. As someone who regularly orders custom shirts for both business and community events, I can't emphasize enough how valuable their attention to detail and exceptional print quality has been.",
  },
  {
    name: "A Daily Walk Store",
    text: "We're impressed with the quality of service Garment Decor provides their customers. They met our timelines, and we received our order sooner than expected. They go above and beyond to ensure their customers are satisfied, and they did an excellent printing job on the hats. We love how it all turned out. Thank you!",
  },
  {
    name: "Hazard the World Venture Co.",
    text: "Amazing! Martine and the crew at Garment Decor were so on top of it and easy to work with! They kept us in the loop through the entire process and made us feel like we were their highest priority even though our order was relatively small in quantity. We highly recommend and cannot wait to work with them again!",
  },
  {
    name: "Ana P.",
    text: "We've had the pleasure of partnering with Garment Decor for our merch line, and the experience has been nothing short of amazing. Their team went above and beyond to ensure that every detail was perfect—from fabric selection to design precision. But what truly sets them apart is their customer service. They've been incredibly responsive, attentive, and genuinely invested in making our vision come to life.",
  },
  {
    name: "Micah L.",
    text: "Garment Decor is hands-down the best in the business! Their customer service is absolutely phenomenal—friendly, attentive, and always going the extra mile to ensure you're 100% satisfied. We have ordered from them multiple times and every piece we ordered was crafted to perfection, with amazing attention to detail and durability that exceeded all expectations. It's so rare to find a company that truly delivers on both service and product quality, but Garment Decor does it effortlessly. Highly recommend them to anyone looking for top-tier products and a seamless experience!",
  },
  {
    name: "Mazal Market",
    text: "Can't stress enough how amazing Garment Decor is, their quality, attention to detail, speed and communication all deserve way more than 5 stars, my embroidered hats couldn't have turned out better than they did. Grateful to have found this gem.",
  },
  {
    name: "Mitch K.",
    text: "So professional, fast & caring. From the first phone call to the last, the team at Garment Decor was on top of everything, allowing me not to worry and trust that they were doing their job. They did not disappoint either! I received a quality product that I am very happy with.",
  },
  {
    name: "Eli N.",
    text: "Garment Decor is the best in the biz for so many reasons. Devyn and his team are very hands on making sure every detail is perfect at every step of the process. They have the best machines, the best facility and the best team and as a result, the product is always fantastic. They truly aren't happy until you're happy and they're wonderful to work with. On our last run of just 600 shirts, Devyn spent a ton of time helping me perfect the design and tweaking colors to make sure they came out great. Even though we're a small customer, we're treated like VIPs.",
  },
  {
    name: "Erika R.",
    text: "Everyone here is great to work with, and they all handle matters with a high level of professionalism. Marcel has been awesome to collaborate with, and he has taken care of our orders with detail and precision for years now. We are really happy with the quality they produce and their quick turn around times. Thank you and your staff for all your good work!",
  },
  {
    name: "DJ R.",
    text: "Had a great experience ordering shirts here. Their representative Dan Bramlet was very friendly and informative and Marcel who I believe is one of the owners was nothing but courteous and professional. I'll definitely be repeating my business with them. Highly recommended.",
  },
  {
    name: "JT N.",
    text: "Tara and the team at Garment Decor were awesome! Such a pleasant experience to get all my shirts, hoodies and hats done. The quality and pricing were great. I live in WA and was able to do everything via phone and email. They are all easy to work with and provide great customer service. Highly Recommend!",
  },
  {
    name: "VC Corporation",
    text: "It was my first time creating merchandise for my company, & Valentina one of their representatives was extremely helpful! She gave me her recommendations and professional insight! I was able to pull the green light, same day! Super excited to continue to working with Garment Decor!",
  },
  {
    name: "Cesar A.",
    text: "For my first design shirt design, it was great. Really good detail and quality. I am a very small upcoming business owner and im about quality and Garment Decor nailed it. They were very helpful. I look forward to the next design.",
  },
  {
    name: "Bill B.",
    text: "What an awesome company! The masks came on time from their estimate and we were really pleased with the quality. They fit nicely over my big dome and my wife said they fit her well too. They are black, fairly thick, look good and they do the trick. Then I received a follow up email from the owner after delivery, ensuring we were satisfied. Great quality, great customer service and I'm happy to support a local company (Riverside County). I highly recommend them and the masks! Thank you!",
  },
  {
    name: "Austin A.",
    text: "Adryan is the most professional enthusiastic sales representative I have dealt with! I've been dealing with Garment Decor since 2016 and I've always had a great experience with beautiful quality screen printing! Highly recommend this team to anyone!",
  },
  {
    name: "Jionni J.",
    text: "Simply a great company to work with! Their communication, their quality of work and there turnaround time was exactly what I ask for when dealing with a business. Ceej remained in contact with me through the duration of the job and updated me with anything, quick to answer questions and the whole team knows what they're doing.... hit them up for your custom shirt needs!",
  },
  {
    name: "Max R.",
    text: "Their team is extraordinary, Valentina was assigned to my account and honestly was such a huge help. She helped me with garment choices, advice, design suggestions, Etc! It didn't stop there their graphic designers were also such a great help too, I can go on about how amazing their service was but let me tell you the printing and quality was also top-notch. They even sent sample Photos of my pieces before they ran The entire order to ensure I was happy!! I'll definitely be back thank you so much Valentina and garment Decor!",
  },
];

// Official multi-color Google "G" mark (inline so no asset file is needed).
function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function initialsFrom(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const GOOGLE_REVIEWS_URL =
  'https://www.google.com/maps/place/Garment+Decor/@34.0565302,-117.700693,17z/data=!4m8!3m7!1s0x80c332b0ab0294ab:0x476adc033fed81e1!8m2!3d34.0565302!4d-117.700693!9m1!1b1!16s%2Fg%2F1pxq43y_j?entry=ttu&g_ep=EgoyMDI2MTExMC4wIKXMDSoASAFQAw%3D%3D';

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="flex h-full w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:w-[340px]">
      {/* 5 stars */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Name (initials) */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-brand-50 text-sm font-bold text-brand-600">
          {initialsFrom(review.name)}
        </div>
        <p className="font-semibold text-slate-900">{review.name}</p>
      </div>

      {/* Testimonial */}
      <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Google logo */}
      <div className="mt-6 flex items-center gap-2 border-t border-stone-100 pt-4">
        <GoogleGlyph className="h-5 w-5" />
        <span className="text-xs font-medium text-slate-400">Posted on Google</span>
      </div>
    </div>
  );
}

interface GoogleReviewsProps {
  /** Show the "See more reviews" button that links out to Google. Defaults to true. */
  showSeeMore?: boolean;
}

export function GoogleReviews({ showSeeMore = true }: GoogleReviewsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    checkScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollState);
    window.addEventListener('resize', checkScrollState);
    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 360; // card width + gap
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (reviews.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-stone-50 px-4 py-1.5">
            <GoogleGlyph className="h-5 w-5" />
            <span className="text-sm font-semibold text-slate-700">Google Reviews</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-navy-800 sm:text-3xl">
            What Our Customers Say
          </h2>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-medium text-slate-500">
              Rated 5 stars by our clients
            </span>
          </div>
        </motion.div>

        {/* Carousel */}
        <div className="relative mt-12">
          {/* Nav buttons (desktop) */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll reviews left"
            className={cn(
              'absolute -left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-white p-2.5 shadow-md transition-colors lg:flex',
              canScrollLeft
                ? 'border-stone-200 text-slate-700 hover:bg-stone-50'
                : 'cursor-not-allowed border-stone-100 text-slate-300'
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll reviews right"
            className={cn(
              'absolute -right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border bg-white p-2.5 shadow-md transition-colors lg:flex',
              canScrollRight
                ? 'border-stone-200 text-slate-700 hover:bg-stone-50'
                : 'cursor-not-allowed border-stone-100 text-slate-300'
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            ref={scrollRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {reviews.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>
        </div>

        {/* See more reviews */}
        {showSeeMore && (
          <div className="mt-10 flex justify-center">
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-stone-50"
            >
              <GoogleGlyph className="h-5 w-5" />
              See more reviews
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Testimonial {
  quote: string;
  author: string;
  company: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "Best print quality we've found after trying 4 other shops. The colors are vibrant and they nail the placement every time. Our customers constantly comment on the quality.",
    author: "Marcus T.",
    company: "Streetwear Brand Owner",
    rating: 5,
  },
  {
    quote: "They turned around 500 hoodies in under a week for our company event. Communication was excellent and pricing was significantly better than local competitors.",
    author: "Sarah K.",
    company: "Corporate Events Manager",
    rating: 5,
  },
];

export function LPTestimonials() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            What Our Clients Say
          </h2>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map((i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            ))}
            <span className="ml-2 text-slate-600">4.8 out of 5 on Google</span>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-stone-50 rounded-2xl p-6 border border-stone-200"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-700 mb-4">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-semibold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-navy-800">{testimonial.author}</p>
                  <p className="text-sm text-slate-500">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { MousePointerClick, Send, Eye, Truck } from 'lucide-react';

const STEPS = [
  {
    icon: MousePointerClick,
    title: 'Browse & Select',
    description:
      'Explore our product line and add the items you want to your inquiry.',
  },
  {
    icon: Send,
    title: 'Tell Us About Your Project',
    description:
      'Submit your selections with design ideas — our team reviews every detail.',
  },
  {
    icon: Eye,
    title: 'Approve Your Samples',
    description:
      'We produce pre-production samples so you can see and feel the quality first.',
  },
  {
    icon: Truck,
    title: 'Production & Delivery',
    description:
      'Once approved, your full order is produced and shipped — typically in 3-4 weeks.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-stone-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            From selection to delivery — your dedicated rep handles everything
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="relative text-center">
              {/* Connector line (desktop) */}
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-8 hidden h-px w-full translate-x-1/2 bg-stone-300 lg:block" />
              )}

              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
                <step.icon className="h-7 w-7 text-brand-500" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </div>

              <h3 className="mt-5 text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

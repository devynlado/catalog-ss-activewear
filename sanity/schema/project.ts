import { defineField, defineType } from 'sanity';
import { DECORATION_OPTIONS } from './decorationOptions';

export const projectType = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'details', title: 'Details' },
    { name: 'testimonial', title: 'Testimonial' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Project Tags',
      type: 'array',
      group: 'content',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'category',
      title: 'Project Category',
      type: 'reference',
      group: 'content',
      to: [{ type: 'portfolioCategory' }],
    }),
    defineField({
      name: 'product',
      title: 'Product',
      type: 'string',
      group: 'details',
      description: 'Product used for the project (e.g. SS4500 Midweight Hooded Pullover)',
    }),
    defineField({
      name: 'decoration',
      title: 'Decoration',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'details',
      description: 'Printing/embroidery services used in this project (select one or more)',
      options: {
        list: [...DECORATION_OPTIONS],
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'string',
      group: 'details',
      description: 'Fabric (e.g. Cotton-Poly Blend)',
    }),
    defineField({
      name: 'designName',
      title: 'Design Name',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'string',
      group: 'details',
      description: 'e.g. 750 units',
    }),
    defineField({
      name: 'turnaround',
      title: 'Turnaround',
      type: 'string',
      group: 'details',
      description: 'e.g. 4 business days',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'content',
      rows: 3,
      description: '1–2 sentences for cards and meta description',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'longDescription',
      title: 'Long Description',
      type: 'array',
      group: 'content',
      of: [{ type: 'block' }],
      description: 'Main story / project description',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'content',
      options: {
        hotspot: true,
        accept: 'image/webp,image/jpeg,image/png,image/gif',
      },
      description: 'Card and social share image; fallback is first gallery image. WebP, JPEG, PNG, GIF accepted.',
    }),
    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
            accept: 'image/webp,image/jpeg,image/png,image/gif',
          },
        },
      ],
    }),
    defineField({
      name: 'testimonialQuote',
      title: 'Testimonial Quote',
      type: 'text',
      group: 'testimonial',
      rows: 4,
    }),
    defineField({
      name: 'testimonialAuthor',
      title: 'Testimonial Author',
      type: 'string',
      group: 'testimonial',
    }),
    defineField({
      name: 'testimonialCompany',
      title: 'Testimonial Company',
      type: 'string',
      group: 'testimonial',
    }),
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      group: 'seo',
      description: 'Override for SEO; default is project title',
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      group: 'seo',
      rows: 2,
      description: 'Override for SEO; default is short description',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'seo',
      description: 'Set when publishing; drafts have no value here and are hidden on the site',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'shortDescription',
      media: 'featuredImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ?? 'Untitled',
        subtitle: subtitle ? subtitle.slice(0, 60) + (subtitle.length > 60 ? '…' : '') : undefined,
        media,
      };
    },
  },
});

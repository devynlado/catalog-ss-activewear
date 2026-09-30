import { defineField, defineType } from 'sanity';
import { ImagesIcon } from '@sanity/icons';
import { DECORATION_OPTIONS } from './decorationOptions';
import { BLANK_OPTIONS } from './blankOptions';

/**
 * Portfolio Gallery Item — a single photo OR video showcased in the
 * /portfolio/photos and /portfolio/videos galleries.
 *
 * `contentType` decides which gallery the item appears in and which media
 * field is required (image for photos, videoUrl + coverImage for videos).
 */
export const portfolioGalleryItemType = defineType({
  name: 'portfolioGalleryItem',
  title: 'Portfolio Gallery Item',
  type: 'document',
  icon: ImagesIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'details', title: 'Details' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Project Name',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      description: 'Used as a stable identifier for this item.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'string',
      group: 'content',
      description:
        'Photo items appear on /portfolio/photos, video items on /portfolio/videos.',
      options: {
        list: [
          { title: 'Photo', value: 'photo' },
          { title: 'Video', value: 'video' },
        ],
        layout: 'radio',
      },
      initialValue: 'photo',
      validation: (Rule) => Rule.required(),
    }),

    // --- Media: Photo ---
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      group: 'content',
      hidden: ({ parent }) => parent?.contentType !== 'photo',
      options: {
        hotspot: true,
        accept: 'image/webp,image/jpeg,image/png,image/gif',
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility and SEO',
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { contentType?: string } | undefined;
          if (parent?.contentType === 'photo' && !value) {
            return 'An image is required for photo items';
          }
          return true;
        }),
    }),

    // --- Media: Video ---
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      group: 'content',
      hidden: ({ parent }) => parent?.contentType !== 'video',
      description: 'Paste an Instagram, YouTube, or Vimeo URL.',
      validation: (Rule) =>
        Rule.uri({ scheme: ['http', 'https'] }).custom((value, context) => {
          const parent = context.parent as { contentType?: string } | undefined;
          if (parent?.contentType === 'video' && !value) {
            return 'A video URL is required for video items';
          }
          return true;
        }),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'content',
      hidden: ({ parent }) => parent?.contentType !== 'video',
      description:
        'Thumbnail shown on the video card and hover overlay (required for videos).',
      options: {
        hotspot: true,
        accept: 'image/webp,image/jpeg,image/png,image/gif',
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as { contentType?: string } | undefined;
          if (parent?.contentType === 'video' && !value) {
            return 'A cover image is required for video items';
          }
          return true;
        }),
    }),

    // --- Details ---
    defineField({
      name: 'decoration',
      title: 'Decoration Category',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'details',
      description: 'Decoration services used (select one or more).',
      options: { list: [...DECORATION_OPTIONS] },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'blankCategory',
      title: 'Blank Category',
      type: 'string',
      group: 'details',
      description: 'Type of garment / blank used.',
      options: { list: [...BLANK_OPTIONS] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client Name',
      type: 'string',
      group: 'details',
    }),
    defineField({
      name: 'turnaround',
      title: 'Turnaround',
      type: 'string',
      group: 'details',
      description: 'e.g. 4 business days',
    }),
    defineField({
      name: 'quantity',
      title: 'Quantity',
      type: 'string',
      group: 'details',
      description: 'e.g. 750 units',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'details',
      description: 'Set when publishing; items without a value are hidden on the site.',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      contentType: 'contentType',
      client: 'client',
      image: 'image',
      coverImage: 'coverImage',
    },
    prepare({ title, contentType, client, image, coverImage }) {
      const type = contentType === 'video' ? 'Video' : 'Photo';
      return {
        title: title ?? 'Untitled',
        subtitle: [type, client].filter(Boolean).join(' · '),
        media: contentType === 'video' ? coverImage : image,
      };
    },
  },
});

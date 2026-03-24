'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, Upload, User, Loader2 } from 'lucide-react';
import { StarRating } from '@/components/reviews/StarRating';

interface ReviewFormProps {
  product: {
    styleId: number;
    styleName: string;
    brandName: string;
    title: string;
    colorName: string;
    imageUrl: string;
    orderId: string;
    orderNumber: string;
  };
  onClose: () => void;
  onSubmitted: (couponCode: string | null) => void;
}

export function ReviewForm({ product, onClose, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [avatar, setAvatar] = useState<{ file: File; preview: string; publicUrl?: string; uploading: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatar({ file, preview, uploading: true });
    setError(null);

    try {
      const res = await fetch('/api/orders/reviews/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type }),
      });

      if (!res.ok) throw new Error('Failed to get upload URL');
      const { signedUrl, publicUrl, token } = await res.json();

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          ...(token ? { 'x-upsert': 'true' } : {}),
        },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');

      setAvatar(prev => prev ? { ...prev, publicUrl, uploading: false } : null);
    } catch {
      setAvatar(prev => prev ? { ...prev, uploading: false } : null);
      setError('Photo upload failed. You can still submit your review.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAvatar = () => {
    if (avatar) {
      URL.revokeObjectURL(avatar.preview);
      setAvatar(null);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a star rating');
      return;
    }
    if (body.length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/orders/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          styleId: product.styleId,
          orderId: product.orderId,
          rating,
          title: title.trim() || undefined,
          reviewBody: body.trim(),
          avatarUrl: avatar?.publicUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to submit review');
        return;
      }

      onSubmitted(data.couponCode || null);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-navy-800">Write a Review</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-stone-100 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Product info */}
          <div className="flex items-center gap-3">
            {product.imageUrl && (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-stone-200">
                <Image src={product.imageUrl} alt={product.title} fill className="object-cover" unoptimized />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-navy-800">{product.brandName} {product.styleName}</p>
              <p className="text-xs text-slate-500">{product.title}</p>
              {product.colorName && (
                <p className="text-xs text-slate-400">Color: {product.colorName}</p>
              )}
            </div>
          </div>

          {/* Profile photo */}
          <div>
            <label className="text-sm font-medium text-navy-800">Your Profile Photo <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="mt-2 flex items-center gap-4">
              <div className="relative">
                {avatar ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-stone-200">
                    <Image src={avatar.preview} alt="Profile" fill className="object-cover" unoptimized />
                    {avatar.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                    <button
                      onClick={removeAvatar}
                      className="absolute -right-1 -top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-stone-200 text-slate-400 hover:border-brand-300 hover:text-brand-500 transition-colors"
                  >
                    <User className="h-6 w-6" />
                  </button>
                )}
              </div>
              {!avatar && (
                <p className="text-xs text-slate-400">Add a photo so other customers can see who you are</p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
          </div>

          {/* Star rating */}
          <div>
            <label className="text-sm font-medium text-navy-800">Your Rating</label>
            <StarRating rating={rating} size="lg" interactive onChange={setRating} className="mt-2" />
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium text-navy-800">Review Title <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-sm font-medium text-navy-800">Your Review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={4}
              minLength={10}
              className="mt-1.5 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 resize-none"
            />
            <p className="mt-1 text-xs text-slate-400">{body.length}/10 minimum characters</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit Review
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            You&apos;ll receive a 10% off coupon after submitting your review!
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Google Customer Reviews — survey opt-in module.
 *
 * Mounted on the order confirmation page (/checkout/success). After a customer
 * places an order we render Google's opt-in dialog which asks if they want to
 * be surveyed about their experience. If they accept, Google emails them a
 * survey shortly after the estimated delivery date and uses the responses to
 * compute our Merchant Center seller rating.
 *
 * Docs: https://support.google.com/merchants/answer/14629205
 *
 * Notes:
 *   - merchant_id, order_id, email, delivery_country and estimated_delivery_date
 *     are all required by Google.
 *   - delivery_country must be ISO 3166-1 alpha-2 (e.g. "US").
 *   - estimated_delivery_date must be YYYY-MM-DD.
 *   - The script must only run on HTTPS pages.
 */

import { useEffect, useRef } from 'react';
import Script from 'next/script';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GapiSurveyOptIn = {
  load: (name: 'surveyoptin', cb: () => void) => void;
  surveyoptin: {
    render: (opts: {
      merchant_id: string | number;
      order_id: string;
      email: string;
      delivery_country: string;
      estimated_delivery_date: string;
      opt_in_style?:
        | 'CENTER_DIALOG'
        | 'BOTTOM_RIGHT_DIALOG'
        | 'BOTTOM_LEFT_DIALOG'
        | 'TOP_RIGHT_DIALOG'
        | 'TOP_LEFT_DIALOG'
        | 'BOTTOM_TRAY';
    }) => void;
  };
};

declare global {
  interface Window {
    gapi?: GapiSurveyOptIn;
    renderOptIn?: () => void;
    // Used by Google to honor a language override for the badge / opt-in.
    ___gcfg?: { lang?: string };
  }
}

interface GoogleCustomerReviewsOptInProps {
  /** Internal order number, e.g. "GD-2026-00012". Must be unique per order. */
  orderId: string;
  /** Customer email, e.g. "name@domain.com". */
  email: string;
  /** ISO 3166-1 alpha-2 country code, e.g. "US". */
  deliveryCountry: string;
  /** Estimated delivery date as YYYY-MM-DD. */
  estimatedDeliveryDate: string;
  /** Optional placement of the opt-in dialog. Defaults to BOTTOM_RIGHT_DIALOG. */
  optInStyle?: GapiSurveyOptInOptInStyle;
}

type GapiSurveyOptInOptInStyle = NonNullable<
  Parameters<GapiSurveyOptIn['surveyoptin']['render']>[0]['opt_in_style']
>;

export function GoogleCustomerReviewsOptIn({
  orderId,
  email,
  deliveryCountry,
  estimatedDeliveryDate,
  optInStyle = 'BOTTOM_RIGHT_DIALOG',
}: GoogleCustomerReviewsOptInProps) {
  const merchantId = process.env.NEXT_PUBLIC_GOOGLE_MERCHANT_ID;
  const hasRenderedRef = useRef(false);

  // Google's loader expects window.renderOptIn to exist before platform.js
  // executes its onload callback. Define it as soon as the component mounts,
  // and re-define if any prop changes (so the latest order data is used).
  useEffect(() => {
    if (!merchantId || !orderId || !email || !deliveryCountry || !estimatedDeliveryDate) {
      return;
    }

    const renderOptIn = () => {
      if (hasRenderedRef.current) return;
      if (!window.gapi) return;
      window.gapi.load('surveyoptin', () => {
        if (hasRenderedRef.current) return;
        hasRenderedRef.current = true;
        window.gapi!.surveyoptin.render({
          merchant_id: merchantId,
          order_id: orderId,
          email,
          delivery_country: deliveryCountry,
          estimated_delivery_date: estimatedDeliveryDate,
          opt_in_style: optInStyle,
        });
      });
    };

    window.renderOptIn = renderOptIn;

    // If platform.js has already loaded by the time this effect runs, fire it now.
    if (window.gapi) {
      renderOptIn();
    }
  }, [merchantId, orderId, email, deliveryCountry, estimatedDeliveryDate, optInStyle]);

  if (!merchantId || !orderId || !email || !deliveryCountry || !estimatedDeliveryDate) {
    return null;
  }

  return (
    <Script
      id="gcr-platform"
      src="https://apis.google.com/js/platform.js?onload=renderOptIn"
      strategy="afterInteractive"
      async
      defer
    />
  );
}

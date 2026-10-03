'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';
import { getGaMeasurementId, trackGaPageView } from '@/lib/gtag';

/**
 * Route tracker that fires GA4 page_view on client-side route transitions
 */
function GoogleAnalyticsRouterTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  useEffect(() => {
    const queryString = searchParams?.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    // The base gtag('config', gaId) already fires the initial page_view on load.
    // The router tracker fires on subsequent client navigation.
    if (!isInitialMount.current) {
      trackGaPageView(url);
    } else {
      isInitialMount.current = false;
    }
  }, [pathname, searchParams]);

  return null;
}

/**
 * Root Google Analytics 4 (GA4) Script Component
 */
export default function GoogleAnalytics() {
  const gaId = getGaMeasurementId();

  return (
    <>
      {/* Client-side Route Transition Tracker */}
      <Suspense fallback={null}>
        <GoogleAnalyticsRouterTracker />
      </Suspense>

      {/* Inject Google Tag script only if Measurement ID is configured */}
      {gaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `,
            }}
          />
        </>
      )}
    </>
  );
}

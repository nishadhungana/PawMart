'use client';

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';
import { getPixelId, trackPageView } from '@/lib/meta-pixel';

/**
 * Route tracker that fires PageView on client-side route transitions
 */
function MetaPixelRouterTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Construct full relative URL
    const queryString = searchParams?.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    // Skip the very first mount if the base script already fired PageView, or track it cleanly
    trackPageView(url);
    isInitialMount.current = false;
  }, [pathname, searchParams]);

  return null;
}

/**
 * Root Meta Pixel Script Component
 */
export default function MetaPixel() {
  const pixelId = getPixelId();

  return (
    <>
      {/* Route Change Tracker */}
      <Suspense fallback={null}>
        <MetaPixelRouterTracker />
      </Suspense>

      {/* Inject Meta Pixel Base Script only if Pixel ID is configured */}
      {pixelId && (
        <>
          <Script
            id="meta-pixel-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}

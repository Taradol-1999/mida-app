import Script from "next/script";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export function GoogleAnalytics() {
  if (process.env.NODE_ENV !== "production" || !measurementId || !/^G-[A-Z0-9]+$/.test(measurementId)) {
    return null;
  }

  return (
    <>
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag() { window.dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
    </>
  );
}

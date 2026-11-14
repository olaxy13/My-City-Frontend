/**
 * An inline script that runs while the browser parses the server HTML (e.g. to
 * apply the saved theme before first paint).
 *
 * React warns in development when rendering produces a <script> tag. Following
 * Next's "Preventing flash before hydration" guide, the tag is
 * `text/javascript` on the server and `text/plain` (inert) in the browser;
 * suppressHydrationWarning covers the type difference.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

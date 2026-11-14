/**
 * Ask the image host for a copy sized for where it's shown, in a modern format
 * at automatic quality, instead of downloading the full original.
 *
 * Supports Cloudinary and Unsplash (where all listing photos live today); any
 * other URL, including data: URLs from local uploads, is returned unchanged.
 *
 * `width` is the displayed CSS width; it's doubled for sharp screens.
 */
export function sizedImage(url: string | undefined | null, width: number): string {
  if (!url) return '';
  const px = Math.round(width * 2);

  try {
    const u = new URL(url);

    if (u.hostname === 'res.cloudinary.com') {
      // .../image/upload/<transforms?>/v123/path.jpg → insert our transforms after /upload/
      const marker = '/upload/';
      const at = u.pathname.indexOf(marker);
      if (at === -1) return url;
      const rest = u.pathname.slice(at + marker.length);
      const firstSegment = rest.split('/')[0];
      const alreadyTransformed = firstSegment.includes(',') || /^(w|h|c|f|q)_/.test(firstSegment);
      if (alreadyTransformed) return url;
      u.pathname = `${u.pathname.slice(0, at + marker.length)}f_auto,q_auto,c_limit,w_${px}/${rest}`;
      return u.toString();
    }

    if (u.hostname === 'images.unsplash.com') {
      u.searchParams.set('w', String(px));
      u.searchParams.set('q', '70');
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'max');
      return u.toString();
    }
  } catch {
    // not an absolute URL (e.g. data:) — leave it alone
  }
  return url;
}

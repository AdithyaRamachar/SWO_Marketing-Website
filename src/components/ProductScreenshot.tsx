import { variantSrc } from '../content/schema.ts';
import type { ProductImage } from '../content/schema.ts';
import { cx } from '../lib/cx.ts';

export interface ProductScreenshotProps {
  /** A validated image from the content model. */
  image: ProductImage;
  /**
   * The `sizes` attribute: how wide the image will actually be drawn, so the
   * browser can pick a variant before layout. Required when the image has
   * other widths, because a wrong `sizes` wastes the whole srcSet.
   */
  sizes?: string;
  /**
   * `eager` + `high` for the one image above the fold; everything else stays
   * lazy. Only one image on a page should be eager.
   */
  priority?: boolean;
  /** Border, radius and shadow. Off for photographs that bleed to their edges. */
  framed?: boolean;
  className?: string;
}

/**
 * A content image with its space reserved.
 *
 * `width` and `height` come from the content and are checked against the real
 * file by `npm run validate:content`, so the browser can reserve the right
 * aspect ratio and the page does not shift as images load. The element is
 * always fluid: `w-full h-auto` with the intrinsic size only as a ratio hint.
 */
export function ProductScreenshot({
  image,
  sizes,
  priority = false,
  framed = true,
  className,
}: ProductScreenshotProps) {
  const widths = image.responsiveWidths ?? [];
  const srcSet =
    widths.length > 0
      ? [
          ...widths.map((w) => `${variantSrc(image.src, w)} ${w}w`),
          `${image.src} ${image.width}w`,
        ].join(', ')
      : undefined;

  const img = (
    <img
      src={image.src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={cx(
        'block h-auto w-full',
        framed && 'rounded-card border border-border-default shadow-card',
      )}
    />
  );

  if (!image.caption) return <div className={className}>{img}</div>;

  return (
    <figure className={cx('flex flex-col gap-2', className)}>
      {img}
      <figcaption className="text-small text-text-secondary">{image.caption}</figcaption>
    </figure>
  );
}

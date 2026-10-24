/**
 * Content model and validation rules for the SWO marketing page.
 *
 * Zod is the single definition: the runtime validator AND the compile-time
 * types (SiteContent) come from the same schemas, so they cannot drift.
 *
 * Imports use explicit `.ts` extensions because scripts/validate-content.ts
 * loads this file directly in Node as well as through Vite.
 *
 * Rules enforced here, and why (see docs/content-model.md):
 *   - strict objects      a misspelt field is rejected, never silently dropped
 *   - no placeholder links  "#", example.com, javascript:, mailto: are rejected
 *   - claim guard         affirmative unsupported claims are rejected
 *   - framework vs SWO    each framework needs BOTH a concept and an implementation
 *   - status triple       Green, Amber and Red each appear exactly once, with
 *                         meaning + example rationale + suggested action
 *
 * Limits: the claim guard is a pattern-based safety net for the worst offences.
 * It is NOT editorial review and cannot prove a sentence is true.
 */

import { z } from 'zod';

/**
 * In-page anchor targets the landing page provides. Every anchor in the content
 * is checked against this list, and `tests/content-render.test.tsx` checks that
 * the rendered page really contains an element with each id, so a link can
 * neither point at a section that does not exist nor silently stop working.
 */
export const SECTION_IDS = [
  'hero',
  'problem',
  'how-it-works',
  'status',
  'product',
  'science',
  'audiences',
  'faq',
] as const;

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER_HOSTS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'localhost',
  '127.0.0.1',
  'your-domain.com',
  'yourdomain.com',
  'domain.com',
]);

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value === 'object' ? 'an object' : `a ${typeof value}`;
}

/** Turns Zod's generic messages into ones that say what is wrong with the field. */
function fieldError(expected: string) {
  return (issue: z.core.$ZodRawIssue): string | undefined => {
    if (issue.code === 'unrecognized_keys') {
      const keys = (issue as { keys?: string[] }).keys ?? [];
      return `has unrecognised field(s) ${keys.map((k) => `"${k}"`).join(', ')} (check spelling; unknown fields are rejected, not ignored)`;
    }
    if (issue.code === 'invalid_type') {
      return issue.input === undefined
        ? 'is required'
        : `must be ${expected} (received ${describe(issue.input)})`;
    }
    return undefined;
  };
}

/** Phrases that assert something SWO cannot currently substantiate. */
const UNSUPPORTED_CLAIMS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bguarantee[sd]?\b/i, reason: 'results cannot be guaranteed' },
  {
    pattern: /\bclinically\s+(proven|validated|tested|verified|shown)\b/i,
    reason: 'there is no clinical validation',
  },
  {
    pattern: /\bscientifically\s+(proven|validated|verified)\b/i,
    reason: 'there is no scientific validation of SWO itself',
  },
  { pattern: /\bproven\b/i, reason: 'no outcome has been proven' },
  {
    pattern: /\b(predict|prevent|eliminat|reduc)\w*\s+(the\s+)?(risk\s+of\s+)?injur/i,
    reason: 'SWO does not predict or prevent injury',
  },
  {
    pattern: /\b(cures?|treats?|diagnos(?:e|es|is))\b/i,
    reason: 'SWO makes no medical claims',
  },
  {
    pattern:
      /\b\d[\d,.]*\s?[kKmM]?\+?\s+(active\s+)?(users|athletes|lifters|members|downloads|people|gym-goers)\b/i,
    reason: 'no adoption figures exist to cite',
  },
  {
    pattern: /\b(trusted\s+by|endorsed\s+by|featured\s+in|as\s+seen\s+(?:on|in)|testimonial)\b/i,
    reason: 'no endorsements or testimonials exist',
  },
  {
    pattern:
      /\b(doctor|physician|coach|expert|trainer)s?[\s-](approved|recommended|endorsed)\b|\brecommended\s+by\s+(doctors|physicians|coaches|experts)\b/i,
    reason: 'no professional endorsement exists',
  },
];

/** A match preceded closely by a negation is a disclaimer, not a claim. */
const NEGATION =
  /\b(not|no|never|cannot|can't|without|doesn't|does\s+not|don't|do\s+not|isn't|is\s+not)\b/i;
const NEGATION_WINDOW = 40;

export function findUnsupportedClaims(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, reason } of UNSUPPORTED_CLAIMS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const before = text.slice(Math.max(0, match.index - NEGATION_WINDOW), match.index);
    if (NEGATION.test(before)) continue;
    // The bare word "proven" would just repeat "clinically proven".
    if (pattern.source === '\\bproven\\b' && found.some((entry) => /proven/i.test(entry))) continue;
    found.push(`"${match[0]}" (${reason})`);
  }
  return found;
}

function text(min: number, max: number) {
  return z
    .string({ error: fieldError('text') })
    .trim()
    .min(min, `must be at least ${min} characters`)
    .max(max, `must be at most ${max} characters`)
    .superRefine((value, ctx) => {
      for (const claim of findUnsupportedClaims(value)) {
        ctx.addIssue({
          code: 'custom',
          message: `makes an unsupported claim: ${claim}. Remove it or reword as an explanation rather than a promise`,
          input: value,
        });
      }
    });
}

function id() {
  return z
    .string({ error: fieldError('text') })
    .regex(KEBAB_CASE, 'must be lower-case kebab-case, e.g. "how-it-works"');
}

function object<T extends z.ZodRawShape>(shape: T) {
  return z.strictObject(shape, { error: fieldError('an object') });
}

function list<T extends z.ZodType>(item: T, min: number, max: number) {
  return z
    .array(item, { error: fieldError('a list') })
    .min(min, `must contain at least ${min} item${min === 1 ? '' : 's'}`)
    .max(max, `must contain at most ${max} items`);
}

/** Internal path, in-page anchor or https URL. Anything else is not a real destination. */
export const href = z.string({ error: fieldError('text') }).superRefine((value, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: 'custom', message, input: value });

  if (value.trim() === '') return fail('is empty. Provide a real destination');
  if (value !== value.trim() || /\s/.test(value)) return fail('must not contain whitespace');
  if (value === '#') return fail('is a placeholder "#". Link to a real section id such as "#faq"');
  if (/^javascript:/i.test(value)) return fail('uses a javascript: URL, which is not allowed');
  if (/^(mailto|tel):/i.test(value)) {
    return fail(
      'is a mailto:/tel: contact link. Contact channels must be confirmed by the project owner before they are added',
    );
  }
  if (value.startsWith('#')) {
    if (!KEBAB_CASE.test(value.slice(1))) return fail('is not a valid in-page anchor like "#faq"');
    return;
  }
  if (value.startsWith('//'))
    return fail('is protocol-relative. Use "/path" or a full https:// URL');
  if (value.startsWith('/')) return;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return fail('is not a valid link. Use "#section-id", "/path" or "https://…"');
  }
  if (url.protocol !== 'https:') return fail(`must use https:// (received ${url.protocol}//)`);
  if (PLACEHOLDER_HOSTS.has(url.hostname)) {
    return fail(`points at placeholder host "${url.hostname}", which is not a real destination`);
  }
});

const link = object({ label: text(2, 40), href });

const cta = object({ label: text(2, 40), href });

/** Only generated, optimised assets under /images/ may be referenced. */
const imageSrc = z
  .string({ error: fieldError('text') })
  .regex(
    /^\/images\/[a-z0-9][a-z0-9/_-]*\.(webp|avif|png|jpe?g)$/,
    'must be an optimised asset path such as "/images/product/exercise-card-800.webp"',
  );

/**
 * The pipeline names every output `<base>-<width>.<ext>`, so one variant's path
 * can be rewritten into another's. Keeping the extra widths in the content (and
 * checking each file exists in `npm run validate:content`) means a `srcSet` is
 * data the validator can verify, not a filename guessed at render time.
 */
export function variantSrc(src: string, width: number): string {
  return src.replace(/-\d+(\.[a-z0-9]+)$/i, `-${width}$1`);
}

const productImage = object({
  src: imageSrc,
  /** Smaller generated widths of the same image, for a srcSet. */
  responsiveWidths: list(
    z
      .number({ error: fieldError('a number') })
      .int()
      .positive(),
    1,
    3,
  ).optional(),
  alt: text(20, 200).refine(
    (value) => !/^(image|picture|screenshot|photo)\s+of\b/i.test(value),
    'should describe what the image shows, not start with "image of" / "screenshot of"',
  ),
  width: z
    .number({ error: fieldError('a number') })
    .int('must be a whole number of pixels')
    .positive('must be positive'),
  height: z
    .number({ error: fieldError('a number') })
    .int('must be a whole number of pixels')
    .positive('must be positive'),
  caption: text(10, 160).optional(),
});

const hero = object({
  eyebrow: text(2, 40).optional(),
  headline: text(10, 90),
  supportingCopy: text(30, 280),
  primaryCta: cta,
  secondaryCta: cta.optional(),
  preview: productImage,
}).superRefine((value, ctx) => {
  if (value.secondaryCta && value.secondaryCta.href === value.primaryCta.href) {
    ctx.addIssue({
      code: 'custom',
      path: ['secondaryCta', 'href'],
      message:
        'duplicates the primary CTA destination. Competing buttons should do different things',
      input: value.secondaryCta.href,
    });
  }
});

/**
 * Header navigation. Kept in content, not in the header component, so the links
 * go through the same anchor check as everything else.
 */
const nav = object({
  /** Visible product name in the header. */
  brand: text(2, 40),
  links: list(link, 2, 6),
  cta: cta,
});

const problem = object({
  heading: text(5, 80),
  body: text(30, 400),
  points: list(text(10, 160), 1, 5).optional(),
});

const howItWorks = object({
  heading: text(5, 80),
  intro: text(20, 240).optional(),
  /**
   * The word shown above each step's title. These are reader-facing copy, not
   * chrome, so they live in content rather than in the component (CONTENT-03).
   */
  stageLabels: object({
    input: text(3, 40),
    analysis: text(3, 40),
    guidance: text(3, 40),
  }),
  steps: list(
    object({
      id: id(),
      stage: z.enum(['input', 'analysis', 'guidance'], {
        error: 'must be "input", "analysis" or "guidance"',
      }),
      title: text(3, 60),
      description: text(20, 240),
    }),
    3,
    5,
  ),
}).superRefine((value, ctx) => {
  for (const stage of ['input', 'analysis', 'guidance'] as const) {
    if (!value.steps.some((step) => step.stage === stage)) {
      ctx.addIssue({
        code: 'custom',
        path: ['steps'],
        message: `needs at least one "${stage}" step: the flow is inputs → analysis → guidance`,
        input: value.steps,
      });
    }
  }
});

const WORKOUT_STATES = ['green', 'amber', 'red'] as const;

const statusExplanation = object({
  state: z.enum(WORKOUT_STATES, { error: 'must be "green", "amber" or "red"' }),
  label: text(2, 40),
  meaning: text(20, 240),
  /** Rationale and action sit beside the state: colour is never the explanation. */
  exampleRationale: text(20, 300),
  suggestedAction: text(10, 200),
});

const statuses = list(statusExplanation, 3, 3).superRefine((value, ctx) => {
  for (const state of WORKOUT_STATES) {
    const count = value.filter((entry) => entry.state === state).length;
    if (count !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: `must contain "${state}" exactly once (found ${count})`,
        input: value,
      });
    }
  }
});

/**
 * Heading copy for the two sections whose body is a list (`statuses`,
 * `features`). Kept beside the list rather than inside it so each item stays a
 * single, repeatable shape.
 */
const sectionIntro = object({ heading: text(5, 80), intro: text(20, 320) });

const statusSection = sectionIntro.extend({
  /** Prefix in front of each status's suggested action. Reader-facing copy. */
  actionLabel: text(3, 40),
  /** A real screenshot showing more than one state, as supporting evidence. */
  image: productImage.optional(),
});

const feature = object({
  id: id(),
  heading: text(5, 80),
  description: text(30, 320),
  bullets: list(text(5, 140), 1, 4).optional(),
  image: productImage,
  imageSide: z.enum(['start', 'end'], { error: 'must be "start" or "end"' }),
});

const framework = object({
  id: id(),
  name: text(2, 60),
  /** What the published framework is, in general. Not a statement about SWO. */
  concept: text(30, 400),
  /** What SWO itself does. Kept separate so the two are never blurred. */
  swoImplementation: text(30, 400),
  evidenceStatus: z.enum(['framework-description-only', 'sourced'], {
    error: 'must be "framework-description-only" or "sourced"',
  }),
  sources: list(object({ label: text(3, 120), href }), 0, 5).optional(),
}).superRefine((value, ctx) => {
  if (value.evidenceStatus === 'sourced' && (value.sources?.length ?? 0) === 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['sources'],
      message:
        'is required when evidenceStatus is "sourced". Add the real source, or change the status to "framework-description-only"',
      input: value.sources,
    });
  }
  for (const [index, source] of (value.sources ?? []).entries()) {
    if (!source.href.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['sources', index, 'href'],
        message: 'a source must be an external https:// URL',
        input: source.href,
      });
    }
  }
});

const methodology = object({
  heading: text(5, 80),
  intro: text(20, 320),
  /** Label over the published-concept half of a framework card. */
  conceptLabel: text(3, 40),
  /** Label over the "what this product does with it" half. */
  implementationLabel: text(3, 40),
  /**
   * Shown on a framework card that cites no source. This is an evidence
   * statement, so it is validated content and cannot be dropped by editing a
   * component.
   */
  unsourcedNotice: text(20, 240),
  frameworks: list(framework, 1, 4),
  disclaimer: text(30, 400),
});

/**
 * Who the product is for. `points` are concrete things that audience can do,
 * which keeps the section from drifting into invented customer stories: there
 * is no field for a testimonial, a name or a number of users.
 */
const audiences = object({
  heading: text(5, 80),
  intro: text(20, 320),
  groups: list(
    object({
      id: id(),
      name: text(3, 60),
      description: text(30, 320),
      points: list(text(10, 160), 1, 4).optional(),
    }),
    2,
    3,
  ),
  image: productImage.optional(),
});

/** Closing call to action. One destination only; it must be a real section. */
const finalCta = object({ heading: text(5, 80), body: text(20, 280), cta: cta });

const faqItem = object({ id: id(), question: text(10, 120), answer: text(20, 600) });

const footer = object({
  tagline: text(5, 120).optional(),
  linkGroups: list(object({ heading: text(2, 40), links: list(link, 1, 6) }), 1, 4),
  legalNote: text(20, 320),
});

const meta = object({ title: text(10, 70), description: text(50, 160) });

function duplicates(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

export const siteContentSchema = object({
  meta,
  nav,
  hero,
  problem,
  howItWorks,
  statusSection,
  statuses,
  featureSection: sectionIntro,
  features: list(feature, 1, 6),
  methodology,
  audiences,
  faqSection: sectionIntro,
  faq: list(faqItem, 3, 10),
  finalCta,
  footer,
}).superRefine((content, ctx) => {
  const checkUnique = (path: Array<string | number>, values: string[], label: string) => {
    for (const value of new Set(duplicates(values))) {
      ctx.addIssue({
        code: 'custom',
        path,
        message: `has a duplicate ${label} "${value}". Each must be unique`,
        input: value,
      });
    }
  };
  checkUnique(
    ['howItWorks', 'steps'],
    content.howItWorks.steps.map((s) => s.id),
    'id',
  );
  checkUnique(
    ['features'],
    content.features.map((f) => f.id),
    'id',
  );
  checkUnique(
    ['methodology', 'frameworks'],
    content.methodology.frameworks.map((f) => f.id),
    'id',
  );
  checkUnique(
    ['faq'],
    content.faq.map((f) => f.id),
    'id',
  );
  checkUnique(
    ['faq'],
    content.faq.map((f) => f.question.toLowerCase()),
    'question',
  );
  checkUnique(
    ['audiences', 'groups'],
    content.audiences.groups.map((g) => g.id),
    'id',
  );
  checkUnique(
    ['nav', 'links'],
    content.nav.links.map((l) => l.href),
    'destination',
  );

  // In-page anchors must point at a section that will actually exist.
  const anchorTargets: Array<{ path: Array<string | number>; href: string }> = [
    ...content.nav.links.map((l, i) => ({ path: ['nav', 'links', i, 'href'], href: l.href })),
    { path: ['nav', 'cta', 'href'], href: content.nav.cta.href },
    { path: ['hero', 'primaryCta', 'href'], href: content.hero.primaryCta.href },
    ...(content.hero.secondaryCta
      ? [{ path: ['hero', 'secondaryCta', 'href'], href: content.hero.secondaryCta.href }]
      : []),
    { path: ['finalCta', 'cta', 'href'], href: content.finalCta.cta.href },
    ...content.footer.linkGroups.flatMap((group, g) =>
      group.links.map((l, i) => ({
        path: ['footer', 'linkGroups', g, 'links', i, 'href'],
        href: l.href,
      })),
    ),
  ];
  for (const target of anchorTargets) {
    if (!target.href.startsWith('#')) continue;
    const section = target.href.slice(1);
    if (!(SECTION_IDS as readonly string[]).includes(section)) {
      ctx.addIssue({
        code: 'custom',
        path: target.path,
        message: `anchor "${target.href}" matches no page section. Valid anchors: ${SECTION_IDS.map((s) => `#${s}`).join(', ')}`,
        input: target.href,
      });
    }
  }
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type ProductImage = z.infer<typeof productImage>;
export type StatusExplanation = z.infer<typeof statusExplanation>;
export type Feature = z.infer<typeof feature>;
export type Framework = z.infer<typeof framework>;
export type FaqItem = z.infer<typeof faqItem>;
export type NavContent = z.infer<typeof nav>;
export type Cta = z.infer<typeof cta>;

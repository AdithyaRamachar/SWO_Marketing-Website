/**
 * npm run validate:content [-- --file <path>]
 *
 * Validates the site content against the Zod schema (src/content/schema.ts)
 * and then checks the things a pure schema cannot: every referenced image
 * exists under public/ and its declared width/height match the real file.
 *
 * Exits non-zero on any problem, which is what makes `npm run build` refuse to
 * ship invalid content.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { variantSrc } from '../src/content/schema.ts';
import { validateSiteContent } from '../src/content/validate.ts';
import type { SiteContent } from '../src/content/schema.ts';

const root = path.join(import.meta.dirname, '..');
const flag = process.argv.indexOf('--file');
const file = flag >= 0 ? (process.argv[flag + 1] ?? '') : 'src/content/site-content.json';

interface Problem {
  path: string;
  message: string;
}

function collectImages(content: SiteContent) {
  return [
    { path: 'hero.preview', image: content.hero.preview },
    ...(content.statusSection.image
      ? [{ path: 'statusSection.image', image: content.statusSection.image }]
      : []),
    ...content.features.map((feature, index) => ({
      path: `features[${index}].image`,
      image: feature.image,
    })),
    ...(content.audiences.image
      ? [{ path: 'audiences.image', image: content.audiences.image }]
      : []),
  ];
}

async function checkImages(content: SiteContent): Promise<Problem[]> {
  const problems: Problem[] = [];
  for (const { path: where, image } of collectImages(content)) {
    const onDisk = path.join(root, 'public', image.src);
    if (!existsSync(onDisk)) {
      problems.push({
        path: `${where}.src`,
        message: `file not found: public${image.src}. Generate it with the optimize-web-images skill`,
      });
      continue;
    }
    const meta = await sharp(onDisk).metadata();
    if (meta.width !== image.width || meta.height !== image.height) {
      problems.push({
        path: `${where}`,
        message: `declared ${image.width}x${image.height} but public${image.src} is ${meta.width}x${meta.height}`,
      });
    }

    // Every srcSet candidate must exist too, and be the width it claims.
    for (const width of image.responsiveWidths ?? []) {
      const variant = variantSrc(image.src, width);
      if (variant === image.src) {
        problems.push({
          path: `${where}.responsiveWidths`,
          message: `${width} is the width already in "${image.src}"; list only the other generated widths`,
        });
        continue;
      }
      const variantOnDisk = path.join(root, 'public', variant);
      if (!existsSync(variantOnDisk)) {
        problems.push({
          path: `${where}.responsiveWidths`,
          message: `file not found: public${variant}. Generate that width with the optimize-web-images skill, or remove ${width}`,
        });
        continue;
      }
      const variantMeta = await sharp(variantOnDisk).metadata();
      if (variantMeta.width !== width) {
        problems.push({
          path: `${where}.responsiveWidths`,
          message: `public${variant} is ${variantMeta.width}px wide, not ${width}px`,
        });
      }
    }
  }
  return problems;
}

const absolute = path.resolve(root, file);
if (!existsSync(absolute)) {
  console.error(`validate:content failed: ${file} not found`);
  process.exit(1);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(absolute, 'utf8'));
} catch (error) {
  console.error(`validate:content failed: ${file} is not valid JSON (${(error as Error).message})`);
  process.exit(1);
}

const result = validateSiteContent(raw);
if (!result.ok) {
  console.error(`INVALID: ${file} has ${result.issues.length} content issue(s):\n`);
  for (const issue of result.issues) console.error(`  ${issue.path}: ${issue.message}`);
  process.exit(1);
}

const problems = await checkImages(result.data);
if (problems.length > 0) {
  console.error(
    `INVALID: ${file} passed the schema but has ${problems.length} asset problem(s):\n`,
  );
  for (const problem of problems) console.error(`  ${problem.path}: ${problem.message}`);
  process.exit(1);
}

const c = result.data;
console.log(`VALID: ${file}`);
console.log(
  `  hero 1 · steps ${c.howItWorks.steps.length} · statuses ${c.statuses.length} · features ${c.features.length}` +
    ` · frameworks ${c.methodology.frameworks.length} · faq ${c.faq.length} · images checked ${collectImages(c).length}`,
);

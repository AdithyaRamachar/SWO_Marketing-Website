import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import sample from '../src/content/site-content.json';
import { findUnsupportedClaims, href } from '../src/content/schema.ts';
import {
  ContentValidationError,
  assertValidSiteContent,
  formatIssues,
  formatPath,
  validateSiteContent,
} from '../src/content/validate.ts';
import type { ContentIssue } from '../src/content/validate.ts';

const ROOT = path.join(import.meta.dirname, '..');

// Tests damage arbitrary JSON (delete a field, assign the wrong type), which no
// narrow type allows. The one deliberate `any` lives here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loose = any;

/** Deep-clone the sample, let the test damage it, and return the result. */
function mutate(change: (content: Loose) => void): unknown {
  const copy = structuredClone(sample) as Loose;
  change(copy);
  return copy;
}

function issuesFor(input: unknown): ContentIssue[] {
  const result = validateSiteContent(input);
  if (result.ok) throw new Error('expected the content to be rejected');
  return result.issues;
}

function issueAt(issues: ContentIssue[], contentPath: string): ContentIssue {
  const found = issues.find((issue) => issue.path === contentPath);
  if (!found) {
    throw new Error(`no issue at ${contentPath}. Got: ${issues.map((i) => i.path).join(', ')}`);
  }
  return found;
}

describe('valid content', () => {
  it('accepts the sample dataset', () => {
    const result = validateSiteContent(sample);
    expect(result.ok).toBe(true);
  });

  it('returns typed data matching the input', () => {
    const result = validateSiteContent(sample);
    if (!result.ok) throw new Error('sample should be valid');
    expect(result.data.hero.headline).toBe(sample.hero.headline);
    expect(result.data.statuses.map((s) => s.state).sort()).toEqual(['amber', 'green', 'red']);
  });

  it('assertValidSiteContent returns data for valid input', () => {
    expect(assertValidSiteContent(sample).faq).toHaveLength(sample.faq.length);
  });

  it('allows optional fields to be omitted', () => {
    const input = mutate((c) => {
      delete c.hero.eyebrow;
      delete c.hero.secondaryCta;
      delete c.problem.points;
      delete c.footer.tagline;
    });
    expect(validateSiteContent(input).ok).toBe(true);
  });

  it('trims surrounding whitespace rather than rejecting it', () => {
    const result = validateSiteContent(
      mutate((c) => (c.hero.headline = `   ${c.hero.headline}   `)),
    );
    if (!result.ok) throw new Error('should be valid');
    expect(result.data.hero.headline).toBe(sample.hero.headline);
  });
});

describe('missing required fields', () => {
  it('names the missing field and says it is required', () => {
    const issues = issuesFor(mutate((c) => delete c.hero.headline));
    expect(issueAt(issues, 'hero.headline').message).toBe('is required');
  });

  it('reports a missing whole section', () => {
    const issues = issuesFor(mutate((c) => delete c.methodology));
    expect(issueAt(issues, 'methodology').message).toBe('is required');
  });

  it('reports every missing field, not just the first', () => {
    const issues = issuesFor(
      mutate((c) => {
        delete c.hero.headline;
        delete c.hero.supportingCopy;
        delete c.faq[0].answer;
      }),
    );
    const paths = issues.map((i) => i.path);
    expect(paths).toEqual(
      expect.arrayContaining(['hero.headline', 'hero.supportingCopy', 'faq[0].answer']),
    );
  });

  it('rejects an entirely empty object with a path for each section', () => {
    const paths = issuesFor({}).map((i) => i.path);
    for (const section of [
      'meta',
      'hero',
      'problem',
      'howItWorks',
      'statuses',
      'features',
      'methodology',
      'faq',
      'footer',
    ]) {
      expect(paths).toContain(section);
    }
  });

  it('rejects content that is not an object at all', () => {
    expect(issuesFor(null)[0]?.path).toBe('(root)');
    expect(issuesFor('hello')[0]?.message).toContain('must be an object');
  });
});

describe('invalid types and ranges', () => {
  it('says what was received when the type is wrong', () => {
    const issues = issuesFor(mutate((c) => (c.hero.headline = 42)));
    expect(issueAt(issues, 'hero.headline').message).toBe('must be text (received a number)');
  });

  it('rejects a string where a list is expected', () => {
    const issues = issuesFor(mutate((c) => (c.faq = 'none')));
    expect(issueAt(issues, 'faq').message).toBe('must be a list (received a string)');
  });

  it('rejects non-numeric image dimensions', () => {
    const issues = issuesFor(mutate((c) => (c.hero.preview.width = '800')));
    expect(issueAt(issues, 'hero.preview.width').message).toContain('must be a number');
  });

  it('rejects fractional or non-positive image dimensions', () => {
    expect(
      issueAt(issuesFor(mutate((c) => (c.hero.preview.height = 10.5))), 'hero.preview.height')
        .message,
    ).toContain('whole number');
    expect(
      issueAt(issuesFor(mutate((c) => (c.hero.preview.height = 0))), 'hero.preview.height').message,
    ).toContain('positive');
  });

  it('enforces length limits with the limit in the message', () => {
    expect(
      issueAt(issuesFor(mutate((c) => (c.hero.headline = 'Short'))), 'hero.headline').message,
    ).toBe('must be at least 10 characters');
    expect(
      issueAt(issuesFor(mutate((c) => (c.hero.headline = 'x'.repeat(200)))), 'hero.headline')
        .message,
    ).toBe('must be at most 90 characters');
  });

  it('rejects an unknown enum value', () => {
    const issues = issuesFor(mutate((c) => (c.statuses[2].state = 'blue')));
    expect(issueAt(issues, 'statuses[2].state').message).toBe('must be "green", "amber" or "red"');
  });

  it('enforces list size limits', () => {
    expect(issueAt(issuesFor(mutate((c) => (c.faq = c.faq.slice(0, 2)))), 'faq').message).toBe(
      'must contain at least 3 items',
    );
  });

  it('rejects a malformed id', () => {
    const issues = issuesFor(mutate((c) => (c.faq[0].id = 'Not Kebab')));
    expect(issueAt(issues, 'faq[0].id').message).toContain('kebab-case');
  });
});

describe('unknown fields are rejected, never silently dropped', () => {
  it('flags a misspelt field name', () => {
    const issues = issuesFor(
      mutate((c) => {
        c.hero.headlne = 'typo';
      }),
    );
    const issue = issueAt(issues, 'hero');
    expect(issue.message).toContain('"headlne"');
    expect(issue.message).toContain('rejected, not ignored');
  });

  it('flags an unexpected top-level section', () => {
    const issues = issuesFor(mutate((c) => (c.testimonials = [{ quote: 'Great!' }])));
    expect(issueAt(issues, '(root)').message).toContain('"testimonials"');
  });
});

describe('links', () => {
  const cases: Array<[string, string, string]> = [
    ['placeholder hash', '#', 'placeholder "#"'],
    ['empty string', '', 'is empty'],
    ['javascript URL', 'javascript:alert(1)', 'javascript:'],
    ['mailto', 'mailto:help@swo.app', 'mailto:/tel:'],
    ['tel', 'tel:+10000000', 'mailto:/tel:'],
    ['plain http', 'http://swo.example.org/x', 'https://'],
    ['example host', 'https://example.com/signup', 'placeholder host "example.com"'],
    ['localhost', 'https://localhost/x', 'placeholder host "localhost"'],
    ['whitespace', '/a b', 'whitespace'],
    ['protocol-relative', '//evil.test/x', 'protocol-relative'],
    ['bare word', 'signup', 'not a valid link'],
    ['bad anchor', '#Not_An_Anchor', 'valid in-page anchor'],
  ];

  it.each(cases)('rejects %s', (_label, value, fragment) => {
    const issues = issuesFor(mutate((c) => (c.hero.primaryCta.href = value)));
    expect(issueAt(issues, 'hero.primaryCta.href').message).toContain(fragment);
  });

  it.each(['#faq', '/privacy', 'https://github.com/AdithyaRamachar/SWO_Marketing-Website'])(
    'accepts %s',
    (value) => {
      expect(href.safeParse(value).success).toBe(true);
    },
  );

  it('rejects an in-page anchor that matches no section', () => {
    const issues = issuesFor(mutate((c) => (c.footer.linkGroups[0].links[0].href = '#pricing')));
    const message = issueAt(issues, 'footer.linkGroups[0].links[0].href').message;
    expect(message).toContain('matches no page section');
    expect(message).toContain('#faq');
  });

  it('rejects competing CTAs that go to the same place', () => {
    const issues = issuesFor(mutate((c) => (c.hero.secondaryCta.href = c.hero.primaryCta.href)));
    expect(issueAt(issues, 'hero.secondaryCta.href').message).toContain(
      'duplicates the primary CTA',
    );
  });

  it('rejects a framework source that is not an external https URL', () => {
    const issues = issuesFor(
      mutate((c) => {
        c.methodology.frameworks[0].evidenceStatus = 'sourced';
        c.methodology.frameworks[0].sources = [{ label: 'Internal page', href: '/science' }];
      }),
    );
    expect(issueAt(issues, 'methodology.frameworks[0].sources[0].href').message).toContain(
      'external https://',
    );
  });
});

describe('images', () => {
  it('rejects a path outside /images/', () => {
    const issues = issuesFor(
      mutate((c) => (c.hero.preview.src = '/references/product-screenshots/exercise-card.png')),
    );
    expect(issueAt(issues, 'hero.preview.src').message).toContain('optimised asset path');
  });

  it('rejects a remote image URL', () => {
    const issues = issuesFor(mutate((c) => (c.hero.preview.src = 'https://cdn.test/x.webp')));
    expect(issueAt(issues, 'hero.preview.src').message).toContain('optimised asset path');
  });

  it('rejects alt text that is too short to describe anything', () => {
    const issues = issuesFor(mutate((c) => (c.hero.preview.alt = 'app')));
    expect(issueAt(issues, 'hero.preview.alt').message).toContain('at least 20 characters');
  });

  it('rejects alt text that starts with "Screenshot of"', () => {
    const issues = issuesFor(
      mutate((c) => (c.hero.preview.alt = 'Screenshot of the exercise card with suggestions')),
    );
    expect(issueAt(issues, 'hero.preview.alt').message).toContain(
      'should describe what the image shows',
    );
  });
});

describe('structure rules', () => {
  it('requires Green, Amber and Red each exactly once', () => {
    const issues = issuesFor(mutate((c) => (c.statuses[1].state = 'green')));
    const messages = issues.filter((i) => i.path === 'statuses').map((i) => i.message);
    expect(messages).toContain('must contain "green" exactly once (found 2)');
    expect(messages).toContain('must contain "amber" exactly once (found 0)');
  });

  it('requires the rationale and action beside every status', () => {
    const issues = issuesFor(
      mutate((c) => {
        delete c.statuses[0].exampleRationale;
        delete c.statuses[0].suggestedAction;
      }),
    );
    expect(issueAt(issues, 'statuses[0].exampleRationale').message).toBe('is required');
    expect(issueAt(issues, 'statuses[0].suggestedAction').message).toBe('is required');
  });

  it('requires both the concept and SWO implementation of a framework', () => {
    const issues = issuesFor(mutate((c) => delete c.methodology.frameworks[0].swoImplementation));
    expect(issueAt(issues, 'methodology.frameworks[0].swoImplementation').message).toBe(
      'is required',
    );
  });

  it('requires a source when a framework claims to be sourced', () => {
    const issues = issuesFor(
      mutate((c) => (c.methodology.frameworks[0].evidenceStatus = 'sourced')),
    );
    expect(issueAt(issues, 'methodology.frameworks[0].sources').message).toContain(
      'required when evidenceStatus is "sourced"',
    );
  });

  it('requires the flow inputs → analysis → guidance', () => {
    const issues = issuesFor(
      mutate(
        (c) =>
          (c.howItWorks.steps = c.howItWorks.steps.filter((s: Loose) => s.stage !== 'analysis')),
      ),
    );
    expect(issues.some((i) => i.message.includes('needs at least one "analysis" step'))).toBe(true);
  });

  it('rejects duplicate ids and duplicate FAQ questions', () => {
    const duplicateId = issuesFor(mutate((c) => (c.faq[1].id = c.faq[0].id)));
    expect(issueAt(duplicateId, 'faq').message).toContain('duplicate id "wearable"');

    const duplicateQuestion = issuesFor(
      mutate((c) => (c.faq[1].question = c.faq[0].question.toUpperCase())),
    );
    expect(issueAt(duplicateQuestion, 'faq').message).toContain('duplicate question');
  });
});

describe('unsupported claims are rejected', () => {
  const claims: Array<[string, string]> = [
    ['guarantee', 'SWO guarantees you will add 20 kg to your squat in a month, every single time.'],
    [
      'clinically proven',
      'The Green, Amber and Red system is clinically proven to work for lifters.',
    ],
    [
      'scientifically validated',
      'Our readiness engine is scientifically validated against elite athletes.',
    ],
    ['proven', 'This is a proven way to choose your working weight each day.'],
    ['injury prevention', 'SWO prevents injury by telling you when to stop training hard.'],
    ['reduces injury risk', 'Following SWO reduces the risk of injury across your training block.'],
    ['medical', 'SWO diagnoses overtraining so you can treat it before it starts.'],
    ['user counts', 'Join 10,000 lifters who already train smarter with Smart Workout Optimizer.'],
    ['endorsement', 'Trusted by serious lifters and coaches around the world every single day.'],
    [
      'professional endorsement',
      'The approach is coach-recommended and used in gyms everywhere you look.',
    ],
  ];

  it.each(claims)('rejects a %s claim', (_label, sentence) => {
    const issues = issuesFor(mutate((c) => (c.faq[0].answer = sentence)));
    expect(issueAt(issues, 'faq[0].answer').message).toContain('unsupported claim');
  });

  it('applies the guard to every text field, not just FAQ answers', () => {
    const issues = issuesFor(
      mutate(
        (c) =>
          (c.hero.supportingCopy =
            'Clinically proven, guaranteed results for every lifter who tries SWO.'),
      ),
    );
    expect(issueAt(issues, 'hero.supportingCopy').message).toContain('unsupported claim');
  });

  it('allows the same words inside a disclaimer ("does not diagnose")', () => {
    expect(
      findUnsupportedClaims('SWO does not diagnose, treat or prevent injury or illness.'),
    ).toEqual([]);
    expect(findUnsupportedClaims('It has not been clinically validated.')).toEqual([]);
    expect(findUnsupportedClaims('We cannot guarantee any particular result.')).toEqual([]);
  });

  it('still flags the claim when the negation is far away', () => {
    expect(
      findUnsupportedClaims(
        'Nothing here is hidden. After years of testing, SWO is clinically proven to work.',
      ),
    ).not.toEqual([]);
  });

  it('does not flag ordinary product copy', () => {
    for (const text of [
      'SWO turns your sleep quality and fatigue into exercise-level guidance.',
      'Each exercise gets a status, the reason for it and a suggested action.',
      "Optimal zone: the exercise sits within the app's defined training range.",
    ]) {
      expect(findUnsupportedClaims(text)).toEqual([]);
    }
  });
});

describe('error reporting', () => {
  it('formats paths with indices and dots', () => {
    expect(formatPath(['faq', 2, 'answer'])).toBe('faq[2].answer');
    expect(formatPath(['hero', 'primaryCta', 'href'])).toBe('hero.primaryCta.href');
    expect(formatPath([])).toBe('(root)');
  });

  it('formats a readable multi-line report', () => {
    const issues = issuesFor(mutate((c) => delete c.hero.headline));
    expect(formatIssues(issues)).toContain('hero.headline: is required');
  });

  it('assertValidSiteContent throws a ContentValidationError carrying every issue', () => {
    const bad = mutate((c) => {
      delete c.hero.headline;
      c.hero.primaryCta.href = '#';
    });
    try {
      assertValidSiteContent(bad);
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ContentValidationError);
      const { issues, message } = error as ContentValidationError;
      expect(issues.length).toBeGreaterThanOrEqual(2);
      expect(message).toContain('hero.headline');
      expect(message).toContain('hero.primaryCta.href');
    }
  });

  it('never returns partial data for invalid content', () => {
    const result = validateSiteContent(mutate((c) => delete c.hero.headline));
    expect(result.ok).toBe(false);
    expect('data' in result).toBe(false);
  });
});

describe('validate:content command', () => {
  function run(file?: string): { status: number; output: string } {
    try {
      const output = execFileSync(
        process.execPath,
        [path.join('scripts', 'validate-content.ts'), ...(file ? ['--file', file] : [])],
        { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      return { status: 0, output };
    } catch (error) {
      const failure = error as { status: number; stdout: string; stderr: string };
      return { status: failure.status, output: `${failure.stdout}${failure.stderr}` };
    }
  }

  function writeTemp(content: unknown): string {
    const file = path.join(mkdtempSync(path.join(tmpdir(), 'swo-content-')), 'content.json');
    writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
    return file;
  }

  it('passes for the real content, including image files and sizes', () => {
    const result = run();
    expect(result.status).toBe(0);
    expect(result.output).toContain('VALID');
    expect(result.output).toContain('images checked 3');
  });

  it('exits non-zero and names the field for schema errors', () => {
    const result = run(writeTemp(mutate((c) => delete c.hero.headline)));
    expect(result.status).toBe(1);
    expect(result.output).toContain('hero.headline: is required');
  });

  it('exits non-zero when a referenced image file does not exist', () => {
    const result = run(
      writeTemp(mutate((c) => (c.hero.preview.src = '/images/product/does-not-exist-800.webp'))),
    );
    expect(result.status).toBe(1);
    expect(result.output).toContain('file not found');
  });

  it('exits non-zero when declared image dimensions do not match the file', () => {
    const result = run(writeTemp(mutate((c) => (c.hero.preview.width = 801))));
    expect(result.status).toBe(1);
    expect(result.output).toContain('declared 801x1778');
  });

  it('exits non-zero for malformed JSON', () => {
    const result = run(writeTemp('{ not json'));
    expect(result.status).toBe(1);
    expect(result.output).toContain('not valid JSON');
  });
});

describe('claim guard noise', () => {
  it('reports "clinically proven" once, not again as the bare word "proven"', () => {
    const found = findUnsupportedClaims('This approach is clinically proven for lifters.');
    expect(found).toHaveLength(1);
    expect(found[0]).toContain('clinically proven');
  });

  it('still flags a bare "proven" on its own', () => {
    expect(findUnsupportedClaims('A proven method for choosing weights.')).toHaveLength(1);
  });
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import rawContent from './content/site-content.json';
import { assertValidSiteContent } from './content/validate.ts';
import { MarketingPage } from './page/MarketingPage.tsx';
import './styles/index.css';

/**
 * The single validation boundary for the site.
 *
 * `assertValidSiteContent` throws on invalid content, so the page cannot render
 * partly-valid copy. `npm run build` runs `validate:content` first, which means
 * this throw is a backstop, not the primary gate.
 */
const content = assertValidSiteContent(rawContent);

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from index.html');

document.title = content.meta.title;
document
  .querySelector('meta[name="description"]')
  ?.setAttribute('content', content.meta.description);

createRoot(container).render(
  <StrictMode>
    <MarketingPage content={content} />
  </StrictMode>,
);

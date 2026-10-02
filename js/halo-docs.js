'use strict';

// MiniDocs uses one reader URL with ?docSlug=; static Pages needs a URL per document.
document.addEventListener('DOMContentLoaded', () => {
  const navigation = document.querySelector('.halo-docs-nav');
  const current = new URL(window.location.href);
  const slug = current.searchParams.get('docSlug');
  if (!navigation || !slug || !current.pathname.includes('/docs/view/')) return;
  const link = [...navigation.querySelectorAll('a[data-halo-doc-slug]')].find(item =>
    item.dataset.haloDocSlug === slug || item.dataset.haloDocId === slug);
  if (!link) return;
  const target = new URL(link.getAttribute('href'), current);
  if (target.origin !== current.origin) return;
  current.searchParams.delete('docSlug');
  target.search = current.search;
  target.hash = current.hash;
  window.location.replace(target.href);
});

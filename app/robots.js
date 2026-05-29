// Generates /robots.txt — blocks ALL search engine crawlers from the entire site.
// This site is private and must never appear in search results.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}

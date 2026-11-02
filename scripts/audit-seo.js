const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('\n================== SEO AUDIT REPORT ==================');
    console.log('HTTP Status:', res.statusCode);
    console.log('\n[1] Security & HSTS Headers:');
    console.log('  Strict-Transport-Security:', res.headers['strict-transport-security'] || 'MISSING');
    console.log('  X-Content-Type-Options:', res.headers['x-content-type-options'] || 'MISSING');
    console.log('  X-Frame-Options:', res.headers['x-frame-options'] || 'MISSING');
    console.log('  Referrer-Policy:', res.headers['referrer-policy'] || 'MISSING');

    console.log('\n[2] Canonical Link:');
    const canonicalMatch = data.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
    console.log('  Canonical:', canonicalMatch ? canonicalMatch[0] : 'MISSING');

    console.log('\n[3] Hreflang Tags:');
    const hreflangMatches = data.match(/<link[^>]*hreflang=[^>]*>/gi);
    console.log('  Tags:', hreflangMatches || 'MISSING');

    console.log('\n[4] Meta Description:');
    const metaDescMatch = data.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i);
    if (metaDescMatch) {
      console.log('  Length:', metaDescMatch[1].length, 'characters');
      console.log('  Content:', metaDescMatch[1]);
    } else {
      console.log('  Status: MISSING');
    }

    console.log('\n[5] Schema.org JSON-LD Structured Data:');
    const jsonLdMatch = data.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const parsed = JSON.parse(jsonLdMatch[1]);
        console.log('  Valid JSON-LD:', true);
        console.log('  Graph Types:', parsed['@graph'].map(g => g['@type']).join(', '));
      } catch (e) {
        console.log('  JSON-LD Parse Error:', e.message);
      }
    } else {
      console.log('  Status: MISSING');
    }

    console.log('\n[6] Heading Structure (H1 -> H2 -> H3):');
    const h1s = [...data.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    const h2s = [...data.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
    const h3s = [...data.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

    console.log('  H1 (' + h1s.length + '):', h1s);
    console.log('  H2 (' + h2s.length + '):', h2s);
    console.log('  H3 (' + h3s.length + '):', h3s.slice(0, 8), '... (' + h3s.length + ' total)');

    console.log('\n======================================================\n');
  });
}).on('error', err => console.error('Fetch error:', err));

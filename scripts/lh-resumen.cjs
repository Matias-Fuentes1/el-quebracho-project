const r=require(require('path').resolve(process.argv[2]));const c=r.categories;
console.log(Object.entries(c).map(([k,v])=>k+': '+Math.round(v.score*100)).join(' | '));
const a=r.audits;console.log('LCP',a['largest-contentful-paint'].displayValue,'| CLS',a['cumulative-layout-shift'].displayValue,'| TBT',a['total-blocking-time'].displayValue,'| FCP',a['first-contentful-paint'].displayValue,'| SI',a['speed-index'].displayValue);
for(const [k,v] of Object.entries(a)){if(v.score!==null&&v.score<0.9&&!['informative','notApplicable','manual'].includes(v.scoreDisplayMode))console.log(' -',k,v.score,v.displayValue||'')}

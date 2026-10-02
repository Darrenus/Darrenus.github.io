import assert from 'node:assert/strict';
import { languageFromPath, localizedHref, withoutLocale } from '../src/i18n';
import { parseRoute } from '../src/routes';
import zh from '../content/resume.json';
import en from '../content/resume.en.json';
import papersZh from '../content/research.json';
import papersEn from '../content/research.en.json';
import blogZh from '../content/blog.json';
import blogEn from '../content/blog.en.json';
import profileEn from '../content/profile.en.json';
import { layoutPlaceLabels } from '../src/ui/earth-places';

for (const path of ['/', '/resume', '/research', '/blog', '/privacy', '/terms', '/ragent', ...zh.projects.map(p=>`/projects/${p.slug}`), ...blogZh.map(p=>`/blog/${p.slug}`)]) {
  const english = localizedHref(path,'en');
  assert.equal(languageFromPath(english),'en');
  assert.equal(withoutLocale(english),path);
  assert.deepEqual(parseRoute(english),parseRoute(path));
  assert.equal(localizedHref(english,'en'),english);
  assert.equal(localizedHref(english+'?q=test#section','zh'),path+'?q=test#section');
}
assert.equal(languageFromPath('/engineering'),'zh');
for(const link of ['/resume-en.pdf?v=1','/blog/ai-starts-working/image1.png','#main-content','mailto:hanserong@163.com','https://zenodo.org/records/23086434','//example.com']) assert.equal(localizedHref(link,'en'),link);
assert.equal(localizedHref('https://rong.bio/research','en'),'https://rong.bio/en/research');
for(const key of ['education','experience','projects','patents','awards','skillGroups'] as const) assert.deepEqual(en[key].map(x=>x.id),zh[key].map(x=>x.id),key);
for(let i=0;i<en.projects.length;i++) {
  assert.equal(en.projects[i].slug,zh.projects[i].slug);
  assert.deepEqual(en.projects[i].links.map(l=>l.url),zh.projects[i].links.map(l=>l.url));
}
assert.doesNotMatch(JSON.stringify(en),/[\u3400-\u9fff]|codeloop/);
assert.equal(profileEn.links.find(l=>l.id==='resume-en-pdf')?.status,'active');
assert.equal(papersEn.publications.length,papersZh.publications.length);
papersEn.publications.forEach((p,i)=>{
 assert.equal(p.id,papersZh.publications[i].id);
 assert.equal(p.publishedAt,papersZh.publications[i].publishedAt);
 assert.deepEqual(p.links,papersZh.publications[i].links);
 assert.match(p.status,/^Preprint/);
});
assert.doesNotMatch(JSON.stringify(papersEn),/[\u3400-\u9fff]/);
blogEn.forEach((p,i)=>{
 assert.equal(p.slug,blogZh[i].slug); assert.equal(p.publishedAt,blogZh[i].publishedAt);
 assert.deepEqual(p.blocks.map(b=>b.type),blogZh[i].blocks.map(b=>b.type));
 assert.doesNotMatch(JSON.stringify(p),/[\u3400-\u9fff]/);
});
// English callouts are wider. They must stay within the screen and avoid one another.
for(const width of [320,375,390,768,1440]) {
 const points = Array.from({length:12},(_,i)=>({id:String(i),x:width/2+(i%2 ? 12:-12),y:300+i*4,side:(i%2 ? 'right':'left') as 'right'|'left',rise:0}));
 const boxes=layoutPlaceLabels(points,width,844,96);
 for(const b of boxes){assert.ok(b.x>=0 && b.x+96<=width);assert.ok(b.y>=0 && b.y+44<=844);}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++) assert.ok(Math.abs(boxes[i].x-boxes[j].x)>=96 || Math.abs(boxes[i].y-boxes[j].y)>=44);
}
console.log('Language routes, unchanged records, English copy, assets and globe callouts passed');

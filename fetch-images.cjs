const fs = require('fs');
const https = require('https');

const API_KEY = 'N7MnghQ8XUUFOFUgo_-7DhpOjb8L_QoS739_zemktMU';
const raw = fs.readFileSync('src/data/recipes.ts', 'utf8');
const matches = [...raw.matchAll(/id:\s*'([^']+)',\s*\n\s*name:\s*'([^']+)'/g)];
const recipes = matches.map(m => ({ id: m[1], name: m[2] }));
console.log(`找到 ${recipes.length} 道菜\n`);

function fetchPhoto(name) {
  return new Promise((resolve, reject) => {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(name + ' 美食')}&per_page=1&client_id=${API_KEY}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // 检测限流
        if (res.statusCode === 403) {
          resolve({ ratelimited: true });
          return;
        }
        try {
          const j = JSON.parse(data);
          if (j.errors) {
            const msg = j.errors[0];
            if (msg.includes('Rate Limit')) {
              resolve({ ratelimited: true });
            } else {
              reject(new Error(msg));
            }
            return;
          }
          if (j.results && j.results.length > 0) {
            resolve({ url: j.results[0].urls.small, desc: j.results[0].alt_description || '' });
          } else {
            resolve(null);
          }
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const outFile = 'public/recipe-images.json';
  let results = {};
  if (fs.existsSync(outFile)) results = JSON.parse(fs.readFileSync(outFile, 'utf8'));

  let count = 0;
  const remaining = recipes.filter(r => !results[r.id]);
  console.log(`已有 ${Object.keys(results).length} 张，剩余 ${remaining.length} 道\n`);

  for (const r of remaining) {
    try {
      const photo = await fetchPhoto(r.name);
      if (photo && photo.ratelimited) {
        console.log(`⏳ 限流！等待 3 分钟...`);
        fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
        await wait(180000);
        // 重试
        const retry = await fetchPhoto(r.name);
        if (retry && !retry.ratelimited) {
          results[r.id] = retry;
          count++;
          console.log(`[${count}/${remaining.length}] ✅ ${r.name} (重试成功)`);
        } else if (retry && retry.ratelimited) {
          console.log(`❌ ${r.name} (重试仍限流，跳过)`);
        }
      } else if (photo) {
        results[r.id] = photo;
        count++;
        console.log(`[${count}/${remaining.length}] ✅ ${r.name}`);
      } else {
        console.log(`[${count}/${remaining.length}] ❌ ${r.name} (无结果)`);
      }
      await wait(3000); // 3秒间隔避免触发限流
    } catch (e) {
      console.error(`⚠️ ${r.name}: ${e.message}`);
      await wait(5000);
    }
    if (count % 10 === 0) fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  }

  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\n🎉 ${Object.keys(results).length}/${recipes.length} → ${outFile}`);
}

main().catch(console.error);

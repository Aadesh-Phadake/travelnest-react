/**
 * Redis Cache Performance Test
 * Run: node test-redis-performance.js
 */

const API_URL = 'https://travelnest-backend-gp5j.onrender.com';

async function measureRequest(label) {
    const start = Date.now();
    const res = await fetch(`${API_URL}/listings`);
    const data = await res.json();
    const duration = Date.now() - start;
    const count = Array.isArray(data) ? data.length : 0;
    return { label, duration, count, status: res.status };
}

async function run() {
    console.log('');
    console.log('==============================================');
    console.log('  TravelNest Redis Cache Performance Test');
    console.log('==============================================');
    console.log(`  API: ${API_URL}/listings`);
    console.log('');

    // Wake up server
    console.log('  Warming up server...');
    await fetch(`${API_URL}/`).catch(() => {});
    await new Promise(r => setTimeout(r, 2000));

    const results = [];

    console.log('');
    console.log('  Request 1: CACHE MISS (MongoDB)...');
    results.push(await measureRequest('1st - CACHE MISS'));
    console.log(`    -> ${results[0].duration}ms`);

    console.log('  Request 2: CACHE HIT (Redis)...');
    results.push(await measureRequest('2nd - CACHE HIT'));
    console.log(`    -> ${results[1].duration}ms`);

    console.log('  Request 3: CACHE HIT (Redis)...');
    results.push(await measureRequest('3rd - CACHE HIT'));
    console.log(`    -> ${results[2].duration}ms`);

    console.log('  Request 4: CACHE HIT (Redis)...');
    results.push(await measureRequest('4th - CACHE HIT'));
    console.log(`    -> ${results[3].duration}ms`);

    // Results
    console.log('');
    console.log('==============================================');
    console.log('  RESULTS');
    console.log('==============================================');
    console.log('');
    results.forEach(r => {
        console.log(`  ${r.label.padEnd(22)} | ${String(r.duration + 'ms').padEnd(8)} | ${r.count} listings`);
    });

    const miss = results[0].duration;
    const hitAvg = Math.round((results[1].duration + results[2].duration + results[3].duration) / 3);
    const speedup = miss > 0 ? ((miss - hitAvg) / miss * 100).toFixed(1) : 0;

    console.log('');
    console.log('==============================================');
    console.log(`  MongoDB (no cache):   ${miss}ms`);
    console.log(`  Redis (cached avg):   ${hitAvg}ms`);
    console.log(`  Speed improvement:    ${speedup}% faster with Redis`);
    console.log('==============================================');
    console.log('');
}

run().catch(err => console.error('Test failed:', err.message));

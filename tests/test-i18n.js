// i18n 字典完整性检查：t('...') 与 data-i18n* 用到的每个键都必须有英文翻译
// （键即中文原串，缺译会静默回落中文——本测试把它变成硬失败）
const fs = require('fs');
const html = fs.readFileSync('D:/computer/bagu-shanbei/八股闪背.html', 'utf8');
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';

// 1) 提取 I18N_EN 字典块
const dictStart = script.indexOf('const I18N_EN = {');
const dictEnd = script.indexOf('\n};', dictStart);
if(dictStart < 0 || dictEnd < 0){ console.error('FAIL: 找不到 I18N_EN 字典'); process.exit(1); }
const dictBlock = script.slice(dictStart, dictEnd);
const KEY = "'((?:[^'\\\\]|\\\\.)+)'\\s*:";
const dictKeys = new Set();
for(const m of dictBlock.matchAll(new RegExp(KEY, 'g'))){
  dictKeys.add(m[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'));
}

// 2) 收集使用中的键：t('...') 一参 + data-i18n/-ph/-title 属性
const used = new Set();
for(const m of script.matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g)) used.add(m[1].replace(/\\'/g, "'"));
for(const m of html.matchAll(/data-i18n(?:-ph|-title)?="([^"]+)"/g)) used.add(m[1]);

// 3) 缺译 = 使用中 − 字典
const missing = [...used].filter(k=>!dictKeys.has(k)).sort();
const unused = [...dictKeys].filter(k=>!used.has(k)).sort();

if(missing.length){
  console.log('缺译键（用于英文界面时将回落中文）：');
  missing.forEach(k=>console.log('  - ' + k));
}
if(unused.length){
  console.log('未使用的字典键（仅提示，不算失败）：');
  unused.forEach(k=>console.log('  - ' + k));
}
console.log(`\n使用键 ${used.size} · 字典键 ${dictKeys.size} · 缺译 ${missing.length} · 未用 ${unused.length}`);
if(missing.length) process.exit(1);
console.log('I18N_OK');

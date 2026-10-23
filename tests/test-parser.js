// 解析器验证脚本（纯函数从 八股闪背.html 同步复制，一次性验证用）
const fs = require('fs');
const path = require('path');

/* ==== 以下与 八股闪背.html 的 PARSER 区保持一致 ==== */
function normalizeText(raw){
  let text = raw.replace(/\r\n?/g,'\n');
  const blocks = [];
  text = text.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, m=>{ blocks.push(m); return '\u0001'+(blocks.length-1)+'\u0001'; });
  text = text.replace(/^```[^\n]*\n[\s\S]+$/m, m=>{ blocks.push(m); return '\u0001'+(blocks.length-1)+'\u0001'; });
  text = text.replace(/<!--[\s\S]*?-->/g,'');
  return {
    text,
    restore: t => t.replace(/\u0001(\d+)\u0001/g, (_,i)=>blocks[+i] !== undefined ? blocks[+i] : '')
  };
}
const HD_RE = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
function parseByHeading(text, level){
  const cards = []; let cur = null, deckName = null, chapter = null;
  for(const line of text.split('\n')){
    const m = line.match(HD_RE);
    if(m){
      const lv = m[1].length;
      if(lv === 1 && deckName === null){ deckName = m[2].trim(); continue; }
      if(lv === level){ if(cur && cur.q) cards.push(cur); cur = {q:m[2].trim(), a:[], tag:chapter}; continue; }
      if(lv < level){ chapter = m[2].trim(); if(cur && cur.q){ cards.push(cur); cur = null; } continue; }
    }
    if(cur) cur.a.push(line);
  }
  if(cur && cur.q) cards.push(cur);
  return { deckName, cards: cards.map(c=>({q:c.q, a:c.a.join('\n').trim(), tag:c.tag})) };
}
function parseQa(text){
  const qRe = /^ {0,3}>?\s*(?:\*\*\s*|#{1,6}\s+|[-*]\s+|【)?\s*(?:Q\d*\s*[.::：)、]|问\s*\d*\s*[::：.、)]|问题\s*\d*\s*[::：.、)]|【问题\s*\d*])/i;
  const aRe = /^\s*(?:\*\*\s*|[-*]\s+)?\s*(?:A\d*\s*[.::：)、]|答\s*[::：.、)]|答案\s*\d*\s*[::：.、)]|【答案\s*\d*])/i;
  const cards = []; let cur = null, seenA = false;
  for(const line of text.split('\n')){
    if(qRe.test(line)){
      if(cur) cards.push(cur);
      cur = { q: line.replace(qRe,'').replace(/\*\*\s*$/,'').replace(/[：:]\s*$/,'').trim(), a: [] };
      seenA = false; continue;
    }
    if(!cur) continue;
    if(!seenA && aRe.test(line)){ cur.a.push(line.replace(aRe,'').trim()); seenA = true; continue; }
    cur.a.push(line);
  }
  if(cur) cards.push(cur);
  return { deckName:null, cards: cards.map(c=>({q:c.q, a:c.a.join('\n').trim(), tag:null})) };
}
function parseList(text){
  const cards = [];
  for(const line of text.split('\n')){
    const m = line.match(/^\s*[-*]\s+(.+)$/);
    if(!m) continue;
    const i = m[1].search(/[::：]/);
    if(i < 1) continue;
    const q = m[1].slice(0,i).trim(), a = m[1].slice(i+1).trim();
    if(q && a) cards.push({q, a, tag:null});
  }
  return { deckName:null, cards };
}
function parseInline(text){
  const cards = [];
  for(const line of text.split('\n')){
    const m = line.match(/^(.+?)\s*:::?\s+(.+)$/);
    if(!m) continue;
    const q = m[1].trim().replace(/^\*+|\*+$/g,''), a = m[2].trim();
    if(q && a) cards.push({q, a, tag:null});
  }
  return { deckName:null, cards };
}
function runStrategy(text, name, level){
  if(name === 'heading') return parseByHeading(text, level||2);
  if(name === 'qa') return parseQa(text);
  if(name === 'list') return parseList(text);
  if(name === 'inline') return parseInline(text);
  return { deckName:null, cards:[] };
}
function autoDetect(text){
  const cands = [['heading',2],['heading',3],['heading',4],['qa',0],['list',0],['inline',0]];
  let best = null;
  for(const [name, level] of cands){
    const r = runStrategy(text, name, level);
    const n = r.cards.filter(c=>c.q).length;
    if(!n) continue;
    const empty = r.cards.filter(c=>!c.a).length;
    const avg = r.cards.reduce((s,c)=>s+c.a.length,0)/n;
    let score = n*2 - empty*4;
    if(avg > 4000) score -= n;
    if(avg < 5)    score -= n*1.5;
    if(!best || score > best.score) best = {name, level, score, n};
  }
  return best || {name:'heading', level:2, score:0, n:0};
}
/* ==== 复制区结束 ==== */

const dir = path.join(__dirname, '..', 'samples');
const cases = [
  ['sample-章节嵌套.md', 'heading', 3, ['什么是 JVM？', '运行时数据区包括哪些部分？', '常见的垃圾回收算法？']],
  ['sample-问答对.md', 'qa', 0, ['什么是事务？', '事务的 ACID 特性？', 'InnoDB 和 MyISAM 的区别？']],
  ['sample-列表型.md', 'list', 0, ['三次握手的过程', 'TCP 和 UDP 的区别', 'HTTP 状态码 301 和 302 的区别']],
  ['sample-行内卡.md', 'inline', 0, ['高并发下的限流算法有哪些', 'Redis 为什么快', '什么是 CAP 定理']],
];

let pass = 0, fail = 0;
for (const [file, wantName, wantLevel, wantQs] of cases) {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8');
  const norm = normalizeText(raw);
  const auto = autoDetect(norm.text);
  const r = runStrategy(norm.text, auto.name, auto.level);
  const cards = r.cards.filter(c => c.q).map(c => ({ q: c.q, a: norm.restore(c.a) }));

  const okAuto = auto.name === wantName;
  const okQ = wantQs.every(wq => cards.some(c => c.q.includes(wq)));

  const ok = okAuto && okQ && cards.length >= wantQs.length;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${file}`);
  console.log(`      自动识别: ${auto.name}${auto.level ? ' L' + auto.level : ''} (期望 ${wantName}${wantLevel ? ' L' + wantLevel : ''}) → ${okAuto ? '✔' : '✘'}`);
  console.log(`      解析 ${cards.length} 张卡; 期望问题全部命中: ${okQ ? '✔' : '✘'}`);
  cards.forEach(c => console.log(`        - [${c.a ? '有答案' : '空答案'}] ${c.q.slice(0, 40)} | 答案 ${c.a.length} 字`));
  ok ? pass++ : fail++;
}

// 行内卡：代码块内的 :: 不得泄漏为卡片
const rawInline = fs.readFileSync(path.join(dir, 'sample-行内卡.md'), 'utf8');
const n2 = normalizeText(rawInline);
const r2 = runStrategy(n2.text, 'inline', 0).cards.filter(c => c.q);
const leaked = r2.some(c => c.q.includes('String s') || c.a.includes('a :: b'));
console.log(`${leaked ? 'FAIL' : 'PASS'}  行内卡策略代码块隔离（代码内 :: 未泄漏为卡片）`);
leaked ? fail++ : pass++;

// 章节标签：h3 策略下高一层标题成为标签
const rawNest = fs.readFileSync(path.join(dir, 'sample-章节嵌套.md'), 'utf8');
const n3 = normalizeText(rawNest);
const r3 = runStrategy(n3.text, 'heading', 3).cards.filter(c => c.q);
const hasTag = r3.some(c => c.tag === '第一章 JVM 基础');
console.log(`${hasTag ? 'PASS' : 'FAIL'}  章节嵌套：高一层标题成为卡片标签`);
hasTag ? pass++ : fail++;

// 围栏保护验证：代码块应完整还原到所属卡片的答案里，且不出现在任何问题中
const nested = runStrategy(n3.text, 'heading', 3).cards.map(c => ({q:c.q, a:n3.restore(c.a)}));
const ansCard = nested.find(c => c.q.includes('运行时数据区'));
const fenceRestored = ansCard && ansCard.a.includes('main(') && ansCard.a.includes('这行也不是标题');
const qLeak = nested.some(c => c.q.includes('main(') || c.q.includes('这行也不是标题'));
const fenceOk = fenceRestored && !qLeak;
console.log(`${fenceOk ? 'PASS' : 'FAIL'}  围栏保护：代码块还原进所属答案、未泄漏到问题`);
fenceOk ? pass++ : fail++;

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);

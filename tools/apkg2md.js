#!/usr/bin/env node
/* apkg2md —— 把 Anki 牌组（.apkg）转成「不背八股」可导入的 markdown
 * 用法：node tools/apkg2md.js 牌组.apkg [输出.md]
 * 说明：这是开发期工具，应用本体保持零依赖；本工具的依赖装在 tools/ 下。
 *   cd tools && npm install
 *   node apkg2md.js ../我的牌组.apkg 我的牌组.md
 * 支持：标准 .apkg（collection.anki2 / anki21，含子牌组）；
 *   基础模板取前两个字段为问/答；挖空模板把 {{c1::答案}} 转成 ==答案==。
 *   图片/音频媒体文件不导出（markdown 里保留原文件名占位）。
 */
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const initSqlJs = require('sql.js');

function die(msg){ console.error('错误：' + msg); process.exit(1); }

const apkgPath = process.argv[2];
let outPath = process.argv[3];
if(!apkgPath) die('用法：node tools/apkg2md.js 牌组.apkg [输出.md]');
if(!fs.existsSync(apkgPath)) die('找不到文件 ' + apkgPath);
if(!outPath) outPath = apkgPath.replace(/\.apkg$/i, '') + '.md';
if(outPath === apkgPath) die('输出路径不能与输入相同');

/* 极简 HTML → 纯文本（保留换行/加粗，媒体留占位） */
function html2md(h){
  return String(h || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '🖼 $1')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<(b|strong)>/gi, '**').replace(/<\/(b|strong)>/gi, '**')
    .replace(/<(i|em)>/gi, '*').replace(/<\/(i|em)>/gi, '*')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
/* Anki 挖空 {{c1::答案::提示}} → ==答案==（::提示 丢弃） */
function cloze2md(h){
  return String(h || '').replace(/\{\{c\d+::(.*?)(::[^}]*)?\}\}/g, '==$1==');
}

(async () => {
  const zip = new AdmZip(apkgPath);
  const entry = zip.getEntries().map(e=>e.entryName).find(n=>/^collection\.anki2(1)?$/.test(n));
  if(!entry) die('apkg 里找不到 collection.anki2 / collection.anki21');
  const buf = zip.readFile(entry);

  const SQL = await initSqlJs();
  const db = new SQL.Database(buf);

  // 表名探测：新版(2.1.28+)有 notetypes/decks 表；旧版都在 col 表的 JSON 列里
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'").map(r=>r.values[0][0]);
  let modelName = new Map(), deckName = new Map();
  if(tables.includes('decks') && tables.includes('notetypes')){
    const modelRows = db.exec("SELECT id, name, type FROM notetypes")[0]?.values || [];
    const deckRows = db.exec("SELECT id, name FROM decks")[0]?.values || [];
    modelName = new Map(modelRows.map(r=>[r[0], r[1]]));
    deckName = new Map(deckRows.map(r=>[r[0], r[1]]));
  } else {
    const col = db.exec("SELECT decks, models FROM col")[0]?.values[0] || [];
    const dJson = JSON.parse(col[0] || '{}'), mJson = JSON.parse(col[1] || '{}');
    for(const [id, d] of Object.entries(dJson)) deckName.set(Number(id), d.name);
    for(const [id, m] of Object.entries(mJson)) modelName.set(Number(id), m.name);
  }
  const noteRows = db.exec("SELECT id, mid, flds, tags FROM notes")[0]?.values || [];
  const cardsRows = db.exec("SELECT nid, did FROM cards")[0]?.values || [];

  // nid → 第一次出现的 did；同一笔记多张卡只出一张
  const noteDeck = new Map();
  for(const [nid, did] of cardsRows) if(!noteDeck.has(nid)) noteDeck.set(nid, did);

  const groups = new Map();   // deckName -> [{q, a}]
  let clozeN = 0, skipped = 0;
  for(const [nid, mid, flds, tags] of noteRows){
    const fields = String(flds).split('\x1f').map(h=>cloze2md(html2md(h)));
    if(fields.length < 2 || !fields[0]){ skipped++; continue; }
    const isCloze = /==.+==/.test(fields[0]) || (modelName.get(mid)||'').toLowerCase().includes('cloze');
    if(isCloze) clozeN++;
    const q = fields[0];
    const a = fields.slice(1).join('\n\n');
    const tg = String(tags || '').trim();
    const dn = deckName.get(noteDeck.get(nid)) || '默认牌组';
    if(!groups.has(dn)) groups.set(dn, []);
    groups.get(dn).push({ q, a: tg ? a + (a ? '\n\n' : '') + '> 标签：' + tg : a });
  }
  if(![...groups.values()].some(g=>g.length)) die('没有解析出任何卡片（可能是加密的 .colpkg 或空牌组）');

  let md = '# ' + path.basename(apkgPath).replace(/\.apkg$/i,'') + '（Anki 导入 · 闪背版）\n\n';
  md += '> 由 tools/apkg2md.js 从 Anki 牌组自动转换；图片/音频未导出。挖空模板已转为 ==挖空== 语法。\n\n';
  for(const [dn, cards] of groups){
    md += '\n## ' + dn + '（' + cards.length + ' 张）\n\n';
    for(const c of cards){
      md += '### ' + c.q + '\n\n' + (c.a || '（空答案）') + '\n\n';
    }
  }
  fs.writeFileSync(outPath, md, 'utf8');
  const total = [...groups.values()].reduce((s,g)=>s+g.length, 0);
  console.log('完成：' + total + ' 张卡（其中挖空卡 ' + clozeN + ' 张）→ ' + outPath);
  if(skipped) console.log('跳过 ' + skipped + ' 条无法解析的笔记');
})().catch(e=>die(e.message));

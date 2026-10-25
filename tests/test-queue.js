// 弱卡优先队列测试（weakScore / weaveWeak 为 app 内纯函数的副本）
let pass = 0, fail = 0;
function t(name, fn){
  try{ fn(); pass++; console.log('ok  - ' + name); }
  catch(e){ fail++; console.log('FAIL- ' + name + ' :: ' + e.message); }
}
function eq(a, b, msg){ if(a !== b) throw new Error((msg||'') + ` expected=${b} got=${a}`); }

/* === 从 八股闪背.html 复制的纯函数 === */
function weakScore(card){
  const h = (card.history||[]).slice(-10);
  if(!h.length) return 0;
  let sc = h.filter(x=>x.r===1).length * 8;
  if(h[h.length-1].r === 1) sc += 10;
  if(card.leech) sc += 20;
  sc += (card.lapses||0) * 2;
  return sc;
}
function weaveWeak(queue, cards){
  if(queue.length < 2) return queue;
  const byId = new Map(cards.map(c=>[c.id,c]));
  const weak = queue.filter(id=>{ const c=byId.get(id); return c && weakScore(c) >= 20; });
  if(!weak.length) return queue;
  const extra = [];
  weak.forEach(id=>{
    const n = weakScore(byId.get(id)) >= 40 ? 2 : 1;
    for(let i=0;i<n;i++) extra.push(id);
  });
  const out = queue.slice();
  const span = out.length + extra.length;
  extra.forEach((id,i)=>{
    let pos = Math.min(out.length, Math.max(1, Math.round((i+1)*span/(extra.length+1))));
    let tries = 0;
    while(tries++ < 10 && (out[pos-1]===id || out[pos]===id)) pos = pos % out.length + 1;
    out.splice(pos, 0, id);
  });
  return out;
}
/* === 副本结束 === */

const hist = rs => rs.map(r=>({t:0, r}));

t('无学习记录的卡薄弱分为 0', ()=>{
  eq(weakScore({history:[]}), 0);
  eq(weakScore({}), 0);
});
t('全答对的卡薄弱分为 0', ()=>{
  eq(weakScore({history:hist([4,3,4,2,3])}), 0);
});
t('最近10次中答错越多分越高（每次+8，末位答错+10）', ()=>{
  eq(weakScore({history:hist([1,4,4,4,4,4,4,4,4,4])}), 8);    // 错在开头，末位是对的
  eq(weakScore({history:hist([4,4,4,4,4,4,4,4,1,1])}), 26);   // 16 + 10(末位错)
  eq(weakScore({history:hist([1,1,1,1,1,1,1,1,1,1])}), 90);   // 80 + 10
});
t('刚答错的卡额外 +10', ()=>{
  eq(weakScore({history:hist([4,4,1])}), 18);   // 8 + 10
  eq(weakScore({history:hist([1,4,4])}), 8);    // 只有历史里1次错，不在末位
});
t('顽固卡 +20、每次遗忘 +2', ()=>{
  eq(weakScore({history:hist([4,4,4]), leech:true}), 20);
  eq(weakScore({history:hist([4,4,4]), lapses:3}), 6);
});
t('超过10次只看最近10次', ()=>{
  const h = hist([1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,4,4,4,4]);  // 最近10次全对
  eq(weakScore({history:h}), 0);
});

t('队列少于2张时不织入', ()=>{
  eq(weaveWeak(['a'], [{id:'a',history:hist([1,1,1])}]).length, 1);
});
t('没有薄弱卡时队列原样返回', ()=>{
  const q = ['a','b','c'];
  const cards = [{id:'a',history:hist([4,4])},{id:'b',history:hist([3,3])},{id:'c',history:hist([2,2])}];
  eq(weaveWeak(q, cards).join(','), 'a,b,c');
});
t('中度薄弱卡本轮出现 2 次（原位+1次织入）', ()=>{
  const q = ['a','b','c','d','e'];
  const cards = q.map(id=>({id, history:hist([4,4,4,4,4,4,4])}));
  cards[0].history = hist([1,4,4,4,4,4,4,4]);   // 8+10=18 不够
  cards[1].history = hist([1,1,4,4,4,4,4,4]);   // 16 不够
  cards[2].history = hist([1,1,1,4,4,4,4,4]);   // 24 → 中度弱
  const out = weaveWeak(q, cards);
  eq(out.filter(x=>x==='c').length, 2);
  eq(out.length, 6);
});
t('高度薄弱卡本轮出现 3 次', ()=>{
  const q = ['a','b','c','d','e'];
  const cards = q.map(id=>({id, history:hist([4,4,4,4,4])}));
  cards[1].history = hist([1,1,1,1,1,4,4,4,4,4]);  // 40 → 高度弱
  const out = weaveWeak(q, cards);
  eq(out.filter(x=>x==='b').length, 3);
  eq(out.length, 7);   // 原 5 张 + 高度弱 2 次织入
});
t('同一张卡不会相邻出现', ()=>{
  const q = ['a','b','c','d','e','f','g','h'];
  const cards = q.map(id=>({id, history:hist([4,4])}));
  cards[0].history = hist([1,1,1,1,1,1,1,1,1,1]);  // 80 高度弱
  const out = weaveWeak(q, cards);
  for(let i=1;i<out.length;i++)
    if(out[i]===out[i-1]) throw new Error('相邻重复: ' + out[i] + ' @ ' + i);
});
t('原队列顺序在结果中保持为子序列', ()=>{
  const q = ['a','b','c','d','e','f'];
  const cards = q.map(id=>({id, history:hist([4,4,4,4,4,4,4,4])}));
  cards[2].history = hist([1,1,1,1,1,4,4,4,4,4]);  // c 高度弱
  const out = weaveWeak(q, cards);
  const sub = out.filter(x=>q.includes(x));
  // 原序应保留（同一 id 多次出现时取第一次出现的位置校验）
  const first = q.map(id=>out.indexOf(id));
  for(let i=1;i<first.length;i++)
    if(first[i] < first[i-1]) throw new Error('顺序被打乱: ' + out.join(','));
  eq(sub.length, out.length, '不应引入未知id');
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

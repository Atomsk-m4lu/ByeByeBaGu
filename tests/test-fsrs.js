// FSRS 调度引擎验证脚本（纯函数从 八股闪背.html 同步复制，一次性验证用）
'use strict';
/* ==== 以下与 八股闪背.html 的 FSRS 区保持一致 ==== */
const F_DAY = 86400000, F_MIN = 60000;
const FSRS_W = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
  1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729,
  0.5425, 0.0912, 0.0658, 0.1542];
const FSRS_DECAY = -FSRS_W[20];
const FSRS_FACTOR = Math.exp(Math.log(0.9) / FSRS_DECAY) - 1;
const FSRS_S_MIN = 0.01, FSRS_S_MAX = 36500;
const LEARN_STEP_MIN = 10;
function fsrsClamp(x, lo, hi){ return Math.min(hi, Math.max(lo, x)); }
function fsrsRecallProb(t, s){ return Math.pow(1 + FSRS_FACTOR * t / s, FSRS_DECAY); }
function fsrsInterval(s, retention){
  return fsrsClamp(Math.round(s / FSRS_FACTOR * (Math.pow(retention, 1 / FSRS_DECAY) - 1)), 1, 36500);
}
function fsrsInitS(g){ return fsrsClamp(FSRS_W[g-1], FSRS_S_MIN, 100); }
function fsrsInitD(g){ return fsrsClamp(FSRS_W[4] - Math.exp((g-1) * FSRS_W[5]) + 1, 1, 10); }
function fsrsNextD(d, g){
  const delta = -FSRS_W[6] * (g - 3);
  const damped = delta * (10 - d) / 9;
  const reverted = FSRS_W[7] * fsrsInitD(4) + (1 - FSRS_W[7]) * (d + damped);
  return fsrsClamp(reverted, 1, 10);
}
function fsrsRecallS(s, d, r, g){
  const hardPenalty = (g === 2) ? FSRS_W[15] : 1;
  const easyBonus   = (g === 4) ? FSRS_W[16] : 1;
  const next = s * (1 + Math.exp(FSRS_W[8]) * (11 - d) * Math.pow(s, -FSRS_W[9])
    * (Math.exp((1 - r) * FSRS_W[10]) - 1) * hardPenalty * easyBonus);
  return fsrsClamp(next, FSRS_S_MIN, FSRS_S_MAX);
}
function fsrsForgetS(s, d, r){
  const next = FSRS_W[11] * Math.pow(d, -FSRS_W[12])
    * (Math.pow(s + 1, FSRS_W[13]) - 1) * Math.exp((1 - r) * FSRS_W[14]);
  return fsrsClamp(next, FSRS_S_MIN, FSRS_S_MAX);
}
function fsrsNext(card, g, now, retention){
  const state = card.state || 'new';
  const elapsed = card.last ? Math.max(0, (now - card.last) / F_DAY) : 0;
  let s = card.s || 0, d = card.d || 0, nextState = state, due, interval;
  if(state === 'new'){
    s = fsrsInitS(g); d = fsrsInitD(g);
    if(g <= 2){ nextState = 'learning'; due = now + LEARN_STEP_MIN * F_MIN; interval = 0; }
    else { nextState = 'review'; interval = fsrsInterval(s, retention); due = now + interval * F_DAY; }
  }else if(state === 'learning' || state === 'relearning'){
    if(g <= 2){ due = now + LEARN_STEP_MIN * F_MIN; interval = 0; }
    else {
      const r = elapsed > 0 ? fsrsRecallProb(elapsed, s) : 1;
      s = fsrsRecallS(s, d, r, g); d = fsrsNextD(d, g);
      nextState = 'review'; interval = fsrsInterval(s, retention); due = now + interval * F_DAY;
    }
  }else{
    const r = elapsed > 0 ? fsrsRecallProb(elapsed, s) : 1;
    d = fsrsNextD(d, g);
    if(g === 1){ s = fsrsForgetS(s, d, r); nextState = 'relearning'; due = now + LEARN_STEP_MIN * F_MIN; interval = 0; }
    else { s = fsrsRecallS(s, d, r, g); interval = fsrsInterval(s, retention); due = now + interval * F_DAY; }
  }
  return { s, d, state: nextState, due, interval };
}
/* ==== 复制区结束 ==== */

let pass = 0, fail = 0;
function check(name, cond, detail){
  console.log(`${cond?'PASS':'FAIL'}  ${name}${cond?'':'  ← '+(detail||'')}`);
  cond ? pass++ : fail++;
}
const NOW = 1735689600000; // 固定时间戳，保证可复现
const RET = 0.9;

// 1. 遗忘曲线构造：恰好经过 stability 天数时 retrievability = 0.9
check('遗忘曲线: R(s, s) = 0.9',
  [1, 2.3065, 15, 100].every(s => Math.abs(fsrsRecallProb(s, s) - 0.9) < 1e-9));

// 2. 新卡评分初始化
const g3 = fsrsNext({state:'new'}, 3, NOW, RET);
check('新卡·良好: 初始稳定性 = w[2] = 2.3065', g3.s === FSRS_W[2], `实际 ${g3.s}`);
check('新卡·良好: 进入 review 状态，间隔 = round(s)', g3.state==='review' && g3.interval === Math.round(g3.s), `interval=${g3.interval}`);
check('新卡·困难: 进入 10 分钟学习步长', fsrsNext({state:'new'}, 2, NOW, RET).state==='learning');
check('新卡·重来: 进入 10 分钟学习步长', fsrsNext({state:'new'}, 1, NOW, RET).state==='learning');
check('难度有界 [1,10]', [1,2,3,4].every(g => fsrsInitD(g)>=1 && fsrsInitD(g)<=10));

// 3. 稳定性单调性：同一张复习卡，Easy > Good > Hard 的记忆强度增长
const revCard = {state:'review', s:5, d:5, last:NOW - F_DAY};
const sHard = fsrsNext(revCard, 2, NOW, RET).s;
const sGood = fsrsNext(revCard, 3, NOW, RET).s;
const sEasy = fsrsNext(revCard, 4, NOW, RET).s;
check('复习稳定性: Easy > Good', sEasy > sGood, `${sEasy} vs ${sGood}`);
check('复习稳定性: Good > Hard', sGood > sHard, `${sGood} vs ${sHard}`);
check('复习稳定性: Good 时增长', sGood > 5, `${sGood}`);

// 4. 遗忘分支：重来 → relearning + 稳定性下降
const forgot = fsrsNext(revCard, 1, NOW, RET);
check('重来: 进入 relearning、10分钟后再现', forgot.state==='relearning' && forgot.interval===0);
check('重来: 稳定性下降', forgot.s < 5, `${forgot.s}`);
check('重来: 下降后的稳定性有下界', forgot.s >= FSRS_S_MIN);

// 5. 重学毕业：relearning 卡评良好 → 回到 review
const grad = fsrsNext({state:'relearning', s:forgot.s, d:forgot.d, last:NOW - 10*F_MIN}, 3, NOW, RET);
check('重学毕业: 回到 review 状态', grad.state==='review');

// 6. 保持率与间隔反向：保持率越高间隔越短
check('间隔与保持率反向: i(0.95) < i(0.9) < i(0.8)',
  fsrsInterval(10,0.95) < fsrsInterval(10,0.9) && fsrsInterval(10,0.9) < fsrsInterval(10,0.8));

// 7. 长期模拟：连续答对 12 轮，稳定性持续增长且有界、间隔不超上限
const s0 = fsrsInitS(3);
let c = {state:'review', s:s0, d:fsrsInitD(3), last:NOW, interval:fsrsInterval(s0, RET)};
let grewEarly = true, neverDecreased = true, bounded = true, prevS = c.s;
for(let i=0;i<12;i++){
  const res = fsrsNext(c, 3, c.last + c.interval*F_DAY, RET);
  if(res.s < prevS) neverDecreased = false;
  if(prevS < 1000 && res.s <= prevS) grewEarly = false;   // 未触及上限时应严格递增
  if(!(res.s >= FSRS_S_MIN && res.s <= FSRS_S_MAX && res.interval <= 36500)) bounded = false;
  c = {state:res.state, s:res.s, d:res.d, last:c.last + c.interval*F_DAY, interval:res.interval};
  prevS = res.s;
}
check('长期模拟: 增长期稳定性严格递增', grewEarly);
check('长期模拟: 全程稳定性不下降', neverDecreased);
check('长期模拟: 12 轮后触及上限饱和', prevS >= FSRS_S_MAX * 0.999, `最终 s=${prevS}`);
check('长期模拟: 稳定性/间隔始终有界', bounded);

// 8. 极端遗忘恢复：跌到谷底后，重学毕业（真实间隔 10 分钟）时稳定性回升
let c2 = {state:'review', s:5, d:8, last:NOW, interval:1};
for(let i=0;i<6;i++){
  const res = fsrsNext(c2, 1, c2.last + c2.interval*F_DAY, RET);
  c2 = {state:res.state, s:res.s, d:res.d, last:c2.last + c2.interval*F_DAY, interval:res.interval || 1};
}
const recover = fsrsNext({state:'relearning', s:c2.s, d:c2.d, last:NOW - 10*F_MIN}, 3, NOW, RET);
check('谷底爬升: 重学毕业后稳定性回升', recover.s > c2.s, `${recover.s} > ${c2.s}`);

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);

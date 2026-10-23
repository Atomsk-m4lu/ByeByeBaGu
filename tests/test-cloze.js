// 填空卡渲染验证（mdLite 从 八股闪背.html 同步复制，一次性验证用）
'use strict';
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function mdLite(s){
  let html = esc(s);
  const blocks = [];
  html = html.replace(/```([\s\S]*?)```/g, (_,code)=>{
    blocks.push('<pre><code>'+code.replace(/^\n|\n$/g,'')+'</code></pre>');
    return '\u0000'+(blocks.length-1)+'\u0000';
  });
  html = html.replace(/`([^`\n]+)`/g, (_,code)=>{
    blocks.push('<code>'+code+'</code>');
    return '\u0000'+(blocks.length-1)+'\u0000';
  });
  html = html
    .replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>')
    .replace(/==((?:(?!==)[^\n])+?)==/g, (_,a)=>'<span class="cloze" data-v="'+a.replace(/"/g,'&quot;')+'" onclick="toggleCloze(this)">▇▇▇</span>')
    .replace(/\n/g,'<br>');
  html = html.replace(/\u0000(\d+)\u0000/g, (_,i)=>blocks[+i]);
  return html;
}

let pass = 0, fail = 0;
function check(name, cond, detail){
  console.log(`${cond?'PASS':'FAIL'}  ${name}${cond?'':'  ← '+(detail||'')}`);
  cond ? pass++ : fail++;
}

// 1. 基本挖空
const t1 = mdLite('链表长度超过==8==且数组长度==64==才转红黑树');
check('两个挖空都生成 cloze span', (t1.match(/class="cloze"/g)||[]).length === 2);
check('挖空答案进入 data-v', t1.includes('data-v="8"') && t1.includes('data-v="64"'));
check('初始显示遮罩', t1.includes('>▇▇▇<'));

// 2. 挖空内容 HTML 转义（答案含 < > &）
const t2 = mdLite('Map使用==<K,V>==表示键值对');
check('挖空内 < > 被转义', t2.includes('data-v="&lt;K,V&gt;"') && !t2.includes('data-v="<K'));

// 3. 引号注入防护：答案里带双引号不能破坏属性
const t3 = mdLite('==a" onclick="evil()==');
check('双引号被转义为 &quot;', t3.includes('&quot;') && !/data-v="a"/.test(t3));

// 4. 代码块内的 == 不挖空
const t4 = mdLite('正常 ==挖空== \n```\nString s = "==不挖==";\n```');
check('代码块内 == 保留原文不挖空', t4.includes('"==不挖=="') && (t4.match(/class="cloze"/g)||[]).length === 1);

// 5. 行内代码内的 == 不挖空
const t5 = mdLite('命令 `a == b` 以及 ==真挖空==');
check('行内代码内 == 不挖空', t5.includes('<code>a == b</code>') && (t5.match(/class="cloze"/g)||[]).length === 1);

// 6. 单个 = 与奇数个 = 不误伤
const t6 = mdLite('a = 1 和 ==真挖空== 和 b == 2');
check('普通等号不受影响', (t6.match(/class="cloze"/g)||[]).length === 1 && t6.includes('a = 1'));

// 7. 加粗/行内代码原有行为不回归
const t7 = mdLite('**重点** 和 `code`');
check('加粗与行内代码不回归', t7.includes('<b>重点</b>') && t7.includes('<code>code</code>'));

// 8. 挖空跨行不匹配（每行独立）
const t8 = mdLite('==第一行\n第二行==');
check('跨行 == 不产生挖空', !t8.includes('class="cloze"'));

console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);

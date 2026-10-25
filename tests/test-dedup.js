// 语义去重测试（meaningKey / dedupKey 为 app 内纯函数的副本）
let pass = 0, fail = 0;
function t(name, fn){
  try{ fn(); pass++; console.log('ok  - ' + name); }
  catch(e){ fail++; console.log('FAIL- ' + name + ' :: ' + e.message); }
}
function eq(a, b, msg){ if(a !== b) throw new Error((msg||'') + ` expected=${b} got=${a}`); }
function ne(a, b, msg){ if(a === b) throw new Error((msg||'') + ` 不应相等，但都是 ${a}`); }

/* === 从 八股闪背.html 复制的纯函数 === */
function hashStr(s){
  let h = 5381;
  for(let i=0;i<s.length;i++) h = ((h<<5)+h+s.charCodeAt(i))>>>0;
  return h.toString(36)+':'+s.length;
}
function meaningKey(s){
  return String(s)
    .replace(/\r\n?/g,'\n')
    .replace(/^\s*[-+*]\s+/gm,'')
    .replace(/^\s*#{1,6}\s+/gm,'')
    .replace(/[*_~`]/g,'')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g,'')
    .replace(/\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/[，。？！；：、·…—""''（）《》【】,.?!;:'"()]/g,'')
    .replace(/\s+/g,'')
    .toLowerCase();
}
function dedupKey(q,a){ return hashStr(meaningKey(q)+'|'+meaningKey(a)); }
/* === 副本结束 === */

t('改标点/加空格 → 同一张卡', ()=>{
  eq(dedupKey('什么是HashMap的底层结构','数组+链表'), dedupKey('什么是 HashMap 的底层结构？','数组 + 链表。'));
});
t('加粗/行内代码/标题井号变化 → 同一张卡', ()=>{
  eq(dedupKey('## Redis 为什么快','**内存**存储'),
     dedupKey('# Redis 为什么快','`内存`存储'));
});
t('列表标记与换行风格变化 → 同一张卡', ()=>{
  eq(dedupKey('TCP 和 UDP 的区别','- 面向连接\n- 可靠传输'),
     dedupKey('TCP 和 UDP 的区别','* 面向连接\r\n* 可靠传输'));
});
t('链接只留文字，图片忽略 → 同一张卡', ()=>{
  eq(dedupKey('Kafka 架构','见 [架构图](https://a.com/x.png)'),
     dedupKey('Kafka 架构','见 架构图'));
  eq(dedupKey('Kafka 架构','![](https://a.com/1.png) 顺序写'),
     dedupKey('Kafka 架构','顺序写'));
});
t('大小写差异 → 同一张卡', ()=>{
  eq(dedupKey('What is JVM','Java Virtual Machine'), dedupKey('what is jvm','java virtual machine'));
});
t('语义真不同 → 不同卡（不能误合并）', ()=>{
  ne(dedupKey('HashMap 为什么线程不安全','扩容成环'), dedupKey('HashMap 为什么线程不安全','数据覆盖丢失'));
  ne(dedupKey('Redis 持久化 RDB','快照'), dedupKey('Redis 持久化 AOF','日志追加'));
});
t('代码块内的内容仍参与区分（只去标记不去字符）', ()=>{
  ne(dedupKey('G1 与 CMS 的区别','`-XX:+UseG1`'), dedupKey('G1 与 CMS 的区别','`-XX:+UseCMS`'));
});
t('数字不被吞（避免 10-20 与 1020 之类误合并）', ()=>{
  ne(dedupKey('端口范围','1024-65535'), dedupKey('端口范围','102465535'));
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

// ===== HELPERS =====
function sh(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function $(id){return document.getElementById(id);}
function tagH(t){const c=TC[t]||TC.tq;return`<span class="c-tag" style="background:${c.bg};color:${c.cl}">${c.l}</span>`;}
function speak(text){
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang='ja-JP';u.rate=0.85;u.pitch=1;
  // Try to find a Japanese voice
  const voices=window.speechSynthesis.getVoices();
  const jpVoice=voices.find(v=>v.lang.startsWith('ja'));
  if(jpVoice)u.voice=jpVoice;
  window.speechSynthesis.speak(u);
}

// ===== STATE =====
let section='vocab';
// Vocab
let activeTag='all', vMode='flash';
let pool=[...VOCAB], vi=0, vFlipped=false;
let vKnown=new Set(), vForgot=new Set();
// Quiz
let qPool=[], qi=0, qAnswered=false;
// Listen
let lPool=[], li=0, lShown=false;
let lKnown=new Set(), lForgot=new Set();
// Grammar
let gType='te', gi=0, gAnswered=false;
let gPool=[], gKnown=new Set(), gForgot=new Set();
// Review
let rTab='vocab';

// ===== LOAD SAVED PROGRESS =====
function saveProgress(){
  try{
    localStorage.setItem('n4_vKnown',JSON.stringify([...vKnown]));
    localStorage.setItem('n4_vForgot',JSON.stringify([...vForgot]));
    localStorage.setItem('n4_gKnown',JSON.stringify([...gKnown]));
    localStorage.setItem('n4_gForgot',JSON.stringify([...gForgot]));
    localStorage.setItem('n4_lKnown',JSON.stringify([...lKnown]));
    localStorage.setItem('n4_lForgot',JSON.stringify([...lForgot]));
  }catch(e){}
}
function loadProgress(){
  try{
    const vk=localStorage.getItem('n4_vKnown');if(vk)vKnown=new Set(JSON.parse(vk));
    const vf=localStorage.getItem('n4_vForgot');if(vf)vForgot=new Set(JSON.parse(vf));
    const gk=localStorage.getItem('n4_gKnown');if(gk)gKnown=new Set(JSON.parse(gk));
    const gf=localStorage.getItem('n4_gForgot');if(gf)gForgot=new Set(JSON.parse(gf));
    const lk=localStorage.getItem('n4_lKnown');if(lk)lKnown=new Set(JSON.parse(lk));
    const lf=localStorage.getItem('n4_lForgot');if(lf)lForgot=new Set(JSON.parse(lf));
  }catch(e){}
}
function resetAll(){
  if(!confirm('確定要重置所有進度嗎？'))return;
  vKnown.clear();vForgot.clear();gKnown.clear();gForgot.clear();lKnown.clear();lForgot.clear();
  vi=0;qi=0;gi=0;li=0;
  try{localStorage.clear();}catch(e){}
  updateVStats();updateGStats();updateLStats();
  renderCard();renderReview();
}

// ===== SECTION SWITCHING =====
function setSection(s){
  section=s;
  document.querySelectorAll('.section').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  $('s-'+s).classList.add('active');
  $('n-'+s).classList.add('active');
  if(s==='listen'){lPool=sh([...pool]);li=0;lShown=false;renderListen();}
  if(s==='grammar'){buildGPool();renderGTabs();renderGrammar();}
  if(s==='review'){renderReview();}
}

// ===== VOCAB =====
function buildPool(){
  pool=activeTag==='all'?[...VOCAB]:VOCAB.filter(w=>w.tag===activeTag);
  vi=0;vFlipped=false;
  $('vocab-count').textContent=pool.length+' 個單字';
  updateVStats();
}
function renderFTags(){
  const tags=['all',...Object.keys(TC)];
  $('ftags').innerHTML=tags.map(t=>{
    if(t==='all')return`<button class="ftag ${activeTag==='all'?'on':''}" onclick="setTag('all')">全部(${VOCAB.length})</button>`;
    const cnt=VOCAB.filter(w=>w.tag===t).length;
    return`<button class="ftag ${activeTag===t?'on':''}" onclick="setTag('${t}')">${TC[t].l}(${cnt})</button>`;
  }).join('');
}
function setTag(t){activeTag=t;buildPool();renderFTags();if(vMode==='flash'){vKnown.clear();vForgot.clear();renderCard();}else{qPool=sh([...pool]);qi=0;renderQCard();}lPool=sh([...pool]);li=0;}
function setVMode(m){
  vMode=m;
  ['flash','quiz'].forEach(x=>{
    $('vm-'+x+'-div').style.display=x===m?'block':'none';
    $('vm-'+x).classList.toggle('active',x===m);
  });
  if(m==='flash'){vi=0;vFlipped=false;vKnown.clear();vForgot.clear();updateVStats();renderCard();}
  else{qPool=sh([...pool]);qi=0;qAnswered=false;renderQCard();}
}
function renderCard(){
  if(vi>=pool.length){
    $('cfront').innerHTML=`<div class="c-jp" style="font-size:48px">🎉</div><div class="c-rd" style="margin-top:0.5rem">這批全部完成！</div>`;
    $('cback').innerHTML='';
    $('vact').style.display='none';$('vflip').style.display='none';
    $('vhint').style.display='none';$('vcnt').textContent='';
    return;
  }
  const w=pool[vi];vFlipped=false;
  $('ci').classList.remove('flipped');
  $('vact').style.display='none';$('vflip').style.display='flex';$('vhint').style.display='block';
  $('vcnt').textContent=`${vi+1} / ${pool.length}`;
  $('cfront').innerHTML=`${tagH(w.tag)}<div class="c-jp">${w.jp}</div><div class="c-rd">${w.rd}</div><div style="font-size:11px;color:rgba(255,255,255,0.2);margin-top:0.5rem">點擊翻面</div>`;
  $('cback').innerHTML=`${tagH(w.tag)}<div class="c-jp" style="font-size:28px">${w.jp}</div><div class="c-rd">${w.rd}</div><div class="c-mn">${w.mn}</div><div class="mem-box"><div class="mem-label">記憶技巧</div><div class="mem-text">${w.mem}</div></div><div class="ex-text">例：${w.ex}</div>`;
}
function flipCard(){
  vFlipped=!vFlipped;
  $('ci').classList.toggle('flipped',vFlipped);
  if(vFlipped){$('vact').style.display='flex';$('vflip').style.display='none';$('vhint').style.display='none';}
}
function vAns(ok){
  if(ok)vKnown.add(vi);else vForgot.add(vi);
  vi++;updateVStats();saveProgress();renderCard();
}
function updateVStats(){
  const t=vKnown.size+vForgot.size;
  $('sv-t').textContent=t;$('sv-k').textContent=vKnown.size;$('sv-f').textContent=vForgot.size;
  $('vp').style.width=Math.round((t/Math.max(pool.length,1))*100)+'%';
}
function speakCurrent(){if(vi<pool.length)speak(pool[vi].jp);}

// ===== VOCAB QUIZ =====
function renderQCard(){
  if(qi>=qPool.length){
    $('qbox').innerHTML=`<div class="empty-state">🎊 全部完成！<br>答對 ${vKnown.size} / ${qPool.length}</div><button class="next-btn" onclick="qPool=sh([...pool]);qi=0;vKnown.clear();vForgot.clear();renderQCard()">再做一次</button>`;
    return;
  }
  const w=qPool[qi];
  const others=pool.filter(v=>v.jp!==w.jp);sh(others);
  const opts=sh([w,...others.slice(0,3)]);
  qAnswered=false;
  $('qbox').innerHTML=`<div class="q-word">${w.jp}</div><div class="q-sub">${w.rd}　の意思是？</div><div class="q-opts">${opts.map(o=>`<button class="q-opt" onclick="checkVQ(this,'${o.mn.replace(/'/g,"\\'")}','${w.mn.replace(/'/g,"\\'")}')">${o.mn}</button>`).join('')}</div><div id="qr"></div><button class="next-btn" id="qn" style="display:none" onclick="qi++;renderQCard()">下一題 →</button>`;
}
function checkVQ(el,ch,co){
  if(qAnswered)return;qAnswered=true;
  const w=qPool[qi];
  document.querySelectorAll('.q-opt').forEach(b=>b.disabled=true);
  if(ch===co){el.classList.add('ok');vKnown.add(qi);$('qr').innerHTML=`<div class="q-res ok">✅ 正確！${w.mem}</div>`;}
  else{el.classList.add('ng');vForgot.add(qi);document.querySelectorAll('.q-opt').forEach(b=>{if(b.textContent===co)b.classList.add('ok');});$('qr').innerHTML=`<div class="q-res ng">❌ 答錯。正確：${co}<br>${w.mem}</div>`;}
  $('qn').style.display='block';
  updateVStats();saveProgress();
}

// ===== LISTEN =====
function renderListen(){
  if(li>=lPool.length){
    $('lcard').innerHTML=`<div class="listen-num">完成！</div><div class="listen-icon">🎊</div><p class="listen-hint">答對 ${lKnown.size}/${lPool.length}</p><button class="play-btn" onclick="li=0;lKnown.clear();lForgot.clear();lPool=sh([...pool]);renderListen()">再來一次</button>`;
    $('lact').style.display='none';$('lplay').style.display='none';
    return;
  }
  const w=lPool[li];lShown=false;
  $('lnum').textContent=`${li+1} / ${lPool.length}`;
  $('lreveal').style.display='none';
  $('lact').style.display='none';$('lplay').style.display='flex';
  $('lcard').querySelector('.listen-hint').textContent='按下播放，聽發音猜單字';
  updateLStats();
}
function playListen(){if(li<lPool.length)speak(lPool[li].jp);}
function showListen(){
  const w=lPool[li];
  $('lreveal').style.display='block';
  $('lreveal').innerHTML=`<div class="l-jp">${w.jp}</div><div class="l-rd">${w.rd}</div><div class="l-mn">${w.mn}</div>`;
  $('lact').style.display='flex';$('lplay').style.display='none';lShown=true;
}
function lAns(ok){
  if(ok)lKnown.add(li);else lForgot.add(li);
  li++;updateLStats();saveProgress();renderListen();
}
function updateLStats(){
  const t=lKnown.size+lForgot.size;
  $('sl-t').textContent=t;$('sl-k').textContent=lKnown.size;$('sl-f').textContent=lForgot.size;
  $('lp').style.width=Math.round((t/Math.max(lPool.length,1))*100)+'%';
}

// ===== GRAMMAR =====
function buildGPool(){gPool=sh(GRAMMAR_Q.filter(q=>q.type===gType));gi=0;gKnown.clear();gForgot.clear();updateGStats();}
function renderGTabs(){
  $('gtabs').innerHTML=Object.entries(GRAMMAR_TYPES).map(([k,v])=>`<button class="g-tab ${gType===k?'active':''}" onclick="setGType('${k}')">${v.name}</button>`).join('');
}
function setGType(t){gType=t;buildGPool();renderGTabs();$('grule').innerHTML=GRAMMAR_TYPES[t].rule;renderGrammar();}
function renderGrammar(){
  if(gi>=gPool.length){
    $('gbox').innerHTML=`<div class="empty-state">🎊 這組全部完成！<br>答對 ${gKnown.size}/${gPool.length}</div><button class="next-btn" onclick="buildGPool();renderGrammar()">再做一次</button>`;
    return;
  }
  const q=gPool[gi];
  gAnswered=false;
  const gLabel=q.g===0?'い形容詞':`グループ${q.g}`;
  $('gbox').innerHTML=`<div class="g-question">${q.base}</div><div class="g-type-label">${GRAMMAR_TYPES[gType].name}に変えてください（${gLabel}）</div><input class="g-input" id="ginput" placeholder="ここに入力..." autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" /><button class="g-submit" onclick="checkG()">確認答案</button><div id="gres"></div><button class="next-btn" id="gnext" style="display:none" onclick="gi++;renderGrammar()">次の問題 →</button>`;
  setTimeout(()=>{const el=$('ginput');if(el){el.focus();el.addEventListener('keydown',e=>{if(e.key==='Enter')checkG();});}},100);
  updateGStats();
}
function checkG(){
  if(gAnswered)return;
  const inp=$('ginput');if(!inp)return;
  const val=inp.value.trim();if(!val)return;
  gAnswered=true;inp.disabled=true;
  const q=gPool[gi];
  if(val===q.ans){gKnown.add(gi);$('gres').innerHTML=`<div class="g-res ok">✅ 正確！${q.base} → ${q.ans}</div>`;}
  else{gForgot.add(gi);$('gres').innerHTML=`<div class="g-res ng">❌ 答錯。正確：<strong>${q.ans}</strong></div>`;}
  $('gnext').style.display='block';
  updateGStats();saveProgress();
}
function updateGStats(){
  const t=gKnown.size+gForgot.size;
  $('sg-t').textContent=t;$('sg-k').textContent=gKnown.size;$('sg-f').textContent=gForgot.size;
  $('gp').style.width=Math.round((t/Math.max(gPool.length,1))*100)+'%';
}

// ===== REVIEW =====
function setRTab(t){
  rTab=t;
  ['vocab','grammar'].forEach(x=>{
    $('rv-'+x).style.display=x===t?'block':'none';
    $('rt-'+x).classList.toggle('active',x===t);
  });
}
function renderReview(){
  // Vocab review
  const vlist=[...vForgot].map(i=>pool[i]).filter(Boolean);
  $('rv-vocab').innerHTML=vlist.length===0
    ?`<div class="empty-state">🎉 沒有需要複習的單字！<br>繼續保持！</div>`
    :vlist.map(w=>`<div class="rev-item"><div class="rev-row">${tagH(w.tag)}<span class="rev-jp">${w.jp}</span><span class="rev-rd">${w.rd}</span><button class="rev-speak" onclick="speak('${w.jp}')">🔊</button></div><div class="rev-mn">${w.mn}</div><div class="mem-box"><div class="mem-label">記憶技巧</div><div class="mem-text">${w.mem}</div></div></div>`).join('');
  // Grammar review
  const glist=[...gForgot].map(i=>gPool[i]).filter(Boolean);
  $('rv-grammar').innerHTML=glist.length===0
    ?`<div class="empty-state">🎉 沒有需要複習的文法！<br>繼續保持！</div>`
    :glist.map(q=>`<div class="rev-item"><div class="rev-row"><span class="rev-jp" style="font-size:20px">${q.base}</span><span style="font-size:12px;color:rgba(255,255,255,0.35)">${GRAMMAR_TYPES[q.type]?.name}</span></div><div class="rev-ans">${q.base} → <strong>${q.ans}</strong></div></div>`).join('');
}

// ===== PWA INSTALL PROMPT =====
let deferredPrompt=null;
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();deferredPrompt=e;
  const banner=document.createElement('div');
  banner.className='install-banner';
  banner.innerHTML=`<div class="install-text"><strong>加到主畫面</strong>像App一樣使用，可離線學習</div><button class="install-yes" onclick="installApp()">安裝</button><button class="install-no" onclick="this.parentElement.remove()">✕</button>`;
  document.body.appendChild(banner);
});
function installApp(){
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(()=>{deferredPrompt=null;document.querySelector('.install-banner')?.remove();});
}

// ===== INIT =====
loadProgress();
renderFTags();
buildPool();
renderCard();
$('grule').innerHTML=GRAMMAR_TYPES['te'].rule;
renderGTabs();
buildGPool();
lPool=sh([...VOCAB]);
// Pre-load voices
if(window.speechSynthesis){window.speechSynthesis.getVoices();window.speechSynthesis.onvoiceschanged=()=>{};}

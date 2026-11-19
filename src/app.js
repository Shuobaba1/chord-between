
(()=>{
'use strict';
const root=document.getElementById('pop-bass-lab'),get=id=>root.querySelector('#pbl-'+id);
const keys=[['C',0],['D♭',1],['D',2],['E♭',3],['E',4],['F',5],['F♯',6],['G',7],['A♭',8],['A',9],['B♭',10],['B',11]];
const letters=['C','D','E','F','G','A','B'],natural=[0,2,4,5,7,9,11],scale=[0,2,4,5,7,9,11];
const intervals={'':[0,4,7],m:[0,3,7],'7':[0,4,7,10],maj7:[0,4,7,11],m7:[0,3,7,10],'m7♭5':[0,3,6,10],'7sus4':[0,5,7,10]};
const tuning=[40,45,50,55,59,64],mod=n=>(n%12+12)%12;
let state={key:0,recipe:'1645',target:1,color:true,extra:'secondary',tone:'nylon',rhythm:'down',bpm:84,rangeStart:1,rangeEnd:0,mode:'current',loop:false,preference:'low',voicings:{}},selected=0,sequence=[],context=null,nodes=[],timers=[],run=0;
const templates={
 '':[[4,[0,2,2,1,0,0]],[9,[-1,0,2,2,2,0]],[2,[-1,-1,0,2,3,2]],[0,[-1,3,2,0,1,0]],[7,[3,2,0,0,0,3]]],
 m:[[4,[0,2,2,0,0,0]],[9,[-1,0,2,2,1,0]],[2,[-1,-1,0,2,3,1]]],
 '7':[[4,[0,2,0,1,0,0]],[9,[-1,0,2,0,2,0]],[2,[-1,-1,0,2,1,2]],[0,[-1,3,2,3,1,0]],[7,[3,2,0,0,0,1]]],
 maj7:[[4,[0,2,1,1,0,0]],[9,[-1,0,2,1,2,0]],[0,[-1,3,2,0,0,0]],[5,[-1,-1,3,2,1,0]]],
 m7:[[4,[0,2,0,0,0,0]],[9,[-1,0,2,0,1,0]],[2,[-1,-1,0,2,1,1]]],
 'm7♭5':[[11,[-1,2,3,2,3,-1]],[6,[2,-1,2,2,1,-1]]],
 '7sus4':[[4,[0,2,0,2,0,0]],[9,[-1,0,2,0,3,0]],[2,[-1,-1,0,2,1,3]]]
};
const slashTemplates={'':[[7,4,[-1,2,0,0,3,3]],[0,4,[0,3,2,0,1,0]]],m:[[4,3,[3,2,2,0,0,0]]],'7':[[0,7,[3,3,2,3,1,0]]]};
function spell(pc,letter){const i=mod(letter)%7;let diff=mod(pc-natural[i]);if(diff>6)diff-=12;return letters[i]+(diff>0?'♯'.repeat(diff):'♭'.repeat(-diff));}
function keyData(){return {pc:keys[state.key][1],letter:letters.indexOf(keys[state.key][0][0])};}
function degree(d){const k=keyData();return {pc:mod(k.pc+scale[d]),letter:(k.letter+d)%7};}
function note(pc,letter){return {pc:mod(pc),letter:(letter+7)%7,name:spell(mod(pc),(letter+7)%7)};}
function chord(rootNote,q,fn,detail,beats=4,bassNote=null){const n=note(rootNote.pc,rootNote.letter),bass=bassNote?note(bassNote.pc,bassNote.letter):n;return {pc:n.pc,letter:n.letter,q,name:n.name+q+(bass.pc!==n.pc?'/'+bass.name:''),bass,fn,detail,beats};}

const patterns={'1564':[0,4,5,3],'6415':[5,3,0,4],'4536':[3,4,2,5],'1645':[0,5,3,4],'4536251':[3,4,2,5,1,4,0],line:[0,4,5,2,3,0,1,4,0]};
function basic(){return patterns[state.recipe].map((d,i)=>{
 const minor=[1,2,5].includes(d),bass=state.recipe==='line'?({1:6,3:4,5:2}[i]):undefined;
 return chord(degree(d),minor?'m':'',['I','ii','iii','IV','V','vi','vii°'][d],bass!==undefined?'转位和弦：斜杠后面的音为最低音，连接前后的低音。':'基本进行：保持四拍，先听清和弦之间的关系。',4,bass!==undefined?degree(bass):null);
});}
function build(){
 const base=basic();if(!state.color||state.extra==='none')return base;
 if(state.extra==='seventh')return base.map(c=>c.bass.pc===c.pc?chord(c,c.q==='m'?'m7':c.pc===degree(4).pc?'7':'maj7',c.fn+'7','加入七音，增加和声色彩；实际弹唱时留意旋律是否相容。'):c);
 if(state.extra==='minoriv'){
  const i=base.findIndex(c=>c.pc===degree(3).pc&&c.q==='');
  if(i>=0){base[i].beats=2;base.splice(i+1,0,chord(degree(3),'m','iv（借用）','四级大和弦变小，和弦三音下降半音。这里作为连接色彩，并非所有后续和弦都构成 iv–I 终止。',2));}return base;
 }
 const target=Math.max(1,Math.min(state.target,base.length-1)),t=base[target],before=base[target-1],minor=t.q==='m';
 const dom={pc:mod(t.pc+7),letter:(t.letter+4)%7},pre={pc:mod(t.pc+2),letter:(t.letter+1)%7};
 const v=chord(dom,'7','V7 → '+t.name,'属七和弦引向 '+t.name+'；变化音带来更明确的解决感。',2);
 if(state.extra==='secondary'){before.beats=2;base.splice(target,0,v);}
 if(state.extra==='251')base.splice(target-1,1,chord(pre,minor?'m7♭5':'m7',minor?'局部 iiø7':'局部 ii7','将原来目标前的一小节替换为 ii–V；把 '+t.name+' 当作临时落点。',2),v);
 if(state.extra==='sus'){before.beats=2;v.beats=1;base.splice(target,0,chord(dom,'7sus4','V7sus4','挂留四音暂时代替三音，接着释放到同根音属七，再解决到 '+t.name+'。',1),v);}
 return base;
}


function chordKey(c){return c.pc+':'+c.q+':'+c.bass.pc;}
// Only established open shapes and movable E/A families are transposed.
// C/G/D open grips are not mechanically shifted into large stretches.
const movable={
 '':[[4,[0,2,2,1,0,0]],[9,[-1,0,2,2,2,0]]],
 m:[[4,[0,2,2,0,0,0]],[9,[-1,0,2,2,1,0]]],
 '7':[[4,[0,2,0,1,0,0]],[9,[-1,0,2,0,2,0]]],
 maj7:[[4,[0,-1,1,1,0,-1]],[9,[-1,0,2,1,2,0]]],
 m7:[[4,[0,2,0,0,0,0]],[9,[-1,0,2,0,1,0]]],
 'm7♭5':[[11,[-1,2,3,2,3,-1]],[6,[2,-1,2,2,1,-1]]],
 '7sus4':[[4,[0,2,0,2,0,0]],[9,[-1,0,2,0,3,0]]]
};
const movableSlash={'':[[0,4,[-1,-1,2,0,1,0]],[7,4,[-1,2,0,0,3,3]]],m:[[4,3,[3,2,2,0,0,0]]]};
// Conservative plan: at most one barre, with no open/lower-fretted string
// under it, and at most four fretting fingers. No thumb-dependent grips.
function handPlan(frets){
 const pressed=frets.map((f,i)=>({f,i})).filter(x=>x.f>0);
 if(!pressed.length)return {fingers:0,barre:null};
 const lo=Math.min(...pressed.map(x=>x.f)),hi=Math.max(...pressed.map(x=>x.f));
 if(hi>12||hi-lo>3)return null;
 let best={fingers:pressed.length,barre:null};
 for(const fret of new Set(pressed.map(x=>x.f)))for(let a=0;a<6;a++)for(let b=a+1;b<6;b++){
  if(frets[a]!==fret||frets[b]!==fret||frets.slice(a,b+1).some(x=>x>=0&&x<fret))continue;
  const covered=pressed.filter(x=>x.i>=a&&x.i<=b&&x.f===fret).length;
  const fingers=pressed.length-covered+1;
  if(fingers<best.fingers)best={fingers,barre:{fret,from:a,to:b}};
 }
 return best.fingers<=4?best:null;
}
function shapeOptions(c){
 const diff=mod(c.bass.pc-c.pc),result=[],seen=new Set();
 const openPool=diff===0?templates[c.q]:(slashTemplates[c.q]||[]).filter(t=>t[1]===diff).map(t=>[t[0],t[2]]);
 const movePool=diff===0?movable[c.q]:(movableSlash[c.q]||[]).filter(t=>t[1]===diff).map(t=>[t[0],t[2]]);
 const candidates=[];
 for(const [r,f] of openPool||[])if(r===c.pc)candidates.push(f);
 for(const [r,f] of movePool||[]){
  const shift=mod(c.pc-r);
  for(const delta of [shift,shift-12])if(f.every(x=>x<0||x+delta>=0))candidates.push(f.map(x=>x<0?-1:x+delta));
 }
 for(const full of candidates)for(let cut=0;cut<=3;cut++){
  const frets=full.map((v,i)=>i<cut?-1:v),id=frets.join(','),hand=handPlan(frets);
  const sounds=frets.flatMap((v,i)=>v<0?[]:[mod(tuning[i]+v)]),essential=intervals[c.q].filter(v=>v!==7).map(v=>mod(c.pc+v));
  if(!hand||seen.has(id)||sounds.length<3||sounds[0]!==c.bass.pc||!essential.every(p=>sounds.includes(p))||!sounds.every(p=>intervals[c.q].some(v=>mod(c.pc+v)===p)))continue;
  const positive=frets.filter(v=>v>0),max=Math.max(0,...positive),min=Math.min(...positive),open=frets.includes(0),compact=sounds.length<=4;
  seen.add(id);result.push({id,frets,hand,open,compact,center:positive.length?positive.reduce((a,b)=>a+b,0)/positive.length:0,score:max+hand.fingers*.2+(max-min)*.3+(cut?3:0),label:(open?'开放把位':compact?'紧凑把位':'封闭把位')+' · '+frets.map(x=>x<0?'×':x).join(' ')});
 }
 return result.sort((a,b)=>a.score-b.score);
}

function shape(c){
 const options=shapeOptions(c),manual=options.find(o=>o.id===state.voicings?.[chordKey(c)]);if(manual)return manual.frets;
 if(c._frets&&options.some(o=>o.id===c._frets.join(',')))return c._frets;
 if(state.preference==='easy')return options.slice().sort((a,b)=>(a.open?0:a.compact?5:12)+a.score*.15-((b.open?0:b.compact?5:12)+b.score*.15))[0].frets;
 return options[0].frets;
}
function assignShapes(chords){let center=2;return chords.map(c=>{const copy={...c};delete copy._frets;const options=shapeOptions(copy),manual=options.find(o=>o.id===state.voicings?.[chordKey(copy)]);
 const selected=manual||(state.preference==='close'?options.slice().sort((a,b)=>Math.abs(a.center-center)+a.score*.12-(Math.abs(b.center-center)+b.score*.12))[0]:options.find(o=>o.id===shape(copy).join(',')));
 copy._frets=selected.frets;center=selected.center;return copy;});}

function toneNames(c){const steps=c.q==='7sus4'?[0,3,4,6]:intervals[c.q].length===3?[0,2,4]:[0,2,4,6];return intervals[c.q].map((v,i)=>spell(mod(c.pc+v),(c.letter+steps[i])%7));}
function drawChord(){
 const c=sequence[selected],f=shape(c),positive=f.filter(v=>v>0),start=Math.max(...f)<=4?1:Math.min(...positive),count=Math.max(4,Math.max(...f)-start+1),height=240;
 let svg='<svg class="pbl-fretboard" viewBox="0 0 220 '+height+'" role="img" aria-label="'+c.name+'，6至1弦品数 '+f.map(v=>v<0?'不弹':v).join('、')+'"><title>'+c.name+' 参考把位</title>';
 const gap=140/count,hand=handPlan(f);
 if(hand?.barre){const b=hand.barre;svg+='<line stroke="currentColor" stroke-width="12" stroke-linecap="round" x1="'+(42+b.from*30)+'" x2="'+(42+b.to*30)+'" y1="'+(45+(b.fret-start+.5)*gap)+'" y2="'+(45+(b.fret-start+.5)*gap)+'"/>'; }
 get('hand-note').textContent=hand?.barre?'横按：第 '+hand.barre.fret+' 品，'+(6-hand.barre.from)+'–'+(6-hand.barre.to)+' 弦':'无需横按';
 for(let i=0;i<=count;i++){const y=45+i*gap;svg+='<line class="grid" x1="42" y1="'+y+'" x2="192" y2="'+y+'"/>';if(i<count)svg+='<text x="18" y="'+(y+gap/2)+'">'+(start+i)+'</text>';}
 f.forEach((v,i)=>{const x=42+i*30;svg+='<line class="grid" x1="'+x+'" x2="'+x+'" y1="45" y2="185"/><text x="'+x+'" y="207">'+(6-i)+'</text>';if(v<=0)svg+='<text x="'+x+'" y="25">'+(v<0?'×':'○')+'</text>';else svg+='<circle class="dot" cx="'+x+'" cy="'+(45+(v-start+.5)*gap)+'" r="9"/>';});
 get('fret').innerHTML=svg+'</svg>';get('chord-title').textContent=c.name;get('tones').textContent='和弦音：'+toneNames(c).join(' · ')+' ｜ 低音：'+c.bass.name;get('shape').innerHTML=shapeOptions(c).map(o=>'<option value="'+o.id+'">'+o.label+'</option>').join('');get('shape').value=f.join(',');const link=connectionAt(selected);get('detail').textContent=link?link.text:c.name+' · '+c.fn;get('connection').disabled=!link;
 root.querySelectorAll('[data-chord]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.chord)===selected)));
}


function targetAdvice(c){const d=scale.findIndex(x=>mod(keyData().pc+x)===c.pc);return {tier:c.bass.pc===c.pc&&[0,1,5].includes(d)?0:1,brief:['回主和弦','衔接 251','三级色彩','进入四级','加强属和弦','进入小和弦'][d]||'转位连接'};}
function fillTargets(){const b=basic();state.target=Math.max(1,Math.min(state.target,b.length-1));get('target').innerHTML=b.map((c,i)=>{if(!i)return '';const a=targetAdvice(c);return '<option data-tier="'+a.tier+'" value="'+i+'">'+(a.tier===0?'★ ':'')+'第'+(i+1)+'小节 · '+c.name+'</option>';}).join('');get('target').value=String(state.target);get('target-label').setAttribute('data-star',targetAdvice(b[state.target]).tier===0);}
function connectionAt(index){
 function pair(i){const a=sequence[i],b=sequence[i+1];if(!a||!b)return null;
  if(a.q==='7'&&mod(a.pc+5)===b.pc)return {index:i,text:a.name+' → '+b.name+' · 属七解决'};
  if(a.q==='7sus4'&&a.pc===b.pc&&b.q==='7')return {index:i,text:a.name+' → '+b.name+' · 挂留释放'};
  if(a.pc===b.pc&&a.q===''&&b.q==='m')return {index:i,text:a.name+' → '+b.name+' · 大转小'};
  return null;
 }return pair(index)||pair(index-1);
}
function clipRange(chords){const begin=(state.rangeStart-1)*4,end=state.rangeEnd*4;let elapsed=0;return chords.flatMap(c=>{const start=elapsed;elapsed+=c.beats;const lo=Math.max(start,begin),hi=Math.min(elapsed,end);return hi>lo?[{...c,beats:hi-lo,_offset:lo}]:[];});}
function renderSequence(chords,label='当前版本'){
 sequence=assignShapes(chords);selected=Math.min(selected,sequence.length-1);let elapsed=0;const original=basic();
 get('rows').innerHTML=sequence.map((c,i)=>{const offset=c._offset??elapsed,bar=Math.floor(offset/4),old=original[bar],changed=old&&old.name!==c.name;elapsed+=c.beats;
 return '<tr data-step="'+i+'" class="'+(changed?'changed':'unchanged')+'"><td>'+(bar+1)+'.'+(offset%4+1)+'／'+c.beats+'拍</td><td>'+(changed?'<span class="was">'+old.name+' →</span>':'')+'<button class="btn" type="button" data-chord="'+i+'" aria-pressed="false">'+c.name+'</button></td><td>'+c.fn+'</td></tr>';}).join('');
 get('route').textContent=label+' · 低音 '+sequence.map(c=>c.bass.name).join(' → ');drawChord();
}
function fillPractice(){const count=basic().length;state.rangeStart=Math.min(Math.max(1,state.rangeStart||1),count);state.rangeEnd=state.rangeEnd?Math.max(state.rangeStart,Math.min(state.rangeEnd,count)):count;
 const options=basic().map((c,i)=>'<option value="'+(i+1)+'">'+(i+1)+' · '+c.name+'</option>').join('');get('range-start').innerHTML=options;get('range-end').innerHTML=options;get('range-start').value=String(state.rangeStart);get('range-end').value=String(state.rangeEnd);get('mode').value=state.mode;get('loop').checked=state.loop;get('preference').value=state.preference;
 get('practice-summary').textContent=state.rangeStart+'–'+state.rangeEnd+' 小节 · '+({current:'当前',original:'原版',alternate:'交替'}[state.mode])+(state.loop?' · 循环':'');
}

const rhythms={
 down:{actions:['D','-','D','-','D','-','D','-'],labels:['↓','·','↓','·','↓','·','↓','·'],note:'每拍下扫；第 1、3 拍稍强。↓ 下扫，↑ 上扫，· 不触弦，× 闷切。'},
 folk:{actions:['D','-','D','U','-','U','D','U'],labels:['↓','·','↓','↑','·','↑','↓','↑'],note:'下—下上—上下上。上扫只触及有效高音弦；空拍手仍持续摆动。'},
 arp:{actions:['B','3','2','1','2','3','2','1'],labels:['低','③','②','①','②','③','②','①'],note:'低＝当前把位最低音；圈内数字为标准弦号。所选弦不弹时，使用邻近有效弦。'},
 muted:{actions:['D','-','X','U','-','U','X','U'],labels:['↓','·','×','↑','·','↑','×','↑'],note:'第 2、4 拍短促闷切。× 使用短音模拟触弦消音；新和弦接着小节拍点弹。'}
};
const songExamples={
 "1564": [
  [
   "Let It Be",
   "The Beatles",
   "前奏／主歌开头",
   "C – G – Am – F；后半句改变，不是整首无限循环。",
   "https://openguitarchords.com/songs/let-it-be-chords"
  ],
  [
   "I'm Yours",
   "Jason Mraz",
   "主要循环",
   "B – F♯ – G♯m – E；另有过渡和弦。",
   "https://spytunes.com/im-yours-chords/"
  ]
 ],
 "1645": [
  [
   "Stand by Me",
   "Ben E. King",
   "主要循环",
   "A – F♯m – D – E；原曲和弦时值不同于本工具的等长练习。",
   "https://www.theguitarlesson.com/guitar-lessons/stand-by-me-guitar-lesson-ben-e-king/"
  ],
  [
   "Blue Moon",
   "经典流行标准曲",
   "常见弹唱骨架",
   "I–vi–IV–V 的经典用法；不同演唱版本有转调及替代和弦。",
   "https://www.fender.com/articles/chords/guitar-chords-that-sound-good-together"
  ]
 ],
 "4536": [
  [
   "三人游",
   "方大同",
   "副歌循环",
   "F – G – Em – Am；主歌是另一种进行。",
   "https://chord4.com/tabs/535"
  ],
  [
   "演员",
   "薛之谦",
   "副歌前半句",
   "C – D/C – Bm – Em（G 调指法）；后续接 ii–V–I。",
   "https://chord4.com/tabs/33762"
  ]
 ],
 "6415": [
  [
   "平凡之路",
   "朴树",
   "副歌骨架",
   "G 调指法：Em – C – G – D；部分句尾改为 G。",
   "https://chord4.com/tabs/2525"
  ],
  [
   "Zombie",
   "The Cranberries",
   "主要循环",
   "Em – C – G – D/F♯；实际以 E 小调为中心，此处按相对大调编号，练习简化了末尾低音。",
   "https://richterguitar.com/zombie-the-cranberries/"
  ]
 ],
 "4536251": [
  [
   "演员",
   "薛之谦",
   "副歌骨架",
   "G 调指法：C – D/C – Bm – Em – Am – D – G；练习简化了 D/C 的低音与过渡。",
   "https://chord4.com/tabs/33762"
  ],
  [
   "你还要我怎样",
   "薛之谦",
   "主歌后半句",
   "C 调指法：Fmaj7 – G – Em – Am7 – Dm7 – G – C；可用七和弦选项比较色彩。",
   "https://chord4.com/tabs/37013"
  ]
 ],
 "line": [
  [
   "Piano Man",
   "Billy Joel",
   "下行低音技法参考",
   "低音沿 C 大调下行；和弦及原曲三拍子与本工具四拍教学进行不同。",
   "https://www.guitarworld.com/lessons/songwriting-tips-pairing-chords-with-walking-down-bass-lines-like-piano-man"
  ],
  [
   "Friend of the Devil",
   "Grateful Dead",
   "下行低音技法参考",
   "前奏和主歌使用 G 大调下行音阶与转位连接；不是本预设逐和弦复刻。",
   "https://www.guitarworld.com/lessons/songwriting-tips-pairing-chords-with-walking-down-bass-lines-like-piano-man"
  ]
 ]
};
function renderSongs(){
 const items=songExamples[state.recipe];
 get('song-summary').textContent='歌曲参考 · '+items.map(s=>'《'+s[0]+'》').join(' / ');
 get('songs').innerHTML=items.map(s=>'<p><strong>'+s[1]+' · '+s[0]+'</strong> <span class="text-small">'+s[2]+'</span><br>'+s[3]+' <a href="'+s[4]+'" target="_blank" rel="noopener noreferrer">查看来源 ↗</a></p>').join('');
}
function render(){
 renderSongs();
 get('rhythm').value=state.rhythm;const rhythm=rhythms[state.rhythm];get('pattern').innerHTML=['1','&','2','&','3','&','4','&'].map((beat,i)=>'<span>'+beat+'<strong>'+rhythm.labels[i]+'</strong></span>').join('');get('pattern-note').textContent=rhythm.note;

 get('tone').value=state.tone;get('key').value=String(state.key);get('recipe').value=state.recipe;get('color').checked=state.color;get('bpm').value=String(state.bpm);get('bpm-value').textContent=state.bpm+' BPM';fillTargets();
 get('extra').value=state.extra;get('target-label').hidden=!['secondary','251','sus'].includes(state.extra);get('color-label').hidden=state.extra==='none';get('method').textContent=methodText();
 fillPractice();renderSequence(clipRange(state.mode==='original'?basic():build()),state.mode==='original'?'原版':'当前版本');
}


function methodText(){if(!state.color||state.extra==='none')return '点和弦看把位。';return {seventh:'七音增色。',secondary:'目标前加入属七。','251':'目标前替换为 ii–V。',sus:'挂四 → 属七 → 目标。',minoriv:'四级由大转小。'}[state.extra]+' ★ 常用落点';}

function save(){try{localStorage.setItem('guitar-lab-v1',JSON.stringify({version:1,state}));}catch(e){get('status').textContent='浏览器未允许自动保存，可使用“导出练习”。';}}
function restore(data){const s=data?.state;if(!s||data.version!==1)throw Error('不是本工具的 v1 练习文件');
 if(!Number.isInteger(s.key)||s.key<0||s.key>=12||!Object.hasOwn(patterns,s.recipe)||!['none','seventh','secondary','251','sus','minoriv'].includes(s.extra)||!Number.isInteger(s.target)||s.target<1||s.target>=patterns[s.recipe].length||!Number.isFinite(s.bpm)||s.bpm<50||s.bpm>130||typeof s.color!=='boolean')throw Error('练习文件内容不完整或参数超出范围');
 state={key:[0,2,4,5,7,9,11].includes(s.key)?s.key:s.key-1,recipe:s.recipe,target:s.target,extra:s.extra,color:s.color,bpm:s.bpm,tone:['nylon','epiano','acoustic'].includes(s.tone)?s.tone:'nylon',rhythm:['down','folk','arp','muted'].includes(s.rhythm)?s.rhythm:'down',rangeStart:Number.isInteger(s.rangeStart)?Math.max(1,s.rangeStart):1,rangeEnd:Number.isInteger(s.rangeEnd)?Math.max(0,s.rangeEnd):0,mode:['current','original','alternate'].includes(s.mode)?s.mode:'current',loop:s.loop===true,preference:['low','easy','close'].includes(s.preference)?s.preference:'low',voicings:s.voicings&&typeof s.voicings==='object'?Object.fromEntries(Object.entries(s.voicings).slice(0,100).filter(([k,v])=>typeof v==='string'&&v.length<40&&/^[-0-9,]+$/.test(v))):{}};selected=0;
}

function stop(){run++;timers.forEach(clearTimeout);timers=[];nodes.forEach(n=>{try{n.stop();}catch(e){}});nodes=[];root.querySelectorAll('[data-step]').forEach(r=>r.removeAttribute('data-playing'));get('stop').disabled=true;get('play').disabled=false;get('bass').disabled=false;get('status').textContent='4/4 拍 · 已停止';}

const audioCache=new Map();
function synthesize(midi,duration,tone,rate){
 const frequency=440*Math.pow(2,(midi-69)/12),count=Math.ceil(rate*duration),data=new Float32Array(count),tau=Math.PI*2;
 if(tone==='nylon'){
  // Deterministic plucked-string partials: warm fundamental, short upper harmonics,
  // no randomly dominant modes or frequency drift from the former delay loop.
  const harmonics=Math.min(14,Math.floor(rate*.45/frequency));
  for(let harmonic=1;harmonic<=harmonics;harmonic++){
   const amplitude=Math.sin(Math.PI*harmonic*.19)/Math.pow(harmonic,1.55);
   const decay=(.12+2.7/Math.pow(harmonic,.85))*Math.pow(220/frequency,.18);
   const step=tau*frequency*harmonic/rate,fade=Math.exp(-1/(rate*decay));
   let envelope=amplitude,phase=0;
   for(let n=0;n<count;n++){data[n]+=envelope*Math.sin(phase);phase+=step;envelope*=fade;}
  }
  for(let n=0;n<count;n++){const t=n/rate;data[n]*=Math.min(1,t/.0018)*Math.min(1,(duration-t)/.045);}
 }else if(tone==='epiano'){

  for(let n=0;n<count;n++){const t=n/rate,phase=tau*frequency*t,env=Math.exp(-t/2.1);
   const body=Math.sin(phase+1.45*Math.exp(-t/0.22)*Math.sin(phase*2));
   const bell=.16*Math.exp(-t/.38)*Math.sin(phase*7);
   data[n]=(body*env+bell)*Math.min(1,t/.004)*Math.min(1,(duration-t)/.055);
  }
 }else{
  const nylon=tone==='nylon',delay=rate/frequency-.5,seedLength=Math.ceil(delay)+2;
  let seed=(midi*7919+37)>>>0,last=0;
  for(let n=0;n<Math.min(count,seedLength);n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;
   last=(nylon?.72:.22)*last+(nylon?.28:.78)*noise;data[n]=last+.18*Math.sin(tau*n/(delay+.5));
  }
  const feedback=nylon?.996:.998;
  function at(position){const i=Math.floor(position),f=position-i;return data[i]*(1-f)+data[i+1]*f;}
  for(let n=seedLength;n<count;n++)data[n]=feedback*.5*(at(n-delay)+at(n-delay-1));
  for(let n=0;n<count;n++){const t=n/rate;data[n]=(data[n]+.055*Math.sin(tau*frequency*t)*Math.exp(-t/(nylon?1.2:1.8)))*Math.exp(-t/(nylon?2.8:4))*Math.min(1,t/.002)*Math.min(1,(duration-t)/.045);}
 }
 let peak=0;for(const x of data)peak=Math.max(peak,Math.abs(x));const gain=.85/Math.max(.01,peak);for(let i=0;i<count;i++)data[i]*=gain;return data;
}
function sound(midi,time,duration,bass,velocity=1){
 const tone=state.tone,key=[tone,midi,duration.toFixed(4),context.sampleRate].join(':');let buffer=audioCache.get(key);
 if(!buffer){const samples=synthesize(midi,duration,tone,context.sampleRate);buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.getChannelData(0).set(samples);if(audioCache.size>=48)audioCache.delete(audioCache.keys().next().value);audioCache.set(key,buffer);}
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=(bass?.23:.14)*velocity;source.connect(gain);gain.connect(context.destination);source.onended=()=>{source.disconnect();gain.disconnect();nodes=nodes.filter(n=>n!==source);};source.start(time);source.stop(time+duration+.01);nodes.push(source);
}
function voicing(c,previous){
 const ints=intervals[c.q],tones=ints.length===3?[...ints,12]:ints,candidates=[];
 for(let octave=3;octave<=5;octave++)for(let rotation=0;rotation<4;rotation++){
  const base=12*(octave+1)+c.pc,arr=tones.map(x=>base+x);for(let i=0;i<rotation;i++)arr.push(arr.shift()+12);
  if(arr[0]>=48&&arr[3]<=83)candidates.push(arr);
 }
 candidates.sort((a,b)=>a.reduce((v,x,i)=>v+Math.abs(x-(previous?.[i]||[55,60,64,69][i])),0)-b.reduce((v,x,i)=>v+Math.abs(x-(previous?.[i]||[55,60,64,69][i])),0));return candidates[0];
}

function guitarNotes(c){return shape(c).flatMap((fret,i)=>fret<0?[]:[{midi:tuning[i]+fret,string:6-i,fret}]);}

function playbackPlan(chords,beat,tone,bassOnly,rhythmName='down'){
 const notes=[],steps=[],ranges=[];let beats=0;
 chords.forEach((c,index)=>{ranges.push({c,index,start:beats,end:beats+c.beats});steps.push({index,offset:beats*beat});beats+=c.beats;});
 const actions=rhythms[rhythmName].actions,events=[];
 for(let tick=0;tick<beats*2;tick++){
  const position=tick/2,range=ranges.find(r=>position>=r.start&&position<r.end),action=bassOnly?(tick%2===0?'B':'-'):actions[tick%8];
  if(action!=='-')events.push({position,range,action,tick});
 }
 events.forEach((event,i)=>{
  const {range,action,position,tick}=event,strings=guitarNotes(range.c),offset=position*beat;
  const next=events[i+1]?.position??beats,boundary=Math.min(range.end,next),length=(boundary-position)*beat;
  let voices=strings;
  if(action==='U')voices=strings.filter(s=>s.string<=3).slice().reverse();
  else if(action==='B')voices=strings.slice(0,1);
  else if(['1','2','3'].includes(action)){const wanted=Number(action);voices=[strings.find(s=>s.string===wanted)||strings.reduce((a,b)=>Math.abs(a.string-wanted)<=Math.abs(b.string-wanted)?a:b)];}
  const muted=action==='X',spacing=voices.length===1?0:Math.min(muted?.003:tone==='epiano'?.004:.018,length/(voices.length+2));
  voices.forEach((v,j)=>notes.push({midi:v.midi,string:v.string,step:range.index,stroke:tick,action,offset:offset+j*spacing,duration:muted?.045:Math.max(.025,length-j*spacing-.015),bass:bassOnly,velocity:muted?.65:action==='U'?.72:rhythmName==='arp'?1.25:tick%4===0?1:.84}));
 });return {notes,steps,duration:beats*beat};
}

function later(fn,delay){let id=setTimeout(()=>{timers=timers.filter(t=>t!==id);fn();},Math.max(0,delay));timers.push(id);}
async function play(bassOnly,custom=null){
 stop();const token=run;get('play').disabled=true;get('bass').disabled=true;get('stop').disabled=false;
 try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');context=context||new AC();await context.resume();if(token!==run)return;
  const originals=assignShapes(clipRange(basic())),rich=assignShapes(clipRange(build()));
  const variants=custom?[{name:'连接',chords:assignShapes(custom)}]:state.mode==='alternate'?[{name:'原版',chords:originals},{name:'丰富版',chords:rich}]:[{name:state.mode==='original'?'原版':'当前版本',chords:state.mode==='original'?originals:rich}];
  audioCache.clear();for(const v of variants){v.plan=playbackPlan(v.chords,60/state.bpm,state.tone,bassOnly,state.rhythm);for(const n of v.plan.notes){const key=[state.tone,n.midi,n.duration.toFixed(4),context.sampleRate].join(':');if(!audioCache.has(key)){const samples=synthesize(n.midi,n.duration,state.tone,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.getChannelData(0).set(samples);audioCache.set(key,buffer);}}}
  function schedule(cycle,start){if(token!==run)return;const v=variants[cycle%variants.length];
   for(const n of v.plan.notes)sound(n.midi,start+n.offset,n.duration,n.bass,n.velocity);
   later(()=>{if(token!==run)return;selected=0;renderSequence(v.chords,v.name);},(start-context.currentTime)*1000);
   for(const step of v.plan.steps)later(()=>{if(token!==run)return;selected=step.index;drawChord();root.querySelectorAll('[data-step]').forEach(r=>r.removeAttribute('data-playing'));root.querySelector('[data-step="'+step.index+'"]').setAttribute('data-playing','true');get('status').textContent=v.name+' · '+sequence[step.index].name+(state.loop&&!custom?' · 循环中':'');},(start+step.offset-context.currentTime)*1000);
   const end=start+v.plan.duration,again=(!custom&&state.loop)||cycle+1<variants.length;
   if(again)later(()=>schedule(cycle+1,end),(end-context.currentTime-.2)*1000);
   else later(()=>{if(token===run)stop();},(end-context.currentTime+.06)*1000);
  }schedule(0,context.currentTime+.12);
 }catch(e){stop();get('status').textContent='无法播放，请重新选择后再试。';}
}

get('key').innerHTML=keys.map((k,i)=>[0,2,4,5,7,9,11].includes(i)?'<option value="'+i+'">'+k[0]+' 大调</option>':'').join('');
get('rhythm').addEventListener('change',()=>{stop();state.rhythm=get('rhythm').value;render();save();});
get('tone').addEventListener('change',()=>{stop();state.tone=get('tone').value;render();save();});
get('key').addEventListener('change',()=>{stop();state.key=Number(get('key').value);render();save();});
get('recipe').addEventListener('change',()=>{stop();state.recipe=get('recipe').value;state.rangeStart=1;state.rangeEnd=0;state.target=state.recipe==='1645'?1:patterns[state.recipe].length-1;selected=0;render();save();});
get('target').addEventListener('change',()=>{stop();state.target=Number(get('target').value);render();save();});
get('color').addEventListener('change',()=>{stop();state.color=get('color').checked;render();save();});
get('bpm').addEventListener('input',()=>{stop();state.bpm=Number(get('bpm').value);get('bpm-value').textContent=state.bpm+' BPM';});get('bpm').addEventListener('change',save);
get('rows').addEventListener('click',e=>{const b=e.target.closest('[data-chord]');if(!b)return;selected=Number(b.dataset.chord);drawChord();save();});
get('play').addEventListener('click',()=>{stop();render();play(false);});get('bass').addEventListener('click',()=>{stop();render();play(true);});get('stop').addEventListener('click',()=>{stop();render();});

get('extra').addEventListener('change',()=>{stop();state.extra=get('extra').value;state.color=true;selected=0;render();save();});

for(const id of ['range-start','range-end','mode','loop','preference'])get(id).addEventListener('change',()=>{stop();if(id==='range-start'){state.rangeStart=Number(get(id).value);state.rangeEnd=Math.max(state.rangeStart,state.rangeEnd);}if(id==='range-end'){state.rangeEnd=Number(get(id).value);state.rangeStart=Math.min(state.rangeStart,state.rangeEnd);}if(id==='mode')state.mode=get(id).value;if(id==='loop')state.loop=get(id).checked;if(id==='preference')state.preference=get(id).value;selected=0;render();save();});
get('shape').addEventListener('change',()=>{const c=sequence[selected];stop();state.voicings=state.voicings||{};state.voicings[chordKey(c)]=get('shape').value;sequence=assignShapes(sequence);drawChord();save();});
get('auto-shapes').addEventListener('click',()=>{stop();state.voicings={};sequence=assignShapes(sequence);drawChord();save();});
get('connection').addEventListener('click',()=>{const pair=connectionAt(selected);if(pair)play(false,sequence.slice(pair.index,pair.index+2).map(c=>({...c})));});

get('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:1,state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='吉他练习-'+keys[state.key][0]+'-'+state.recipe+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
get('import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('文件过大，请选择本工具导出的练习文件');const data=JSON.parse(await file.text());stop();restore(data);render();save();get('status').textContent='练习已载入';}catch(err){get('status').textContent='无法载入：'+err.message;}e.target.value='';});
window.addEventListener('pagehide',stop);
document.addEventListener?.('visibilitychange',()=>{if(document.hidden)stop();});
try{const saved=localStorage.getItem('guitar-lab-v1');if(saved)restore(JSON.parse(saved));}catch(e){}
render();

})();

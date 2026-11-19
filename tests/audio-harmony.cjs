const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8'),elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',dataset:{},events:{},addEventListener(n,f){this.events[n]=f},setAttribute(){},removeAttribute(){},querySelector:element,querySelectorAll(){return []}});return elements.get(id);}
let scheduled=[];
class AudioContext{constructor(){this.currentTime=0;this.sampleRate=22050;this.destination={}}resume(){return Promise.resolve()}createBuffer(c,n,r){const data=new Float32Array(n);return {getChannelData(){return data}}}createBufferSource(){return {connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {connect(){},disconnect(){},gain:{}}}}
const window={addEventListener(){},AudioContext},store={};
const ctx={document:{getElementById:element},window,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v},setTimeout(f){scheduled.push(f);return scheduled.length},clearTimeout(){}};
vm.createContext(ctx);
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
code=code.replace('try{const saved=localStorage', 'window.lab={targetAdvice,guitarNotes,playbackPlan,synthesize,build,basic,shape,toneNames,voicing,play,stop,render,save,restore,set:s=>{state={...state,...s}},get:()=>({state,sequence}),intervals,tuning};try{const saved=localStorage');
vm.runInContext(code,ctx);
const lab=window.lab;let sequences=0,chords=0;
for(const key of [0,2,4,5,7,9,11])for(const recipe of ['1645','1564','6415','4536','4536251','line'])for(const extra of ['none','seventh','secondary','251','sus','minoriv'])for(const color of [true,false]){
 lab.set({key,recipe,extra,color});
 for(let target=1;target<lab.basic().length;target++){
  lab.set({target});lab.render();const seq=lab.build();sequences++;
  assert.strictEqual(seq.reduce((v,c)=>v+c.beats,0),lab.basic().length*4,'total beats');
  let previous=null;
  for(const c of seq){const shape=lab.shape(c),pitches=shape.map((f,i)=>f<0?null:(lab.tuning[i]+f)%12).filter(x=>x!==null),allowed=lab.intervals[c.q].map(i=>(c.pc+i)%12);
   assert.strictEqual(pitches[0],c.bass.pc,c.name+' bass');
   for(const p of pitches)assert(allowed.includes(p),c.name+' extraneous tone');
   for(let i=0;i<allowed.length;i++)if(lab.intervals[c.q][i]!==7)assert(pitches.includes(allowed[i]),c.name+' missing tone');
   previous=lab.voicing(c,previous);assert(previous?.length===4);chords++;
  }
 }
}
lab.set({key:0,recipe:'1645',target:1,extra:'251',color:true});lab.render();assert.strictEqual(lab.build().map(c=>c.name).join(' '),'Bm7♭5 E7 Am F G');
lab.save();const saved=JSON.parse(store['guitar-lab-v1']);lab.restore(saved);assert.strictEqual(lab.get().state.extra,'251');assert.throws(()=>lab.restore({version:1,state:{...saved.state,target:999}}));
element('#pbl-recipe').value='4536251';element('#pbl-recipe').events.change();assert.strictEqual(lab.get().state.target,6);
assert.strictEqual((element('#pbl-key').innerHTML.match(/<option/g)||[]).length,7);
for(const tone of ['nylon','epiano','acoustic'])for(const midi of [40,60,83]){const data=lab.synthesize(midi,1,tone,22050);assert(data.every(Number.isFinite));let power=0,peak=0;for(const x of data){power+=x*x;peak=Math.max(peak,Math.abs(x));}assert(peak<.86&&power>1);assert(Math.abs(data[0])<.001);}
const nylon=lab.synthesize(60,1,'nylon',22050),acoustic=lab.synthesize(60,1,'acoustic',22050);assert(nylon.some((x,i)=>Math.abs(x-acoustic[i])>.1));
const d={pc:2,letter:1,q:'',bass:{pc:2},beats:4};
assert.strictEqual(lab.guitarNotes(d).map(n=>n.midi).join(','),'50,57,62,66');
assert.strictEqual(lab.guitarNotes(d).map(n=>n.string).join(','),'4,3,2,1');
for(const tone of ['nylon','epiano','acoustic']){
 const plan=lab.playbackPlan([d],.6,tone,false);assert.strictEqual(plan.notes.length,16);assert.strictEqual(plan.duration,2.4);
 assert.strictEqual(plan.notes.slice(0,4).map(n=>n.midi).join(','),'50,57,62,66');
 assert(plan.notes.every(n=>n.string<=4));for(let i=1;i<4;i++)assert(plan.notes[i].offset>plan.notes[i-1].offset);
 assert(plan.notes.every(n=>n.offset+n.duration<=plan.duration));
 const bass=lab.playbackPlan([d],.6,tone,true);assert.strictEqual(bass.notes.length,4);assert(bass.notes.every(n=>n.midi===50));
}
for(const [pc,count] of [[0,5],[4,6]])assert.strictEqual(lab.guitarNotes({pc,q:'',bass:{pc}}).length,count);
const divided=[{...d,beats:2},{...d,beats:1},{...d,beats:1}];
const folk=lab.playbackPlan(divided,.6,'nylon',false,'folk');
assert.strictEqual([...new Set(folk.notes.map(n=>n.stroke))].join(','),'0,2,3,5,6,7');
assert(folk.notes.filter(n=>n.action==='U').every(n=>n.string<=3));
assert.strictEqual(folk.notes.find(n=>n.stroke===5).step,1);
const arp=lab.playbackPlan([d],.6,'nylon',false,'arp');assert.strictEqual(arp.notes.length,8);assert.strictEqual(arp.notes.map(n=>n.string).join(','),'4,3,2,1,2,3,2,1');
const mute=lab.playbackPlan([d],.6,'nylon',false,'muted');assert(mute.notes.filter(n=>n.action==='X').every(n=>n.duration===.045));assert.strictEqual([...new Set(mute.notes.filter(n=>n.action==='X').map(n=>n.stroke))].join(','),'2,6');
(async()=>{for(const tone of ['nylon','epiano','acoustic'])for(const rhythm of ['down','folk','arp','muted']){lab.set({tone,rhythm});await lab.play(false);assert(!element('#pbl-status').textContent.includes('无法'));scheduled.forEach(f=>f());scheduled=[];lab.stop();await lab.play(true);lab.stop();lab.save();lab.restore(JSON.parse(store['guitar-lab-v1']));assert.strictEqual(lab.get().state.tone,tone);}console.log(JSON.stringify({sequences,chords,checks:'7 keys; harmony, duration, three distinct bounded audio waveforms, playback scheduling and tone persistence passed'}));})();



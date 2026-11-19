const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8'),elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{value:'',innerHTML:'',textContent:'',dataset:{},events:{},addEventListener(n,f){this.events[n]=f},setAttribute(){},removeAttribute(){},querySelector:element,querySelectorAll(){return []}});return elements.get(id);}
let scheduled=[],clock=0,nextId=1,started=0;
class AudioContext{constructor(){this.sampleRate=22050;this.destination={}}get currentTime(){return clock/1000}resume(){return Promise.resolve()}createBuffer(c,n,r){const data=new Float32Array(n);return {getChannelData(){return data}}}createBufferSource(){return {connect(){},disconnect(){},start(){started++},stop(){}}}createGain(){return {connect(){},disconnect(){},gain:{}}}}
const window={addEventListener(){},AudioContext},store={};
const ctx={document:{getElementById:element},window,localStorage:{getItem:k=>store[k],setItem:(k,v)=>store[k]=v},setTimeout(f,delay){const id=nextId++;scheduled.push({id,f,time:clock+delay});return id},clearTimeout(id){scheduled=scheduled.filter(t=>t.id!==id)}};
vm.createContext(ctx);
let code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
code=code.replace('try{const saved=localStorage', 'window.lab={handPlan,songExamples,patterns,shapeOptions,assignShapes,chordKey,clipRange,connectionAt,targetAdvice,guitarNotes,playbackPlan,synthesize,build,basic,shape,toneNames,voicing,play,stop,render,save,restore,set:s=>{state={...state,...s}},get:()=>({state,sequence}),intervals,tuning};try{const saved=localStorage');
vm.runInContext(code,ctx);

const lab=window.lab;let checked=0;
assert(!lab.shapeOptions({pc:9,q:'',bass:{pc:9}}).some(o=>o.id==='5,4,2,2,2,5'),'shifted G shape is outside the common grip allowlist');
assert.strictEqual(lab.handPlan([1,2,3,4,2,3]),null,'reject shapes requiring more than four fingers');
assert.strictEqual(lab.handPlan([1,5,6,2,3,4]),null,'reject oversized stretch');
assert.strictEqual(lab.handPlan([-1,1,0,1,0,1]).barre,null,'never barre through an open string');
assert(lab.handPlan([1,3,3,2,1,1]).barre,'standard F barre remains available');
for(const recipe of Object.keys(lab.patterns)){
 assert.strictEqual(lab.songExamples[recipe].length,2);
 element('#pbl-recipe').value=recipe;element('#pbl-recipe').events.change();
 assert(element('#pbl-song-summary').textContent.includes(lab.songExamples[recipe][0][0]));
 lab.save();lab.restore(JSON.parse(store['guitar-lab-v1']));assert.strictEqual(lab.get().state.recipe,recipe);
}
const checkedGrips=new Set();
for(const key of [0,2,4,5,7,9,11])for(const recipe of Object.keys(lab.patterns))for(const extra of ['none','seventh','251','secondary','sus','minoriv']){
 lab.set({key,recipe,extra,color:true});
 for(let target=1;target<lab.basic().length;target++){
  lab.set({target});
  for(const c of lab.build()){
   const options=lab.shapeOptions(c);assert(options.length,'No playable grip: '+c.name);
   for(const o of options){
    assert(o.hand.fingers<=4);assert(lab.handPlan(o.frets));
    const positive=o.frets.filter(f=>f>0);assert(Math.max(...positive)-Math.min(...positive)<=3);
    if(o.hand.barre){const b=o.hand.barre;assert(o.frets.slice(b.from,b.to+1).every(f=>f<0||f>=b.fret));}
    const notes=o.frets.flatMap((f,i)=>f<0?[]:[(lab.tuning[i]+f)%12]);
    assert.strictEqual(notes[0],c.bass.pc);assert(notes.every(n=>lab.intervals[c.q].some(v=>(c.pc+v)%12===n)));
    assert(lab.intervals[c.q].filter(n=>n!==7).every(n=>notes.includes((c.pc+n)%12)));
    checkedGrips.add(c.pc+':'+c.q+':'+o.id);
   }
  }
 }
}
console.log('All targets checked; unique playable chord grips: '+checkedGrips.size);
for(const key of [0,2,4,5,7,9,11])for(const recipe of ['1645','1564','6415','4536','4536251','line'])for(const extra of ['seventh','251','secondary','sus','minoriv']){
 lab.set({key,recipe,extra,color:true,target:1,rangeStart:1,rangeEnd:0});lab.render();
 for(const c of lab.build())for(const o of lab.shapeOptions(c)){
  const notes=o.frets.flatMap((f,i)=>f<0?[]:[(lab.tuning[i]+f)%12]);assert.strictEqual(notes[0],c.bass.pc);
  const allowed=lab.intervals[c.q].map(n=>(n+c.pc)%12);assert(notes.every(n=>allowed.includes(n)));
  assert(lab.intervals[c.q].filter(n=>n!==7).every(n=>notes.includes((n+c.pc)%12)));checked++;
 }
 for(const preference of ['low','easy','close']){lab.set({preference});assert(lab.assignShapes(lab.build()).every(c=>c._frets.length===6));}
}
lab.set({key:0,recipe:'1645',extra:'secondary',color:true,target:1,rangeStart:1,rangeEnd:2,mode:'current',loop:false,preference:'low',voicings:{}});lab.render();
assert.strictEqual(lab.clipRange(lab.build()).reduce((s,c)=>s+c.beats,0),8);
assert.strictEqual(lab.clipRange(lab.build()).map(c=>c.name).join(','),'C,E7,Am');
assert(element('#pbl-rows').innerHTML.includes('class="changed"'));
assert(element('#pbl-rows').innerHTML.includes('class="was">C →'));
assert.strictEqual(lab.connectionAt(1).text,'E7 → Am · 属七解决');
const c=lab.build()[0],options=lab.shapeOptions(c);assert(options.length>1);
lab.set({voicings:{[lab.chordKey(c)]:options.at(-1).id}});lab.render();assert.strictEqual(lab.shape(c).join(','),options.at(-1).id);
lab.save();lab.restore(JSON.parse(store['guitar-lab-v1']));assert.strictEqual(lab.shape(c).join(','),options.at(-1).id);
assert(!html.includes('优先练习'));assert(!html.includes('id="pbl-target-guide"'));
(async()=>{
 lab.set({mode:'alternate',loop:true,rangeStart:1,rangeEnd:2});lab.render();await lab.play(false);assert(!element('#pbl-status').textContent.includes('无法'));
 const labels=new Set();for(let i=0;i<45;i++){scheduled.sort((a,b)=>a.time-b.time);const t=scheduled.shift();assert(t);clock=t.time;t.f();labels.add(element('#pbl-route').textContent.split(' · ')[0]);}
 assert(labels.has('原版')&&labels.has('丰富版'));assert(started>0);lab.stop();assert.strictEqual(scheduled.length,0);
 lab.set({loop:false});lab.render();await lab.play(false);let n=0;while(scheduled.length&&n++<100){scheduled.sort((a,b)=>a.time-b.time);const t=scheduled.shift();clock=t.time;t.f();}assert(n<100);assert(element('#pbl-stop').disabled);
 console.log(JSON.stringify({validatedVoicings:checked,checks:'range clipping, change markers, connection links, all voicing choices, persistence, repeating A/B scheduling, stop cancellation, and finite A/B completion passed'}));
})();

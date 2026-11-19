const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('src/template.html').replace('{{STYLES}}',()=>read('src/styles.css')).replace('{{SCRIPT}}',()=>read('src/app.js'));
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Built standalone index.html');

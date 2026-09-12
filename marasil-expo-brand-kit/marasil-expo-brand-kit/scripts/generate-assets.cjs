// Deterministic packaging of the supplied logo; no AI redraw is used.
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const original = path.join(root, 'source/marasil-logo-original.png');
const LIGHT = '#FAF7FC', DARK = '#211428';
const manifest = [];
async function main() {
 const {data,info} = await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let x0=info.width,y0=info.height,x1=0,y1=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>0){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 const src = await sharp(original).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).png().toBuffer();
 const sm = await sharp(src).metadata();
 const white = await sharp({create:{width:sm.width,height:sm.height,channels:3,background:'#FFFFFF'}}).joinChannel(await sharp(src).extractChannel(3).toBuffer()).png().toBuffer();
 async function save(rel, bytes, purpose) {
  const out=path.join(root,rel);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,bytes);
  const m=await sharp(bytes).metadata();manifest.push({file:rel,width:m.width,height:m.height,alpha:m.hasAlpha,purpose});
 }
 async function square(rel,size,fraction,bg,mono,purpose){
  const logo=await sharp(mono?white:src).resize({width:Math.round(size*fraction),kernel:'lanczos3'}).png().toBuffer();
  const m=await sharp(logo).metadata();
  let p=sharp({create:{width:size,height:size,channels:4,background:bg||{r:0,g:0,b:0,alpha:0}}}).composite([{input:logo,left:Math.floor((size-m.width)/2),top:Math.floor((size-m.height)/2)}]);
  if(bg)p=p.flatten({background:bg}).removeAlpha();
  let bytes = await p.png().toBuffer();
  if(mono && !bg) {
   const alpha = await sharp(bytes).extractChannel(3).toBuffer();
   bytes = await sharp({create:{width:size,height:size,channels:3,background:'#FFFFFF'}}).joinChannel(alpha).png().toBuffer();
  }
  await save(rel,bytes,purpose);
 }
 await save('assets/brand/logo.png',await sharp(src).resize({width:1024}).png().toBuffer(),'Transparent in-app logo; upscaled from original');
 await save('assets/brand/logo-white.png',await sharp(white).resize({width:1024}).png().toBuffer(),'White alpha silhouette for dark surfaces');
 await save('source/logo-2048-upscaled.png',await sharp(src).resize({width:2048}).png().toBuffer(),'Upscaled raster, not vector or recovered detail');
 await square('assets/brand/icon.png',1024,.76,LIGHT,false,'Main iOS / legacy Android opaque square');
 await square('assets/brand/icon-dark.png',1024,.76,DARK,true,'Optional iOS dark: white silhouette');
 await square('assets/brand/icon-tinted.png',1024,.76,'#000000',true,'Optional iOS tinted: grayscale white on black');
 // Entire rectangular logo fits in the conservative central 66/108 diameter circle.
 await square('assets/brand/adaptive-foreground.png',1024,.50,null,false,'Android foreground, 50% width, transparent');
 await square('assets/brand/adaptive-monochrome.png',1024,.50,null,true,'Android themed icon alpha mask');
 await save('assets/brand/adaptive-background.png',await sharp({create:{width:1024,height:1024,channels:3,background:LIGHT}}).png().toBuffer(),'Optional Android background; default config uses color');
 await square('assets/brand/splash.png',1024,.60,null,false,'Light splash logo, central safe circle');
 await square('assets/brand/splash-dark.png',1024,.60,null,true,'Dark splash white silhouette');
 await square('assets/brand/notification.png',96,.78,null,true,'Android small notification, white only on transparency');
 for(const n of [16,32,48,64])await square(`public/brand/favicon-${n}.png`,n,.86,LIGHT,false,'Web favicon');
 await square('assets/brand/favicon.png',48,.86,LIGHT,false,'Expo web.favicon');
 for(const n of [192,512])await square(`public/brand/icon-${n}.png`,n,.76,LIGHT,false,'Optional PWA any icon');
 await square('public/brand/maskable-512.png',512,.62,LIGHT,false,'Optional PWA maskable icon');
 await square('public/brand/apple-touch-icon.png',180,.76,LIGHT,false,'Optional Apple touch web icon');
 await square('assets/brand/store-icon-512.png',512,.76,LIGHT,false,'Store listing icon; no rounded corners');
 fs.writeFileSync(path.join(root,'docs/assets-manifest.json'),JSON.stringify({source:{width:info.width,height:info.height,trim:{x:x0,y:y0,width:sm.width,height:sm.height}},policy:'Original raster preserved. Generated redraw was rejected. High-resolution outputs are resampled. Monochrome assets use original alpha silhouette.',assets:manifest},null,2));
 console.log(JSON.stringify({files:manifest.length,source:[info.width,info.height],trim:[sm.width,sm.height]}));
}
main().catch(e=>{console.error(e);process.exit(1)});

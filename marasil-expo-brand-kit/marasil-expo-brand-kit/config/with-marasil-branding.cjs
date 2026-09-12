/** Call with the resolved ExpoConfig (without an outer { expo: ... }). */
function withMarasilBranding(config, { iosVariants = false, notifications = false } = {}) {
 const p = './assets/brand/';
 const bg = '#FAF7FC', dark = '#211428';
 const list = [...(config.plugins || [])];
 function upsert(name, update) {
  const matches = list.filter(x => (Array.isArray(x) ? x[0] : x) === name);
  if (matches.length > 1) throw new Error(`Duplicate ${name} entries: merge them before applying branding.`);
  const index = list.findIndex(x => (Array.isArray(x) ? x[0] : x) === name);
  const prior = index >= 0 && Array.isArray(list[index]) ? list[index][1] || {} : {};
  const item = [name, update(prior)];
  if(index < 0) list.push(item); else list[index] = item;
 }
 const splash = { image: p+'splash.png', imageWidth:240, resizeMode:'contain', backgroundColor:bg,
  dark:{image:p+'splash-dark.png',backgroundColor:dark} };
 upsert('expo-splash-screen', old => {
  const next = {...old,...splash};
  delete next.enableFullScreenImage_legacy;
  for(const platform of ['android','ios']) if(old[platform]) {
   next[platform]={...old[platform],...splash};
   delete next[platform].enableFullScreenImage_legacy;
  }
  return next;
 });
 if(notifications) upsert('expo-notifications', old => ({...old,icon:p+'notification.png',color:'#65406F'}));
 const adaptive = {...(config.android?.adaptiveIcon || {}), foregroundImage:p+'adaptive-foreground.png',monochromeImage:p+'adaptive-monochrome.png',backgroundColor:bg};
 delete adaptive.backgroundImage; // A previous backgroundImage overrides backgroundColor.
 return {...config,
  icon:p+'icon.png',
  ios:{...config.ios,icon:iosVariants?{light:p+'icon.png',dark:p+'icon-dark.png',tinted:p+'icon-tinted.png'}:p+'icon.png'},
  android:{...config.android,icon:p+'icon.png',adaptiveIcon:adaptive},
  web:{...config.web,favicon:p+'favicon.png'},
  plugins:list
 };
}
module.exports = {withMarasilBranding};

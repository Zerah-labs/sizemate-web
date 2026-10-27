'use strict';

const $ = (id) => document.getElementById(id);
const els = {
  tools: $('tools'), drop: $('dropzone'), picker: $('file-input'),
  list: $('selected-list'), area: $('selected-area'), count: $('file-count'),
  sort: $('sort-hint'), run: $('convert-button'), runLabel: $('convert-label'),
  heading: $('upload-heading'), hint: $('upload-hint'), note: $('setting-note'),
  presetSetting: $('preset-setting'), formatSetting: $('format-setting'),
  widthSetting: $('width-setting'), bitrateSetting: $('bitrate-setting'),
  progress: $('progress-panel'), progressTitle: $('progress-title'),
  progressInfo: $('progress-info'), progressBar: $('progress-bar'),
  result: $('result-panel'), resultTitle: $('result-title'),
  resultDetail: $('result-detail'), summary: $('sizes-summary'),
  download: $('download-link'), error: $('error-panel')
};
const modeData = {
  image: {accept:'.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff', multi:true,
    heading:'Upload your photos', hint:'Pick photos you want to make smaller.',
    action:'Make my photos smaller', note:'Resize or choose WebP if you need even smaller images.'},
  pdf: {accept:'.pdf',multi:true,heading:'Upload your PDFs',
    hint:'Make PDFs easier to share on WhatsApp or email.',
    action:'Make my PDFs smaller',note:'Preserves existing fonts and text in all languages. Size reduction varies. Avoid digitally signed PDFs.'},
  mp3: {accept:'.mp4,.mov,.mkv,.webm,.avi,.m4v', multi:true,
    heading:'Upload a video', hint:'Get the sound from a video as an MP3 music file.',
    action:'Extract MP3 audio', note:'The video must contain sound. Works with MP4, MOV, MKV and WebM.'},
  video: {accept:'.mp4,.mov,.mkv,.webm,.avi,.m4v',multi:true,
    heading:'Upload your videos',hint:'Make videos easier to send and store.',
    action:'Make my videos smaller',note:'Video conversion takes longer than photos. Some videos are already optimized.'},
  merge: {accept:'.pdf',multi:true,heading:'Choose PDFs to combine',
    hint:'Add two or more PDFs in the order you want.',
    action:'Join these PDFs',note:'Move files up or down in the list to change the page order.'},
  'photos-pdf': {accept:'.jpg,.jpeg,.png,.webp,.bmp,.tif,.tiff',multi:true,
    heading:'Choose photos for your PDF', hint:'Make a single, easy-to-share PDF from your pictures.',
    action:'Create my PDF',note:'Every photo becomes its own page. Arrange them in your preferred order.'}
};
const ta = {
  navHow:'எப்படி வேலை செய்கிறது',eyebrow:'உங்கள் கோப்புகளுக்கான எளிய உதவி',
  headline:'பெரிய ஃபைலா? <span>சின்ன பிரச்சனை.</span>',
  subtitle:'போட்டோ, PDF அளவை குறைக்கவும்; வீடியோவை MP3 ஆக மாற்றவும் — சில கிளிக்குகளில்.',
  perk1:'பதிவு தேவையில்லை',perk2:'ஃபைல்கள் சேமிக்கப்படாது',perk3:'எளிய பதிவிறக்கம்',
  selectAction:'உங்களுக்கு என்ன செய்ய வேண்டும்?',toolTitle:'எப்படி உதவலாம்?',toolsLabel:'எளிய கருவிகள்',
  imageTool:'போட்டோ அளவு குறை',imageDetail:'JPG, PNG, WebP',pdfTool:'PDF அளவு குறை',pdfDetail:'சிறிய ஆவணங்கள்',
  mp3Tool:'வீடியோ to MP3',mp3Detail:'சத்தத்தை மட்டும் சேமி',videoTool:'வீடியோ அளவு குறை',videoDetail:'சிறிய MP4',
  mergeTool:'PDF-களை சேர்',mergeDetail:'பல PDF ஒன்றாக',photosTool:'போட்டோ to PDF',photosDetail:'ஒரே ஆவணமாக',
  step1:'படி 1 · ஃபைல்களைச் சேர்க்கவும்',safeProcessing:'தனிப்பட்ட செயலாக்கம்',
  drop:'இங்கே ஃபைல்களை விடுங்கள்',orBrowse:'அல்லது உங்கள் போன் / கணினியில் இருந்து தேர்ந்தெடுங்கள்',
  chooseFiles:'ஃபைல்களைத் தேர்ந்தெடு',clear:'எல்லாம் நீக்கு',sortHint:'இந்த வரிசையிலேயே PDF பக்கங்கள் வரும்.',
  step2:'படி 2 · அமைப்புகளைத் தேர்வு செய்க',dontWorry:'தெரியவில்லையா? இயல்புநிலை போதும்.',
  sizeQuality:'அளவு மற்றும் தரம்',small:'மிகச் சிறிய அளவு',balanced:'பரிந்துரை · சமநிலை',quality:'சிறந்த தரம்',
  outputFormat:'போட்டோ வடிவம்',keepFormat:'அதே வடிவம்',photoWidth:'போட்டோ பரிமாணம்',keepSize:'அதே பரிமாணம்',
  soundQuality:'ஒலி தரம்',privacyLine:'பாதுகாப்பான செயலாக்கம் · பதிவிறக்கத்திற்குப் பின் நீக்கம்',cancel:'ரத்துசெய்',
  download:'ஃபைலைப் பதிவிறக்கு',easyLabel:'1, 2, 3 போல எளிது',howTitle:'யாரும் பயன்படுத்தலாம்.',
  howSubtitle:'குழப்பமான கருவிகள் இல்லை. இன்ஸ்டால் தேவையில்லை.',how1Title:'ஒரு கருவியைத் தேர்வு செய்',
  how1Text:'போட்டோ, PDF குறைக்கவா அல்லது வீடியோவில் இருந்து MP3 எடுக்கவா?',how2Title:'ஃபைலைச் சேர்',
  how2Text:'உங்கள் சாதனத்தில் இருந்து தேர்வுசெய்து அமைப்புகளைப் பயன்படுத்தவும்.',how3Title:'புதிய ஃபைலைப் பெறு',
  how3Text:'ஒரு கிளிக்கில் பதிவிறக்கு. கணக்கு தேவையில்லை.',noticeTitle:'ஃபைல் அளவு குறித்த குறிப்பு',
  noticeText:'ஏற்கனவே சிறியதாக உள்ள ஃபைல்கள் மேலும் குறையாமல் இருக்கலாம். கையொப்பமிடப்பட்ட PDF-களை சுருக்க வேண்டாம்.',
  footerText:'ஃபைல் வேலைகள் இனி எளிது. ஆன்லைனில் செயலாக்க வசதியான ஃபைல்களை மட்டும் பதிவேற்றுங்கள்.'
};
const taMode = {
  image:['போட்டோக்களைப் பதிவேற்று','அளவு குறைக்க வேண்டிய படங்களைத் தேர்வு செய்யவும்.','போட்டோ அளவை குறை','மேலும் குறைக்க WebP அல்லது அளவு மாற்றத்தைத் தேர்வுசெய்க.'],
  pdf:['PDF-களைப் பதிவேற்று','சுலபமாக பகிர PDF அளவை குறைக்கவும்.','PDF அளவை குறை','அசல் எழுத்துருக்களும் உரையும் பாதுகாக்கப்படும். அளவு குறைவு மாறுபடும். டிஜிட்டல் கையொப்பம் உள்ள PDF-களைத் தவிர்க்கவும்.'],
  mp3:['வீடியோவைப் பதிவேற்று','வீடியோவில் உள்ள ஒலியை MP3 ஆக எடுங்கள்.','MP3-ஐ உருவாக்கு','வீடியோவில் ஒலி இருக்க வேண்டும்.'],
  video:['வீடியோக்களைப் பதிவேற்று','பகிர்வதற்காக வீடியோ அளவை குறைக்கவும்.','வீடியோ அளவை குறை','வீடியோ மாற்ற சிறிது கூடுதல் நேரம் ஆகலாம்.'],
  merge:['PDF-களைத் தேர்வு செய்','இரண்டு அல்லது அதற்கு மேற்பட்ட PDF-களைச் சேர்க்கவும்.','PDF-களைச் சேர்','பக்க வரிசையை மாற்ற மேலே / கீழே பட்டனை அழுத்தவும்.'],
  'photos-pdf':['போட்டோக்களைத் தேர்வு செய்','போட்டோக்களை ஒரே PDF ஆக மாற்றவும்.','PDF-ஐ உருவாக்கு','ஒவ்வொரு படமும் ஒரு பக்கமாக வரும்.']
};
let mode = 'image';
let selectedFiles = [];
let lang = 'en';
let request = null;
let resultUrl = null;
let maxBytes = 24_000_000;
let maxFiles = 12;

function fmt(bytes){
  if(bytes < 1024) return `${bytes} B`;
  if(bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(2)} MB`;
}
function allowed(file){
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  return modeData[mode].accept.split(',').includes(ext);
}
function clearResult(){
  els.result.hidden = true; els.error.hidden = true; els.progress.hidden = true;
  if(resultUrl){ URL.revokeObjectURL(resultUrl); resultUrl=null; }
}
function showError(message){
  els.error.textContent = message; els.error.hidden = false;
  els.progress.hidden = true;
}
function validate(files){
  if(files.length > maxFiles) return `Select no more than ${maxFiles} files at a time.`;
  const bad = files.find(f=>!allowed(f));
  if(bad) return `“${bad.name}” is not supported for this tool. Check the file type.`;
  const total = files.reduce((n,f)=>n+f.size,0);
  if(total > maxBytes) return `These files are too large together (${fmt(total)}). The current limit is ${fmt(maxBytes)}. Choose smaller files.`;
  if(files.some(f=>!f.size)) return 'One of your files is empty. Please remove it.';
  return '';
}
function redrawFiles(){
  els.area.hidden = !selectedFiles.length;
  els.sort.hidden = !(mode === 'merge' || mode === 'photos-pdf') || selectedFiles.length < 2;
  els.list.replaceChildren();
  const names = new Set();
  selectedFiles.forEach((file,index)=>{
    const row=document.createElement('div'); row.className='file-item';
    const mark=document.createElement('span'); mark.className='file-mark';
    mark.textContent=(file.name.split('.').pop()||'FILE').toUpperCase().slice(0,4);
    const metadata=document.createElement('div'); metadata.className='file-meta';
    const name=document.createElement('div'); name.className='file-name'; name.textContent=file.name;
    const size=document.createElement('div'); size.className='file-size'; size.textContent=fmt(file.size);
    metadata.append(name,size);
    const actions=document.createElement('div'); actions.className='file-actions';
    if(mode==='merge'||mode==='photos-pdf'){
      const up=document.createElement('button'); up.type='button';up.textContent='↑';up.title='Move up';up.setAttribute('aria-label',`Move ${file.name} up`);
      up.disabled=index===0;up.addEventListener('click',()=>swap(index,index-1));
      const down=document.createElement('button');down.type='button';down.textContent='↓';down.title='Move down';down.setAttribute('aria-label',`Move ${file.name} down`);
      down.disabled=index===selectedFiles.length-1;down.addEventListener('click',()=>swap(index,index+1));
      actions.append(up,down);
    }
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Remove file';remove.setAttribute('aria-label',`Remove ${file.name}`);
    remove.addEventListener('click',()=>{selectedFiles.splice(index,1);clearResult();redrawFiles();});
    actions.append(remove);row.append(mark,metadata,actions);els.list.append(row);
  });
  els.count.textContent=lang==='ta' ? `தேர்ந்தெடுக்கப்பட்ட ஃபைல்கள் (${selectedFiles.length})` : `Selected files (${selectedFiles.length})`;
  els.run.disabled=selectedFiles.length < (mode==='merge'?2:1) || !!request;
}
function swap(a,b){[selectedFiles[a],selectedFiles[b]]=[selectedFiles[b],selectedFiles[a]];clearResult();redrawFiles();}
function addFiles(fileList){
  if(request) return;
  const incoming=Array.from(fileList||[]);
  if(!incoming.length) return;
  const list=selectedFiles.concat(incoming);
  const error=validate(list);
  if(error){showError(error);return;}
  clearResult(); selectedFiles=list; redrawFiles();
}
function chooseMode(next, retainFiles=false){
  if(request) return;
  mode=next; if(!retainFiles){selectedFiles=[]; els.picker.value='';clearResult();}
  document.querySelectorAll('[data-tool]').forEach(el=>{
    const active=el.dataset.tool===mode;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));
  });
  const data=modeData[mode];
  const strings=lang==='ta'?taMode[mode]:[data.heading,data.hint,data.action,data.note];
  [els.heading.textContent,els.hint.textContent,els.runLabel.textContent,els.note.textContent]=strings;
  els.picker.accept=data.accept;
  els.presetSetting.hidden=!(mode==='image'||mode==='video');
  els.formatSetting.hidden=mode!=='image';els.widthSetting.hidden=mode!=='image';
  els.bitrateSetting.hidden=mode!=='mp3';
  $('upload-limit').textContent=lang==='ta' ? `மொத்தம் ${Math.floor(maxBytes/1_000_000)} MB வரை · ${maxFiles} ஃபைல்கள்` : `Up to ${Math.floor(maxBytes/1_000_000)} MB total · ${maxFiles} files at once`;
  redrawFiles();
}
function switchLanguage(){
  lang=lang==='en'?'ta':'en';document.documentElement.lang=lang;
  $('language-toggle').textContent=lang==='en'?'தமிழ்':'English';
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.dataset.i18n;
    if(lang==='ta' && ta[key]){
      if(!el.dataset.original)el.dataset.original=el.textContent;
      el.textContent=ta[key];
    } else if(el.dataset.original)el.textContent=el.dataset.original;
  });
  const heading=document.querySelector('[data-i18n-html]');
  if(lang==='ta'){
    if(!heading.dataset.original)heading.dataset.original=heading.innerHTML;
    heading.innerHTML=ta.headline;
  }else if(heading.dataset.original)heading.innerHTML=heading.dataset.original;
  chooseMode(mode,true);
}
function setBusy(busy){
  els.run.disabled=busy || selectedFiles.length < (mode==='merge'?2:1);
  document.querySelectorAll('[data-tool]').forEach(el=>el.disabled=busy);
  $('clear-files').disabled=busy;
  $('language-toggle').disabled=busy;
  els.list.querySelectorAll('button').forEach(el=>el.disabled=busy);
  if(!busy)redrawFiles();
  els.drop.setAttribute('aria-disabled',String(busy));
}
function parseFilename(disposition){
  const encoded=(disposition||'').match(/filename\*=utf-8''([^;]+)/i);
  if(encoded){try{return decodeURIComponent(encoded[1]);}catch{}}
  const normal=(disposition||'').match(/filename="?([^";]+)"?/i);
  return normal?normal[1]:'sizemate-file';
}
function convert(){
  if(request || !selectedFiles.length)return;
  const error=validate(selectedFiles);
  if(error){showError(error);return;}
  if(mode==='merge'&&selectedFiles.length<2){showError('Choose at least two PDFs to join.');return;}
  clearResult();setBusy(true);
  els.progress.hidden=false;els.progressTitle.textContent=lang==='ta'?'உங்கள் ஃபைல்கள் தயாராகின்றன...':'Working on your files...';
  els.progressInfo.textContent=lang==='ta'?'இந்தப் பக்கத்தை மூட வேண்டாம்.':'Uploading files...';
  els.progressBar.classList.remove('indeterminate');els.progressBar.style.width='3%';
  const data=new FormData();selectedFiles.forEach(file=>data.append('files',file,file.name));
  data.append('tool',mode);data.append('preset',$('preset').value);
  data.append('image_format',$('format').value);data.append('max_width',$('max-width').value);
  data.append('bitrate',$('bitrate').value);
  const xhr=new XMLHttpRequest();request=xhr;xhr.open('POST','/api/process');xhr.responseType='blob';
  xhr.upload.onprogress=(event)=>{
    if(event.lengthComputable){els.progressBar.style.width=`${Math.max(3,Math.min(86,Math.round(event.loaded/event.total*85)))}%`;}
  };
  xhr.upload.onload=()=>{
    els.progressInfo.textContent=lang==='ta'?'மாற்றம் நடைபெறுகிறது...':'Converting your files. Please keep this tab open...';
    els.progressBar.style.width='100%';els.progressBar.classList.add('indeterminate');
  };
  xhr.onload=async()=>{
    if(request!==xhr)return;
    request=null;setBusy(false);els.progress.hidden=true;
    els.progressBar.classList.remove('indeterminate');
    if(xhr.status!==200){
      let message='Unable to process your file. Please try again.';
      try{const payload=JSON.parse(await xhr.response.text());message=payload.detail||message;}catch{}
      showError(message);return;
    }
    resultUrl=URL.createObjectURL(xhr.response);
    const name=parseFilename(xhr.getResponseHeader('Content-Disposition'));
    els.download.href=resultUrl;els.download.download=name;
    els.resultTitle.textContent=lang==='ta'?'உங்கள் ஃபைல் தயார்!':'Your file is ready!';
    els.resultDetail.textContent=lang==='ta'?name:`${name} · Ready to download`;
    const original=Number(xhr.getResponseHeader('X-Original-Bytes'));
    const output=Number(xhr.getResponseHeader('X-Output-Bytes'));
    const savings=original>0?((original-output)/original*100):0;
    if((mode==='image'||mode==='pdf'||mode==='video')&&savings>0.1){
      els.summary.textContent=`${fmt(original)} → ${fmt(output)} · ${savings.toFixed(1)}% smaller`;
    } else if((mode==='image'||mode==='pdf'||mode==='video')&&savings<=0.1){
      els.summary.textContent=`${fmt(output)} · No size reduction was achieved with these settings`;
    } else { els.summary.textContent=`New file size: ${fmt(output)}`; }
    els.result.hidden=false;els.result.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  xhr.onerror=()=>{if(request===xhr){request=null;setBusy(false);showError('Network problem. Please check your connection and try again.');}};
  xhr.onabort=()=>{if(request===xhr){request=null;setBusy(false);els.progress.hidden=true;}};
  xhr.send(data);
}

els.tools.addEventListener('click',e=>{
  const btn=e.target.closest('[data-tool]');if(btn)chooseMode(btn.dataset.tool);
});
els.drop.addEventListener('click',()=>{if(!request)els.picker.click();});
els.drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!request)els.picker.click();}});
for(const type of ['dragenter','dragover'])els.drop.addEventListener(type,e=>{e.preventDefault();els.drop.classList.add('dragover');});
for(const type of ['dragleave','drop'])els.drop.addEventListener(type,e=>{e.preventDefault();els.drop.classList.remove('dragover');});
els.drop.addEventListener('drop',e=>addFiles(e.dataTransfer.files));
els.picker.addEventListener('change',e=>{addFiles(e.target.files);els.picker.value='';});
$('clear-files').addEventListener('click',()=>{if(!request){selectedFiles=[];clearResult();redrawFiles();}});
els.run.addEventListener('click',convert);
$('cancel-button').addEventListener('click',()=>{if(request)request.abort();});
$('language-toggle').addEventListener('click',switchLanguage);
window.addEventListener('beforeunload',()=>{if(resultUrl)URL.revokeObjectURL(resultUrl);});

fetch('/api/limits').then(r=>r.ok?r.json():Promise.reject()).then(limits=>{
  maxBytes=limits.max_total_mb*1_000_000;maxFiles=limits.max_files;chooseMode(mode);
}).catch(()=>{});
chooseMode(mode);

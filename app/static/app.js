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
  navHow:'எப்படி பயன்படுத்துவது?',eyebrow:'உங்கள் கோப்புகளை எளிதாக மாற்ற உதவும் இணையதளம்',
  headline:'பெரிய ஃபைலா? <span>இனி கவலை வேண்டாம்!</span>',
  subtitle:'புகைப்படங்கள் மற்றும் PDF கோப்புகளின் அளவைக் குறைக்கலாம். வீடியோக்களை MP3 ஆக மாற்றலாம். இவை அனைத்தையும் சில கிளிக்குகளில் எளிதாகச் செய்யலாம்.',
  perk1:'பதிவு செய்ய வேண்டாம்',perk2:'கோப்புகள் நிரந்தரமாகச் சேமிக்கப்படாது',perk3:'எளிதாகப் பதிவிறக்கலாம்',
  selectAction:'உங்கள் தேவைக்கேற்ப 6 எளிய வசதிகள் உள்ளன.',toolTitle:'உங்களுக்கு என்ன செய்ய வேண்டும்?',toolsLabel:'எளிய வசதிகள்',
  imageTool:'புகைப்படத்தின் அளவைக் குறைக்க',imageDetail:'JPG, PNG, WebP புகைப்படங்களின் அளவைக் குறைக்கலாம்.',
  pdfTool:'PDF அளவைக் குறைக்க',pdfDetail:'PDF கோப்புகளைச் சிறிய அளவிற்கு மாற்றலாம்.',
  mp3Tool:'வீடியோவை MP3 ஆக மாற்ற',mp3Detail:'வீடியோவில் உள்ள ஒலியை மட்டும் தனியாகப் பதிவிறக்கலாம்.',
  videoTool:'வீடியோ அளவைக் குறைக்க',videoDetail:'வீடியோவின் அளவைக் குறைத்து MP4 கோப்பாகப் பெறலாம்.',
  mergeTool:'PDF கோப்புகளை ஒன்றிணைக்க',mergeDetail:'பல PDF கோப்புகளை ஒரே PDF ஆக இணைக்கலாம்.',
  photosTool:'புகைப்படங்களை PDF ஆக மாற்ற',photosDetail:'ஒன்று அல்லது பல புகைப்படங்களை PDF கோப்பாக மாற்றலாம்.',
  step1:'படி 1: கோப்புகளைத் தேர்ந்தெடுக்கவும்',safeProcessing:'பாதுகாப்பான செயலாக்கம்',
  drop:'கோப்புகளை இங்கே சேர்க்கவும்',orBrowse:'உங்கள் மொபைல் அல்லது கணினியிலிருந்து கோப்புகளைத் தேர்ந்தெடுக்கவும்.',
  chooseFiles:'கோப்புகளைத் தேர்ந்தெடுக்கவும்',clear:'அனைத்தையும் நீக்கவும்',sortHint:'இந்த வரிசையிலேயே PDF பக்கங்கள் வரும்.',
  step2:'படி 2: தேவையான அமைப்புகளைத் தேர்ந்தெடுக்கவும்',dontWorry:'எவ்வளவு அளவைக் குறைக்க வேண்டும் என்பதை நீங்களே முடிவு செய்யலாம்.',
  sizeQuality:'புகைப்படத்தின் அளவு மற்றும் தரம்',small:'மிகக் குறைந்த கோப்பு அளவு',balanced:'அளவும் தரமும் சமநிலையில் (பரிந்துரைக்கப்படுகிறது)',quality:'சிறந்த படத் தரம்',
  outputFormat:'புகைப்படத்தின் வகை',keepFormat:'அதே வகையில் வைத்திருக்கலாம்',photoWidth:'புகைப்படத்தின் பரிமாணம்',keepSize:'அசல் அளவு',
  soundQuality:'ஒலியின் தரம்',privacyLine:'செயலாக்கப்பட்ட கோப்புகள் நிரந்தரமாகச் சேமிக்கப்படாது.',cancel:'ரத்துசெய்யவும்',
  download:'மாற்றப்பட்ட கோப்பைப் பதிவிறக்கவும்',easyLabel:'எளிதாகப் பயன்படுத்தலாம்',howTitle:'மூன்றே படிகளில் உங்கள் வேலை முடிந்துவிடும்!',
  howSubtitle:'கணக்குத் தொடங்கவோ தனியாக மென்பொருள் நிறுவவோ தேவையில்லை.',how1Title:'தேவையான வசதியைத் தேர்ந்தெடுக்கவும்',
  how1Text:'புகைப்படத்தின் அளவைக் குறைக்க வேண்டுமா? PDF கோப்புகளை இணைக்க வேண்டுமா? வீடியோவை MP3 ஆக மாற்ற வேண்டுமா? உங்கள் தேவையைத் தேர்ந்தெடுக்கவும்.',
  how2Title:'கோப்பைப் பதிவேற்றவும்',how2Text:'உங்கள் மொபைல் அல்லது கணினியிலிருந்து கோப்பைத் தேர்ந்தெடுத்து, தேவையான அமைப்புகளைச் செய்யவும்.',
  how3Title:'மாற்றப்பட்ட கோப்பைப் பதிவிறக்கவும்',how3Text:'சில எளிய படிகளில் மாற்றப்பட்ட கோப்பைப் பெற்றுக்கொள்ளலாம்.',noticeTitle:'முக்கியக் குறிப்புகள்',
  noticeText:'ஏற்கனவே சிறிய அளவில் இருக்கும் கோப்புகளின் அளவு மேலும் குறையாமல் போகலாம். டிஜிட்டல் கையொப்பமிடப்பட்ட PDF கோப்புகளைச் சுருக்க வேண்டாம். கையொப்பத்தின் செல்லுபடியாகும் தன்மை பாதிக்கப்படலாம். இணையத்தில் பதிவேற்றுவதற்குப் பாதுகாப்பான கோப்புகளை மட்டும் பயன்படுத்தவும். செயலாக்கப்பட்ட கோப்புகள் நிரந்தரமாகச் சேமிக்கப்படாது.',
  footerText:'கோப்பு வேலைகள் இனி சுலபம்! புகைப்படம், PDF, வீடியோ என உங்கள் அன்றாடக் கோப்பு வேலைகளை ஒரே இடத்தில் எளிதாகச் செய்யுங்கள்.'
};
const taMode = {
  image:['புகைப்படங்களைத் தேர்ந்தெடுக்கவும்','உங்கள் மொபைல் அல்லது கணினியிலிருந்து அளவைக் குறைக்க வேண்டிய புகைப்படங்களைத் தேர்ந்தெடுக்கவும்.','புகைப்படத்தின் அளவைக் குறைக்க','கோப்பின் அளவை மேலும் குறைக்க WebP வகையையோ சிறிய பரிமாணத்தையோ தேர்ந்தெடுக்கலாம்.'],
  pdf:['PDF கோப்புகளைத் தேர்ந்தெடுக்கவும்','PDF கோப்புகளைச் சிறிய அளவிற்கு மாற்றலாம்.','PDF அளவைக் குறைக்க','அசல் எழுத்துருக்களும் உரையும் பாதுகாக்கப்படும். டிஜிட்டல் கையொப்பமிடப்பட்ட PDF கோப்புகளைச் சுருக்க வேண்டாம்.'],
  mp3:['வீடியோவைத் தேர்ந்தெடுக்கவும்','வீடியோவில் உள்ள ஒலியை மட்டும் தனியாகப் பதிவிறக்கலாம்.','வீடியோவை MP3 ஆக மாற்ற','வீடியோவில் ஒலி இருக்க வேண்டும்.'],
  video:['வீடியோக்களைத் தேர்ந்தெடுக்கவும்','வீடியோவின் அளவைக் குறைத்து MP4 கோப்பாகப் பெறலாம்.','வீடியோ அளவைக் குறைக்க','வீடியோ மாற்றத்திற்கு சிறிது கூடுதல் நேரம் ஆகலாம்.'],
  merge:['PDF கோப்புகளைத் தேர்ந்தெடுக்கவும்','பல PDF கோப்புகளை ஒரே PDF ஆக இணைக்கலாம்.','PDF கோப்புகளை ஒன்றிணைக்க','பக்க வரிசையை மாற்ற மேலே / கீழே உள்ள பொத்தான்களைப் பயன்படுத்தவும்.'],
  'photos-pdf':['புகைப்படங்களைத் தேர்ந்தெடுக்கவும்','ஒன்று அல்லது பல புகைப்படங்களை PDF கோப்பாக மாற்றலாம்.','புகைப்படங்களை PDF ஆக மாற்ற','ஒவ்வொரு புகைப்படமும் ஒரு பக்கமாக வரும். தேவையான வரிசையில் புகைப்படங்களை அமைக்கவும்.']
};
const taOptions = {
  format:{jpg:'JPG – பெரும்பாலான சாதனங்களில் பயன்படுத்த ஏற்றது',webp:'WebP – குறைந்த இடத்தைப் பயன்படுத்த உதவும்',png:'PNG – எழுத்துகளும் விவரங்களும் தெளிவாக இருக்க உதவும்'},
  'max-width':{'2048':'2048 px – பெரிய அளவு','1600':'1600 px – பரிந்துரைக்கப்படும் அளவு','1024':'1024 px – நடுத்தர அளவு','640':'640 px – சிறிய அளவு'},
  bitrate:{'96':'96 kbps – குறைந்த கோப்பு அளவு','128':'128 kbps – வழக்கமான தரம்','192':'192 kbps – பரிந்துரைக்கப்படும் தரம்','256':'256 kbps – சிறந்த ஒலித் தரம்'}
};
let mode = 'image';
let selectedFiles = [];
let lang = 'en';
let request = null;
let resultUrl = null;
let maxBytes = 4_000_000;
let maxFiles = 12;
let maxOutputMb = 0;

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
  els.count.textContent=lang==='ta' ? `தேர்ந்தெடுக்கப்பட்ட கோப்புகள் (${selectedFiles.length})` : `Selected files (${selectedFiles.length})`;
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
  $('upload-limit').textContent=lang==='ta' ? `ஒரே நேரத்தில் அதிகபட்சம் ${maxFiles} கோப்புகளைச் சேர்க்கலாம். மொத்த அளவு ${Math.floor(maxBytes/1_000_000)} MB-க்குள் இருக்க வேண்டும்.` : `Up to ${Math.floor(maxBytes/1_000_000)} MB total · ${maxFiles} files at once`;
  if(maxOutputMb)$('upload-limit').textContent+=lang==='ta' ? ` பதிவிறக்க அளவும் ${maxOutputMb} MB-க்குள் இருக்க வேண்டும்.` : ` · Downloads up to ${maxOutputMb} MB`;
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
  for(const [id, labels] of Object.entries(taOptions)){
    $(id).querySelectorAll('option').forEach(option=>{
      if(!labels[option.value])return;
      if(!option.dataset.original)option.dataset.original=option.textContent;
      option.textContent=lang==='ta'?labels[option.value]:option.dataset.original;
    });
  }
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
  els.progress.hidden=false;els.progressTitle.textContent=lang==='ta'?'உங்கள் கோப்புகள் தயாராகின்றன...':'Working on your files...';
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
    els.resultTitle.textContent=lang==='ta'?'மாற்றப்பட்ட கோப்பு தயார்!':'Your file is ready!';
    els.resultDetail.textContent=lang==='ta'?name:`${name} · Ready to download`;
    const original=Number(xhr.getResponseHeader('X-Original-Bytes'));
    const output=Number(xhr.getResponseHeader('X-Output-Bytes'));
    const savings=original>0?((original-output)/original*100):0;
    if((mode==='image'||mode==='pdf'||mode==='video')&&savings>0.1){
      els.summary.textContent=lang==='ta'?`${fmt(original)} → ${fmt(output)} · ${savings.toFixed(1)}% அளவு குறைந்துள்ளது`:`${fmt(original)} → ${fmt(output)} · ${savings.toFixed(1)}% smaller`;
    } else if((mode==='image'||mode==='pdf'||mode==='video')&&savings<=0.1){
      els.summary.textContent=lang==='ta'?`${fmt(output)} · இந்த அமைப்புகளில் கோப்பின் அளவு குறையவில்லை`:`${fmt(output)} · No size reduction was achieved with these settings`;
    } else { els.summary.textContent=lang==='ta'?`மாற்றப்பட்ட கோப்பின் அளவு: ${fmt(output)}`:`New file size: ${fmt(output)}`; }
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
  maxBytes=limits.max_total_mb*1_000_000;maxFiles=limits.max_files;maxOutputMb=limits.max_output_mb||0;chooseMode(mode);
}).catch(()=>{});
chooseMode(mode);

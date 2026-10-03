const META=window.BOOK_META;
const pdfjsLib=window.pdfjsLib;
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const state={pages:[],index:0,zoom:1,pdfs:{}};
const $=id=>document.getElementById(id);
const pageEl=$('page'), loading=$('loading');

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

function lecturePage(pdfPage){
  return state.pages.findIndex(p=>p.type==='pdf'&&p.doc==='lectures'&&p.pdfPage===pdfPage);
}
function labPage(pdfPage){
  return state.pages.findIndex(p=>p.type==='pdf'&&p.doc==='labs'&&p.pdfPage===pdfPage);
}

function buildPages(){
  state.pages=[{type:'cover'},{type:'title'},{type:'toc',part:'all'}];

  for(let p=1;p<=META.lecturePdfPages;p++){
    state.pages.push({type:'pdf',doc:'lectures',pdfPage:p});
  }

  META.labs.forEach((lab,i)=>{
    const start=lab[0];
    const end=i<META.labs.length-1
      ? META.labs[i+1][0]-1
      : META.labPdfPages;

    for(let p=start;p<=end;p++){
      state.pages.push({type:'pdf',doc:'labs',pdfPage:p});
    }

    state.pages.push({type:'video',lab:lab});
  });
}

function tocHTML(){
  const lectureRows=META.lectures.map((x,i)=>{
    const target=lecturePage(x[0]);
    return `<div class="toc-row" data-target="${target}">
      <span class="toc-num">${i+1}.</span>
      <span class="toc-text">${esc(x[1])}</span>
      <span class="dots"></span>
      <span class="toc-page-no">${target+1}</span>
    </div>`;
  }).join('');

  const labRows=META.labs.map((x,i)=>{
    const target=labPage(x[0]);
    return `<div class="toc-row" data-target="${target}">
      <span class="toc-num">${i+1}.</span>
      <span class="toc-text">${esc(x[1])}</span>
      <span class="dots"></span>
      <span class="toc-page-no">${target+1}</span>
    </div>`;
  }).join('');

  return `<div class="html-inner toc-page toc-all">
    <h1>МАЗМҰНЫ</h1>

    <div class="toc-columns">
      <section class="toc-section">
        <h2>Дәрістер</h2>
        ${lectureRows}
      </section>

      <section class="toc-section">
        <h2>Зертханалық жұмыстар</h2>
        ${labRows}
      </section>
    </div>

    <div class="toc-docs">
      <a href="source/lectures.pdf" target="_blank" rel="noopener">
        Дәрістер жиынтығы (PDF)
      </a>
      <a href="source/labs.pdf" target="_blank" rel="noopener">
        Зертханалық жұмыстар (PDF)
      </a>
    </div>
  </div>`;
}

function sideHTML(){
  let h='<div class="side-title">ДӘРІСТЕР</div>';

  h+=META.lectures.map((x,i)=>
    `<button class="side-link" data-target="${lecturePage(x[0])}">
      ${i+1}. ${esc(x[1])}
    </button>`
  ).join('');

  h+='<div class="side-title">ЗЕРТХАНАЛЫҚ ЖҰМЫСТАР</div>';

  h+=META.labs.map((x,i)=>
    `<button class="side-link" data-target="${labPage(x[0])}">
      ${esc(x[1])}
    </button>`
  ).join('');

  return h;
}

/*
  ТЕК ТІКЕЛЕЙ YouTube ВИДЕО СІЛТЕМЕЛЕРІ.
  youtube.com/results іздеу сілтемелері қолданылмайды.
*/
function videosFor(key){
  const data={
    intro:[
      ['C++ бағдарламалау тіліне кіріспе | Қазақша сабақ #1',
       'https://www.youtube.com/watch?v=wOJ9LMQT0N0']
    ],

    if:[
      ['C++ сабақ 7 | Шартты оператор if else',
       'https://www.youtube.com/watch?v=zv2l8zipMWg']
    ],

    loop:[
      ['C++ циклдері | for, while, do-while',
       'https://www.youtube.com/watch?v=wza4fTMTHaY']
    ],

    array:[
      ['C++ сабақ 13 | Бір өлшемді массив №1',
       'https://www.youtube.com/watch?v=SETbWm_IYDI']
    ],

    function:[
      ['C++ сабақ 17 | Функция №1',
       'https://www.youtube.com/watch?v=yFywgECMn1k']
    ],

    struct:[
      ['C++ | Structure / struct',
       'https://www.youtube.com/watch?v=-TkoO8Z07hI']
    ],

    graphics:[
      ['C++ | Графикалық бағдарламалау',
       'https://www.youtube.com/watch?v=-TkoO8Z07hI']
    ]
  };

  return data[key] || data.intro;
}

function videoHTML(lab){
  const videos=videosFor(lab[3]);

  return `<div class="html-inner video-page">
    <h1>${esc(lab[1])}</h1>

    <p>
      Зертханалық жұмысты орындағаннан кейін тақырыпты бекіту үшін
      қосымша бейнесабақты ашуға болады.
    </p>

    ${videos.map(v=>`
      <a class="video-card"
         href="${v[1]}"
         target="_blank"
         rel="noopener noreferrer">
        <b>▶ ${esc(v[0])}</b>
        <small>YouTube видеосын бірден ашу</small>
      </a>
    `).join('')}

    <a class="pdf-link"
       href="source/labs.pdf"
       target="_blank"
       rel="noopener noreferrer">
       Зертханалық жұмыстардың PDF нұсқасын ашу
    </a>
  </div>`;
}

function renderHTML(){
  const p=state.pages[state.index];
  pageEl.className='page html-page';

  if(p.type==='cover'){
    pageEl.innerHTML=
      '<img class="cover-page" src="assets/cover-final-2026.jpg" '+
      'alt="C++ машинаға бағытталған бағдарламалау, Астана 2026">';
  }

  else if(p.type==='title'){
    pageEl.innerHTML=
      '<div class="html-inner title-page">'+
        '<div class="title">C++ машинаға бағытталған бағдарламалау</div>'+
        '<div class="sub">Электронды оқу құралы</div>'+
        '<div class="title-text">'+
          '<p>Бұл электронды оқу құралы C++ тілін меңгеруге арналған дәрістік және практикалық материалдарды бір жүйеге біріктіреді. Оқу құралында пәннің негізгі тақырыптары бойынша дәрістер мен зертханалық жұмыстар жинақталған.</p>'+
          '<p>Материалдар оқу ретімен орналастырылып, қажетті дәріс пен зертханалық жұмысқа мазмұн арқылы тікелей өтуге мүмкіндік береді. Зертханалық жұмыстардан кейін тақырыпты бекітуге арналған қосымша бейнесабақтарға сілтемелер ұсынылады.</p>'+
        '</div>'+
        '<div class="city">Астана 2026</div>'+
      '</div>';
  }

  else if(p.type==='toc'){
    pageEl.innerHTML=tocHTML();
  }

  else if(p.type==='video'){
    pageEl.innerHTML=videoHTML(p.lab);
  }

  bindLinks();
}

async function loadPDFs(){
  state.pdfs.lectures=
    await pdfjsLib.getDocument('source/lectures.pdf').promise;

  state.pdfs.labs=
    await pdfjsLib.getDocument('source/labs.pdf').promise;
}

async function renderPDF(p){
  pageEl.className='page';
  pageEl.innerHTML='';

  const canvas=document.createElement('canvas');
  pageEl.appendChild(canvas);

  const pdf=state.pdfs[p.doc];
  const pdfPage=await pdf.getPage(p.pdfPage);

  const base=pdfPage.getViewport({scale:1});
  const wrapW=pageEl.clientWidth;
  const dpr=Math.min(window.devicePixelRatio||1,2);

  const scale=(wrapW/base.width)*state.zoom*dpr;
  const vp=pdfPage.getViewport({scale});

  canvas.width=Math.floor(vp.width);
  canvas.height=Math.floor(vp.height);
  canvas.style.width='100%';
  canvas.style.height='100%';

  await pdfPage.render({
    canvasContext:canvas.getContext('2d',{alpha:false}),
    viewport:vp
  }).promise;

  const n=document.createElement('div');
  n.className='page-number';
  n.textContent=String(state.index+1);
  pageEl.appendChild(n);
}

async function render(){
  $('counter').textContent=
    `${state.index+1} / ${state.pages.length}`;

  $('total').textContent=state.pages.length;
  $('pageInput').value=state.index+1;
  loading.style.display='flex';

  try{
    const p=state.pages[state.index];

    if(p.type==='pdf'){
      await renderPDF(p);
    }else{
      renderHTML();
    }
  }
  catch(e){
    console.error(e);
    pageEl.className='page html-page';
    pageEl.innerHTML=
      '<div class="html-inner">'+
      '<h1>Бетті ашу мүмкін болмады</h1>'+
      '<p>PDF файлдары source папкасында бар екенін тексеріңіз.</p>'+
      '</div>';
  }

  loading.style.display='none';
}

function go(i){
  if(i<0||i>=state.pages.length)return;
  state.index=i;
  render();
}

function bindLinks(){
  document.querySelectorAll('[data-target]').forEach(el=>{
    el.onclick=()=>go(Number(el.dataset.target));
  });
}

function openSide(){
  $('sidebar').classList.add('open');
  $('overlay').classList.add('show');
}

function closeSide(){
  $('sidebar').classList.remove('open');
  $('overlay').classList.remove('show');
}

function setZoom(z){
  state.zoom=Math.max(.75,Math.min(1.5,z));
  $('zoomLabel').textContent=Math.round(state.zoom*100)+'%';
  render();
}

function search(q){
  q=q.trim().toLowerCase();
  if(!q)return;

  let i=META.lectures.findIndex(
    x=>x[1].toLowerCase().includes(q)
  );

  if(i>=0)return go(lecturePage(META.lectures[i][0]));

  i=META.labs.findIndex(
    x=>x[1].toLowerCase().includes(q)
  );

  if(i>=0)return go(labPage(META.labs[i][0]));

  alert('Іздеу бойынша нәтиже табылмады.');
}

$('menuBtn').onclick=openSide;
$('close').onclick=closeSide;
$('overlay').onclick=closeSide;

$('prev').onclick=()=>go(state.index-1);
$('next').onclick=()=>go(state.index+1);

$('prevBottom').onclick=()=>go(state.index-1);
$('nextBottom').onclick=()=>go(state.index+1);

$('bottomToc').onclick=openSide;
$('bottomFull').onclick=
  ()=>document.documentElement.requestFullscreen?.();

$('zoomOut').onclick=()=>setZoom(state.zoom-.1);
$('zoomIn').onclick=()=>setZoom(state.zoom+.1);
$('fit').onclick=()=>setZoom(1);

$('theme').onclick=()=>{
  document.body.classList.toggle('dark');
  $('theme').textContent=
    document.body.classList.contains('dark')?'Жарық':'Қараңғы';
};

$('full').onclick=
  ()=>document.documentElement.requestFullscreen?.();

$('go').onclick=
  ()=>go(Number($('pageInput').value)-1);

$('pageInput').onkeydown=e=>{
  if(e.key==='Enter')$('go').click();
};

$('search').onkeydown=e=>{
  if(e.key==='Enter')search(e.target.value);
};

document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;

  if(e.key==='ArrowRight'||e.key===' '){
    e.preventDefault();
    go(state.index+1);
  }

  if(e.key==='ArrowLeft'){
    e.preventDefault();
    go(state.index-1);
  }

  if(e.key==='Escape')closeSide();
});

(async()=>{
  buildPages();
  $('tocSide').innerHTML=sideHTML();

  document.querySelector('.side-home').onclick=()=>go(0);

  bindLinks();

  await render();

  try{
    await loadPDFs();
    await render();
  }
  catch(e){
    console.error(e);
  }
})();

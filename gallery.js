/* RangoliMotion v6 Gallery: each entry corresponds to its own transparent WebP file.
   Raster animation is an artistic preview, not a verified drawing tutorial. */
(() => {
  'use strict';
  if (document.getElementById('rangoliDesignLibrary')) return;
  const items = window.RangoliDesignLibraryData || [];
  if (!items.length) return;
  const workspace = document.querySelector('main .workspace');
  const upload = document.getElementById('fileInput');
  if (!workspace || !upload) return;

  const esc = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const types = ['All','Diya','Floral','Peacock','Festival','Symbols'];
  let modeFilter='all';
  let filter = 'All';
  let search = '';
  let selected = null;
  let selectionToken = 0;

  const library = document.createElement('section');
  library.id = 'rangoliDesignLibrary';
  library.className = 'rm-library';
  library.setAttribute('aria-label','Browse 31 rangoli designs in vector drawing or image preview mode');
  library.innerHTML = `
    <div class="rm-lib-heading">
      <div><span class="rm-lib-kicker">CURATED MOTION COLLECTION / 31 DESIGNS</span>
        <h2>Find your next rangoli.</h2>
        <p>Choose a design. Authored templates draw known paths; image previews are automatically traced into estimated guide dots, contours and colour regions. Both use the five mandatory stages.</p>
      </div><span class="rm-lib-count">31 designs</span>
    </div>
    <div class="rm-lib-tools">
      <input id="rmLibrarySearch" class="rm-lib-search" aria-label="Search rangoli designs" type="search" placeholder="Search diya, lotus, peacock…" autocomplete="off">
      <div class="rm-lib-modes" role="group" aria-label="Filter by animation capability">
          <button type="button" class="rm-lib-mode is-active" data-mode-filter="all" aria-pressed="true">All 31</button>
          <button type="button" class="rm-lib-mode" data-mode-filter="vector_draw" aria-pressed="false">Draw Mode · 6</button>
          <button type="button" class="rm-lib-mode" data-mode-filter="image_preview" aria-pressed="false">Auto-Trace · 25</button>
        </div>
      </div>
      <div class="rm-lib-tools rm-lib-category-tools"><div class="rm-lib-filters" role="group" aria-label="Filter rangoli categories">
        ${types.map(type=>`<button class="rm-lib-filter ${type==='All'?'is-active':''}" type="button" data-filter="${type}" aria-pressed="${type==='All'}">${type}</button>`).join('')}
      </div>
    </div>
    <div id="rmGalleryGrid" class="rm-lib-grid"></div>
    <div id="rmGalleryStatus" class="rm-lib-gallery-status" role="status" aria-live="polite">Choose a design to animate it above.</div>
    <p class="rm-lib-disclaimer">Gallery assets are artistic recreations derived from the supplied collages. All playable images follow dots → outline → complete outline → colour regions → final detail. Six designs use authored paths; 25 images use <strong>automatically estimated contour tracing</strong> when selected. Estimated guides and stroke order are not verified tutorials. Confirm cultural text and artwork rights before distribution.</p>`;
  workspace.insertAdjacentElement('afterend', library);

  const grid = library.querySelector('#rmGalleryGrid');
  const status = library.querySelector('#rmGalleryStatus');
  const render = () => {
    const filtered = items.filter(item => (modeFilter==='all'||item.mode===modeFilter) && (filter==='All'||item.category.toLowerCase()===filter.toLowerCase()) &&
      (!search || `${item.title} ${item.collection} ${item.category}`.toLowerCase().includes(search)));
    library.querySelector('.rm-lib-count').textContent = `${filtered.length} of ${items.length} designs`;
    grid.innerHTML = filtered.length ? filtered.map(item=>`
      <button type="button" class="rm-lib-card ${item.id===selected?'is-selected':''}" data-rangoli="${esc(item.id)}" aria-pressed="${item.id===selected}" title="${item.mode==='vector_draw'?'Draw':'Preview'} ${esc(item.title)}">
        <span class="rm-lib-card-image"><img src="${esc(item.src)}" loading="lazy" decoding="async" alt="${esc(item.title)} rangoli with transparent background"></span>
        <span class="rm-lib-mode-badge ${item.mode==='vector_draw'?'is-vector':'is-preview'}">${item.mode==='vector_draw'?'✎ Draw Mode':'◌ Auto-Trace Preview'}</span>
        <span class="rm-lib-card-title">${esc(item.title)}</span>
        <span class="rm-lib-card-sub"><span>${esc(item.collection==='Festival Rangoli'?'Festival':'Decorative')}</span><span>${esc(item.category)}</span></span>
      </button>`).join('') : '<p class="rm-lib-empty">No designs match this filter. Try another category or search term.</p>';
  };

  async function select(item) {
    const token = ++selectionToken;
    if(item.mode==='vector_draw'){
      const ok=window.RangoliStudioSelectVector?.(item.modelId||item.id);
      if(!ok){status.textContent='Drawing template unavailable. Check drawable-designs.js in the deployed release.';return;}
      selected=item.id;render();
      status.textContent=item.title+' selected: dots, ordered real vector strokes, and one-by-one color regions. This is a stylized interpretation.';
      document.getElementById('previewColumn')?.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    const button = library.querySelector(`[data-rangoli="${item.id}"]`);
    if (button) button.disabled=true;
    status.textContent = `Loading ${item.title}…`;
    try {
      const response = await fetch(item.src,{cache:'force-cache'});
      if (!response.ok) throw new Error('Asset HTTP '+response.status);
      const blob = await response.blob();
      if (!blob.size || !blob.type.startsWith('image/')) throw new Error('Invalid image file');
      if (token!==selectionToken) return;
      const file = new File([blob],`${item.title}.webp`,{type:'image/webp'});
      const dt = new DataTransfer();
      dt.items.add(file);
      upload.files = dt.files;
      upload.dispatchEvent(new Event('change',{bubbles:true}));
      selected = item.id;
      render();
      status.textContent = `${item.title}: processing its image into estimated strokes and colour regions. This is not a verified tutorial.`;
      document.getElementById('previewColumn')?.scrollIntoView({behavior:'smooth',block:'start'});
    } catch (err) {
      console.error('Rangoli gallery image failed to load',err);
      status.textContent = `Couldn't open ${item.title}. Confirm the gallery files were included in the DigiOps release.`;
    } finally {
      if (button && button.isConnected) button.disabled=false;
    }
  }

  grid.addEventListener('click',event=>{
    const card=event.target.closest('button[data-rangoli]');
    if (!card) return;
    const item = items.find(i=>i.id===card.dataset.rangoli);
    if(item) select(item);
  });
  library.querySelector('#rmLibrarySearch').addEventListener('input',event=>{
    search = event.target.value.trim().toLowerCase();render();
  });
  library.querySelector('.rm-lib-filters').addEventListener('click',event=>{
    const choice=event.target.closest('button[data-filter]');
    if(!choice)return;
    filter=choice.dataset.filter;
    library.querySelectorAll('.rm-lib-filter').forEach(b=>{const active=b===choice;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
    render();
  });
  library.querySelector('.rm-lib-modes').addEventListener('click',event=>{
    const choice=event.target.closest('button[data-mode-filter]');
    if(!choice)return;
    modeFilter=choice.dataset.modeFilter;
    library.querySelectorAll('.rm-lib-mode').forEach(b=>{
      const active=b===choice;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));
    });
    render();
  });
  for(const id of ['selectLotus','selectGeometric','restoreSample']){
    document.getElementById(id)?.addEventListener('click',()=>{selectionToken++;selected=null;render();});
  }
  upload.addEventListener('click',()=>{selectionToken++;selected=null;render();});
  document.addEventListener('rangoli:processed',event=>{
    const detail=event.detail;
    if(!selected || !detail)return;
    if(detail.status==='traced'){
      status.textContent=`Auto-traced image: ${detail.stats.tracedPaths} contours and ${detail.stats.regionCount} colour regions. All five stages are mandatory. Paths are estimated, not verified lessons.`;
    }else if(detail.status==='failed'){
      status.textContent='Could not derive reliable drawing paths. This image remains preview-only; choose a clearer image for dot-to-draw animation.';
      selected=null;render();
    }
  });
  const browse=document.createElement('a');
  browse.href='#rangoliDesignLibrary';
  browse.className='rm-lib-jump';
  browse.textContent='✦  Browse all 31 rangoli designs';
  document.querySelector('.asset-section .design-picker')?.insertAdjacentElement('afterend',browse);
  render();
  window.RangoliGalleryDiagnostics = () => ({count:items.length,vector:items.filter(x=>x.mode==='vector_draw').length,preview:items.filter(x=>x.mode==='image_preview').length,filtered:grid.querySelectorAll('[data-rangoli]').length,selected,filter,modeFilter});
})();

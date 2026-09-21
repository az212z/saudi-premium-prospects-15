'use strict';
(() => {
 const data=JSON.parse(document.getElementById('site-data').textContent);
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nf=new Intl.NumberFormat('ar-SA',{maximumFractionDigits:2});
 const services=data.services, byId=new Map(services.map(s=>[s.id,s]));
 let selected=new Set(),limit=12,photoIndex=0,toastTimer;
 const params=new URLSearchParams(location.search);
 $('#search').value=params.get('q')||'';
 const initial=params.get('category')||'';
 if ([...$('#category').options].some(o=>o.value===initial)) $('#category').value=initial;
 try {const saved=JSON.parse(sessionStorage.getItem('visit-'+data.key)||'[]');selected=new Set(saved.filter(id=>byId.has(id)));}catch{}
 const duration=s=>{const min=s.minutes,max=s.maxMinutes;return min?(max>min?`${nf.format(min)}–${nf.format(max)} دقيقة`:`${nf.format(min)} دقيقة`):'المدة حسب الخيار';};
 const price=s=>s.price===null?'السعر عند الحجز':`${s.starts?'من ':''}${nf.format(s.price)} <small>ر.س</small>`;
 const norm=s=>s.toLowerCase().normalize('NFKD').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي');
 function syncUrl(){const p=new URLSearchParams(location.search);const q=$('#search').value.trim(),c=$('#category').value;q?p.set('q',q):p.delete('q');c?p.set('category',c):p.delete('category');history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+location.hash);}
 function render(){const q=norm($('#search').value.trim()),c=$('#category').value;const filtered=services.filter(s=>(!c||s.category===c)&&(!q||norm(s.name+' '+s.original+' '+s.category).includes(q)));
 $('#result-count').textContent=`${nf.format(filtered.length)} خدمة وباقة`;
 $('#service-list').innerHTML=filtered.slice(0,limit).map(s=>`<article class="service-card"><div class="service-text"><span class="service-category">${h(s.category)}</span><h3><button class="service-name" data-detail="${h(s.id)}" aria-haspopup="dialog">${h(s.name)}</button></h3><p class="service-duration">${duration(s)}${s.variants.length>1?' · خيارات متعددة':''}</p></div><div class="service-action"><p class="service-price">${price(s)}</p><button class="add-service" data-add="${h(s.id)}" aria-pressed="${selected.has(s.id)}" aria-label="${selected.has(s.id)?'إزالة':'اختيار'} ${h(s.name)}">${selected.has(s.id)?'مختارة':'اختيار'}</button></div></article>`).join('')||'<p class="empty-state">لم نجد خدمة بهذا الاسم. جرّب اسمًا أقصر أو اختر كل الأقسام.</p>';
 $('#load-more').hidden=limit>=filtered.length;
 }
 function toast(t){$('.toast').textContent=t;$('.toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('.toast').classList.remove('show'),2300);}
 function selectedServices(){return [...selected].map(id=>byId.get(id));}
 function totalText(){const list=selectedServices();if(list.some(s=>s.price===null))return 'الإجمالي يُراجع عند الحجز';return `${list.some(s=>s.starts)?'يبدأ من ':''}${nf.format(list.reduce((a,s)=>a+s.price,0))} ر.س`;}
 function persist(){try{sessionStorage.setItem('visit-'+data.key,JSON.stringify([...selected]));}catch{}}
 function selectionRender(){const list=selectedServices();$('#selection-open').hidden=!list.length;$('#selection-count').textContent=nf.format(list.length);$('#selection-total').textContent=totalText();$('#selected-list').innerHTML=list.map(s=>`<div class="selected-item"><div>${h(s.name)}<small>${duration(s)} · ${price(s)}</small></div><button class="remove-service" data-remove="${h(s.id)}" aria-label="إزالة ${h(s.name)}">إزالة</button></div>`).join('')||'<p class="empty-state">لم تختر خدمات بعد. أغلق النافذة واستعرض القائمة.</p>';$('.selection-summary').innerHTML=list.length?`<span>المجموع الاسترشادي</span><span>${totalText()}</span>`:'';$('#copy-selection').disabled=!list.length;persist();}
 function toggle(id){if(!byId.has(id))return;selected.has(id)?selected.delete(id):selected.add(id);render();selectionRender();toast(selected.has(id)?'أُضيفت إلى اختيارات الزيارة':'أُزيلت من الاختيارات');}
 function showDetails(id){const s=byId.get(id);if(!s)return;$('#service-details').innerHTML=`<p class="section-label">${h(s.category)}</p><h2>${h(s.name)}</h2><p class="detail-meta">${duration(s)} · ${price(s)}</p>${s.variants.length>1?`<ul class="variant-list">${s.variants.map(v=>`<li><span>${h(v.name)}</span><small>${h(v.price)} · ${h(v.duration)}</small></li>`).join('')}</ul>`:''}<p class="source-note">السعر والمدة بحسب الخيار. تتم مراجعة التفاصيل وتأكيد الموعد داخل منصة الحجز.</p><button class="button primary" data-detail-add="${h(id)}">${selected.has(id)?'إزالة من الاختيارات':'إضافة إلى اختيارات الزيارة'}</button>`;$('#service-dialog').showModal();}
 $('#service-list').addEventListener('click',e=>{const a=e.target.closest('[data-add]'),d=e.target.closest('[data-detail]');if(a)toggle(a.dataset.add);if(d)showDetails(d.dataset.detail);});
 $('#service-details').addEventListener('click',e=>{const b=e.target.closest('[data-detail-add]');if(b){toggle(b.dataset.detailAdd);$('#service-dialog').close();}});
 $('#selected-list').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){selected.delete(b.dataset.remove);render();selectionRender();}});
 $('#search').addEventListener('input',()=>{limit=12;render();syncUrl();});
 $('#category').addEventListener('change',()=>{limit=12;render();syncUrl();});
 $('.clear-filters').addEventListener('click',()=>{$('#search').value='';$('#category').value='';limit=12;render();syncUrl();$('#search').focus();});
 $('#load-more').addEventListener('click',()=>{const n=$$('.service-name').length;limit+=18;render();$$('.service-name')[n]?.focus({preventScroll:true});});
 $$('[data-category-pick]').forEach(a=>a.addEventListener('click',()=>{$('#category').value=a.dataset.categoryPick;$('#search').value='';limit=12;render();syncUrl();}));
 $('#selection-open').addEventListener('click',()=>{selectionRender();$('#copy-status').textContent='';$('#selection-dialog').showModal();});
 $('#copy-selection').addEventListener('click',async()=>{const text=`اختيارات زيارة ${data.name}\n${selectedServices().map(s=>`• ${s.name} — ${s.price===null?'السعر عند الحجز':(s.starts?'من ':'')+nf.format(s.price)+' ر.س'}`).join('\n')}\nالمجموع الاسترشادي: ${totalText()}\nللاستفسار فقط؛ لا يمثل حجزًا مؤكدًا.\n${data.fresha}`;try{await navigator.clipboard.writeText(text);$('#copy-status').textContent='نُسخت الاختيارات. يمكنك الآن متابعة الحجز.';}catch{$('#copy-status').textContent='تعذّر النسخ التلقائي. يمكنك متابعة الحجز واختيار خدماتك من القائمة.';}});
 function showPhoto(i){photoIndex=(i+data.gallery.length)%data.gallery.length;$('#gallery-full').src=data.gallery[photoIndex];$('#gallery-full').alt=`${data.name} — صورة ${photoIndex+1} كاملة` ;$('#gallery-count').textContent=`${nf.format(photoIndex+1)} / ${nf.format(data.gallery.length)}`;}
 $$('[data-image]').forEach(b=>b.addEventListener('click',()=>{showPhoto(Number(b.dataset.image));$('#gallery-dialog').showModal();}));
 $('#gallery-prev').addEventListener('click',()=>showPhoto(photoIndex-1));$('#gallery-next').addEventListener('click',()=>showPhoto(photoIndex+1));
 $('#gallery-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(photoIndex+1);}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(photoIndex-1);}});
 $$('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
 $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
 $('.menu-toggle').addEventListener('click',()=>{$('#mobile-menu').showModal();$('.menu-toggle').setAttribute('aria-expanded','true');});
 $('#mobile-menu').addEventListener('close',()=>$('.menu-toggle').setAttribute('aria-expanded','false'));
 $$('#mobile-menu nav a').forEach(a=>a.addEventListener('click',()=>$('#mobile-menu').close()));
 render();selectionRender();
})();

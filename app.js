'use strict';
// Демонстрационные данные. Не включать настоящий каталог в публичный код.
const DEMO = {
  mine: [
    {id:12,rarity:'обычный',name:'Медная шестерёнка',quantity:2},
    {id:44,rarity:'необычный',name:'Лунный ключ',quantity:1},
    {id:91,rarity:'необычный',name:'Мышиный радиопеленгатор',quantity:3},
    {id:133,rarity:'редкий',name:'Хрустальный осколок',quantity:1},
  ],
  all: [
    {id:12,rarity:'обычный',name:'Медная шестерёнка'},
    {id:44,rarity:'необычный',name:'Лунный ключ'},
    {id:91,rarity:'необычный',name:'Мышиный радиопеленгатор'},
    {id:133,rarity:'редкий',name:'Хрустальный осколок'},
    {id:194,rarity:'эпический',name:'Большая печать Академии'},
    {id:200,rarity:'легендарный',name:'Звёздная реликвия'},
  ]
};
const colors={'обычный':'#b6aaa0','необычный':'#5caa73','редкий':'#619bd7','эпический':'#a77cce','легендарный':'#e5b64d'};
let tab='mine',rarity='all';
// Только отображение профиля. VK ID из браузера нельзя считать подтвержденным.
const vkLaunchUserId = new URLSearchParams(location.search).get('vk_user_id');
const el=id=>document.getElementById(id);
const safeText=(value)=>String(value??'');
function cardVisual(item){
 const face=document.createElement('div');face.className='art';face.style.setProperty('--accent',colors[item.rarity]||'#b6aaa0');
 if(item.imageUrl){const img=document.createElement('img');img.src=item.imageUrl;img.alt=`Карточка №${item.id}`;img.onerror=()=>{face.replaceChildren();addPlaceholder(face,item)};face.append(img)}
 else addPlaceholder(face,item);
 return face;
}
function addPlaceholder(face,item){const symbol=document.createElement('div');symbol.className='symbol';symbol.textContent='✦';const name=document.createElement('div');name.className='name';name.textContent='Изображение скоро появится';face.append(symbol,name)}
function render(){
 document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 el('profile').hidden=tab!=='mine';
 document.querySelectorAll('[data-rarity]').forEach(b=>b.classList.toggle('selected',b.dataset.rarity===rarity));
 const all=DEMO[tab],filtered=all.filter(x=>rarity==='all'||x.rarity===rarity);
 el('counter').textContent=`${all.length} из 200`;el('percent').textContent=`${(all.length/2).toLocaleString('ru-RU',{maximumFractionDigits:1})}%`;el('progress').style.width=`${all.length/2}%`;
 const shelf=el('shelf');shelf.replaceChildren();el('empty').hidden=filtered.length>0;
 if(!filtered.length){el('empty').textContent=all.length?'В этой категории пока нет найденных артефактов.':'В вашей сокровищнице пока нет артефактов. Продолжайте вышивать и не забывайте отчитываться в контрольные точки!'}
 filtered.sort((a,b)=>a.id-b.id).forEach(item=>{
  const btn=document.createElement('button');btn.className='artifact';btn.setAttribute('aria-label',`Артефакт №${item.id}`);btn.append(cardVisual(item));
  if(tab==='mine'&&item.quantity>1){const count=document.createElement('span');count.className='count';count.textContent=`×${item.quantity}`;btn.append(count)}
  const num=document.createElement('div');num.className='number';num.textContent=`№ ${String(item.id).padStart(3,'0')}`;btn.append(num);btn.addEventListener('click',()=>openCard(item));shelf.append(btn);
 });
}
function openCard(item){el('bigCard').replaceChildren(cardVisual(item));el('quantity').textContent=tab==='mine'?`Экземпляров: ${item.quantity||1}`:'';el('cardDialog').showModal()}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;rarity='all';render()}));
document.querySelectorAll('[data-rarity]').forEach(b=>b.addEventListener('click',()=>{rarity=b.dataset.rarity;render()}));
el('refresh').addEventListener('click',()=>{render();el('notice').textContent='Демонстрационный режим: данные обновлены локально. Подключение к таблице будет добавлено позже.'});
el('close').addEventListener('click',()=>el('cardDialog').close());
el('cardDialog').addEventListener('click',e=>{if(e.target===el('cardDialog'))el('cardDialog').close()});
if(vkLaunchUserId && /^\d{1,20}$/.test(vkLaunchUserId)){el('profileHint').textContent='Открыто через ВК · данные пока демонстрационные';}
render();

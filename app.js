'use strict';
// Публичный read-only API. Никаких токенов или полного каталога в репозитории.
const API_URL = 'https://script.google.com/macros/s/AKfycbwiCpPxUFHZbnixMqbbBLZLPdTMaqhj-DJXScrfrNF6iQYOhiRKiBE4wmCrM6l8PwbrSQ/exec';
const TOTAL_FALLBACK = 200;
const colors = {'обычный':'#b6aaa0','необычный':'#5caa73','редкий':'#619bd7','эпический':'#a77cce','легендарный':'#e5b64d'};
const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
// В браузере без VK launch params личную коллекцию определить невозможно.
const vkId = /^\d{1,20}$/.test(params.get('vk_user_id') || '') ? params.get('vk_user_id') : null;
let tab = 'mine', rarity = 'all', total = TOTAL_FALLBACK;
let collections = {mine:[],all:[]};
let loaded = false;
let requestNumber = 0;

function jsonp(url, timeoutMs = 16000) {
  return new Promise((resolve, reject) => {
    const callback = 'treasuryCallback_' + Date.now() + '_' + Math.floor(Math.random()*1e8);
    const script = document.createElement('script');
    let finished = false;
    const cleanup = () => { delete window[callback]; script.remove(); clearTimeout(timer); };
    const fail = message => { if(finished) return; finished = true; cleanup(); reject(new Error(message)); };
    const timer = setTimeout(() => fail('Превышено время ожидания ответа'), timeoutMs);
    window[callback] = data => { if(finished) return; finished = true; cleanup(); resolve(data); };
    script.onerror = () => fail('Не удалось связаться с сервером');
    const request = new URL(url);
    request.searchParams.set('callback', callback);
    request.searchParams.set('_', String(Date.now()));
    script.src = request.toString();
    document.head.append(script);
  });
}
function placeholder(face, item) {
  const symbol = document.createElement('div'); symbol.className = 'symbol'; symbol.textContent = '✦';
  const label = document.createElement('div'); label.className = 'name'; label.textContent = 'Изображение скоро появится';
  face.append(symbol,label);
}
function cardVisual(item) {
  const face = document.createElement('div'); face.className = 'art';
  face.style.setProperty('--accent', colors[String(item.rarity).toLowerCase()] || '#b6aaa0');
  const url = String(item.imageUrl || '');
  if (/^https:\/\/res\.cloudinary\.com\/jlcfrihy\/image\/upload\//.test(url)) {
    const image = document.createElement('img');
    image.src = url;
    image.alt = `Карточка «${item.name}», №${item.id}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    face.style.padding = '0';
    image.addEventListener('error', () => {
      image.remove();
      face.style.padding = '';
      placeholder(face, item);
    }, {once:true});
    face.append(image);
  } else {
    placeholder(face,item);
  }
  return face;
}
function render() {
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('[data-rarity]').forEach(b => b.classList.toggle('selected', b.dataset.rarity === rarity));
  el('profile').hidden = tab !== 'mine';
  const items = collections[tab];
  const unique = items.length;
  const percent = total ? unique / total * 100 : 0;
  el('counter').textContent = `${unique} из ${total}`;
  el('percent').textContent = `${percent.toLocaleString('ru-RU',{maximumFractionDigits:1})}%`;
  el('progress').style.width = `${Math.min(100,percent)}%`;
  const shelf = el('shelf'); shelf.replaceChildren();
  const filtered = items.filter(item => rarity === 'all' || String(item.rarity).toLowerCase() === rarity);
  el('empty').hidden = !loaded || filtered.length > 0;
  if (loaded && !filtered.length) {
    el('empty').textContent = items.length
      ? 'В этой категории пока нет найденных артефактов.'
      : (tab === 'mine' ? 'Вы пока не нашли ни одного артефакта. Продолжайте вышивать и не забывайте отчитываться в контрольные точки! А пока загляните в общую сокровищницу.' : 'В общей сокровищнице пока нет артефактов.');
  }
  filtered.slice().sort((a,b) => a.id-b.id).forEach(item => {
    const btn = document.createElement('button'); btn.className = 'artifact';
    btn.setAttribute('aria-label', `Артефакт №${item.id}: ${item.name}`);
    btn.append(cardVisual(item));
    const quantity = Number(item.count || item.quantity || 1);
    if(tab === 'mine' && quantity > 1) {
      const count = document.createElement('span'); count.className = 'count'; count.textContent = `×${quantity}`; btn.append(count);
    }
    const num = document.createElement('div'); num.className = 'number'; num.textContent = `№ ${String(item.id).padStart(3,'0')}`;
    btn.append(num); btn.addEventListener('click', () => openCard(item)); shelf.append(btn);
  });
}
function openCard(item) {
  el('bigCard').replaceChildren(cardVisual(item));
  el('quantity').textContent = tab === 'mine' ? `Экземпляров: ${Number(item.count || item.quantity || 1)}` : '';
  el('cardDialog').showModal();
}
async function loadData() {
  const current = ++requestNumber;
  const refresh = el('refresh'); refresh.disabled = true;
  el('notice').textContent = 'Загружаем находки из сокровищницы…';
  const url = new URL(API_URL); url.searchParams.set('action','collection');
  // API v2 требует vkId; если мы не внутри ВК, используем 0 для общей коллекции.
  url.searchParams.set('vkId', vkId || '0');
  try {
    const data = await jsonp(url.toString());
    if(current !== requestNumber) return;
    if(!data || data.ok !== true || !data.personal || !data.common) throw new Error('Сервер вернул некорректные данные');
    total = Number(data.total) || TOTAL_FALLBACK;
    collections = {mine:Array.isArray(data.personal.cards)?data.personal.cards:[], all:Array.isArray(data.common.cards)?data.common.cards:[]};
    loaded = true;
    el('notice').textContent = vkId ? 'Коллекция обновлена.' : 'Общая сокровищница загружена. Личная коллекция появится при открытии приложения через ВК.';
    render();
  } catch(err) {
    if(current !== requestNumber) return;
    el('notice').textContent = `Не удалось загрузить коллекцию: ${err.message}. Нажмите ↻ для повторной попытки.`;
  } finally { if(current === requestNumber) refresh.disabled = false; }
}
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; rarity = 'all'; render(); }));
document.querySelectorAll('[data-rarity]').forEach(b => b.addEventListener('click', () => { rarity = b.dataset.rarity; render(); }));
el('refresh').addEventListener('click', loadData);
el('close').addEventListener('click', () => el('cardDialog').close());
el('cardDialog').addEventListener('click', e => {if(e.target === el('cardDialog')) el('cardDialog').close();});
el('profileName').textContent = vkId ? 'Моя коллекция' : 'Гость Академии';
el('profileHint').textContent = vkId ? 'Данные из сокровищницы' : 'Откройте приложение через ВК, чтобы увидеть личные находки';
render();
loadData();

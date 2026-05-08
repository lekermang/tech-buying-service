import Icon from "@/components/ui/icon";
import { PHOTOS_URL } from "./types";

export default function BookmarkletHelper({ token, onClose }: { token: string; onClose: () => void }) {
  const apiUrl = PHOTOS_URL;
  const bookmarkletCode = `javascript:(function(){var TOKEN=${JSON.stringify(token)};var API=${JSON.stringify(apiUrl)};function note(t,c){var d=document.createElement('div');d.style.cssText='position:fixed;top:20px;right:20px;z-index:999999;background:'+(c||'#000')+';color:#fff;padding:14px 18px;border-radius:8px;font:14px/1.4 Arial;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:300px';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove();},5000);return d;}var m=location.pathname.match(/_(\\d{6,})(?:\\/|$)/);if(!m){alert('Откройте страницу товара Авито');return;}var avitoId=parseInt(m[1]);var imgs=[];document.querySelectorAll('meta[property="og:image"]').forEach(function(e){var u=e.getAttribute('content');if(u)imgs.push(u);});document.querySelectorAll('img').forEach(function(i){var s=i.src||'';if(s.indexOf('avito.st/image')>0&&imgs.indexOf(s)<0)imgs.push(s);});imgs=imgs.slice(0,5);var d='';var dm=document.querySelector('meta[property="og:description"]');if(dm)d=dm.getAttribute('content')||'';var dd=document.querySelector('[data-marker="item-view/item-description"]');if(dd&&dd.textContent)d=dd.textContent.trim();if(!imgs.length){alert('Фото не найдены на странице');return;}var loader=note('Загружаю '+imgs.length+' фото...','#7e22ce');Promise.all(imgs.map(function(u){return fetch(u).then(function(r){return r.blob();}).then(function(b){return new Promise(function(res){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.readAsDataURL(b);});});})).then(function(b64){return fetch(API+'?action=bookmarklet_save',{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({token:TOKEN,avito_id:avitoId,images:b64,description:d})}).then(function(r){return r.json();});}).then(function(r){loader.remove();if(r.ok){note('Готово! Загружено '+r.added+' фото к товару: '+r.title,'#059669');}else{note('Ошибка: '+(r.error||'неизвестно'),'#dc2626');}}).catch(function(e){loader.remove();note('Ошибка: '+e.message,'#dc2626');});})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/85 backdrop-blur flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-gradient-to-br from-[#1a1a1a] to-[#0D0D0D] border-2 border-purple-500/40 rounded-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="shrink-0 flex items-start justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
              <Icon name="Wand2" size={18} className="text-white" />
            </div>
            <div>
              <div className="font-oswald font-bold text-white uppercase tracking-wide">Авто-загрузка фото с Авито</div>
              <div className="text-[11px] text-white/50">Один клик на странице товара = все фото загружены</div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white"><Icon name="X" size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-premium space-y-4">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-purple-300 font-oswald font-bold text-sm uppercase tracking-wide mb-1">
              <Icon name="Info" size={14} />
              Почему так?
            </div>
            <div className="text-[12px] text-white/70 leading-relaxed">
              Авито жёстко блокирует серверы — поэтому фото невозможно скачать с нашего бэкенда. Но <b>браузер сотрудника</b> на странице Авито всё видит. Этот «волшебный bookmarklet» работает 100%, без CORS-проблем.
            </div>
          </div>

          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-xs">1</span>
              Скопируй магическую ссылку
            </div>
            <button
              onClick={copyBookmarklet}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-violet-500 hover:shadow-[0_0_16px_rgba(168,85,247,0.5)] text-white font-oswald font-bold text-sm px-4 py-3 rounded-lg uppercase tracking-wide transition-all"
            >
              <Icon name="Copy" size={16} />
              Скопировать в буфер
            </button>
            <div className="text-[10px] text-white/40 mt-1">или перетащи кнопку ниже в закладки браузера:</div>
            <a
              href={bookmarkletCode}
              onClick={e => { e.preventDefault(); copyBookmarklet(); }}
              className="mt-2 inline-flex items-center gap-1.5 bg-[#FFD700] text-black font-oswald font-bold text-xs px-3 py-2 rounded uppercase tracking-wide hover:bg-[#FFE55C] cursor-grab active:cursor-grabbing"
              draggable
            >
              <Icon name="Star" size={12} />
              📥 Загрузить фото с Авито
            </a>
          </div>

          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-xs">2</span>
              Создай закладку в браузере
            </div>
            <div className="text-[12px] text-white/70 space-y-1.5 ml-8">
              <div><b className="text-white">На компьютере:</b> CTRL+D → имя «Фото с Авито» → URL: вставить из буфера → Сохранить</div>
              <div><b className="text-white">На телефоне (Chrome):</b> ⋮ → «Добавить в закладки» → редактировать → URL: вставить → Сохранить</div>
            </div>
          </div>

          <div>
            <div className="font-oswald font-bold text-white text-sm uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#FFD700] text-black flex items-center justify-center font-bold text-xs">3</span>
              Открой товар на Авито и нажми закладку
            </div>
            <div className="text-[12px] text-white/70 ml-8 space-y-1.5">
              <div>Все 5 фото и описание автоматически добавятся к этому товару на сайте.</div>
              <div className="text-emerald-400">✓ Делается за 3 секунды</div>
              <div className="text-emerald-400">✓ Можно делать прямо с телефона</div>
              <div className="text-emerald-400">✓ Никаких прокси и серверов — всё работает в твоём браузере</div>
            </div>
          </div>

          <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-[#FFD700] font-oswald font-bold text-sm uppercase tracking-wide mb-1">
              <Icon name="Lightbulb" size={14} />
              Совет
            </div>
            <div className="text-[12px] text-white/70 leading-relaxed">
              Эта вкладка автоматически обновляется каждые 5 секунд — открой её на втором экране и сразу увидишь, как товары переходят из «Без фото» в «С фото».
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

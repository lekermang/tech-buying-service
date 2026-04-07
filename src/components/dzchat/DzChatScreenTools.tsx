/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import Icon from "@/components/ui/icon";
import { api } from "./dzchat.utils";

interface Props {
  me: any;
  token: string;
  chats: any[];
}

interface ToolRowProps {
  icon: string;
  label: string;
  desc?: string;
  onPress?: () => void;
  badge?: number;
}

const ToolRow = ({ icon, label, desc, onPress, badge }: ToolRowProps) => (
  <button
    onClick={onPress}
    className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition-colors border-b border-white/5 last:border-0">
    <div className="w-9 h-9 flex items-center justify-center shrink-0">
      <Icon name={icon as any} size={22} className="text-white/70" />
    </div>
    <div className="flex-1 min-w-0 text-left">
      <p className="text-white text-[15px]">{label}</p>
      {desc && <p className="text-white/40 text-xs mt-0.5">{desc}</p>}
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#25D366]/20 text-[#25D366] text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      <Icon name="ChevronRight" size={16} className="text-white/20" />
    </div>
  </button>
);

// Экран быстрых ответов
const QuickRepliesScreen = ({ token, onBack }: { token: string; onBack: () => void }) => {
  const [replies, setReplies] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("dzchat_quick_replies") || "[]"); } catch { return []; }
  });
  const [newReply, setNewReply] = useState("");

  const add = () => {
    if (!newReply.trim()) return;
    const updated = [...replies, newReply.trim()];
    setReplies(updated);
    localStorage.setItem("dzchat_quick_replies", JSON.stringify(updated));
    setNewReply("");
  };

  const remove = (idx: number) => {
    const updated = replies.filter((_, i) => i !== idx);
    setReplies(updated);
    localStorage.setItem("dzchat_quick_replies", JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={onBack} className="text-[#25D366]">
          <Icon name="ArrowLeft" size={22} />
        </button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Быстрые ответы</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 py-3 text-white/40 text-sm">Часто отправляемые сообщения</p>
        {replies.map((r, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
            <Icon name="Zap" size={16} className="text-[#25D366] shrink-0" />
            <p className="text-white text-[14px] flex-1">{r}</p>
            <button onClick={() => remove(i)}>
              <Icon name="Trash2" size={16} className="text-red-400" />
            </button>
          </div>
        ))}
        <div className="px-4 py-4 flex gap-2">
          <input
            value={newReply}
            onChange={e => setNewReply(e.target.value)}
            placeholder="Добавить быстрый ответ..."
            className="flex-1 bg-[#1c1c1e] text-white text-sm px-3 py-2.5 rounded-xl outline-none placeholder-white/30"
            onKeyDown={e => e.key === "Enter" && add()}
          />
          <button onClick={add} className="bg-[#25D366] w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Icon name="Plus" size={20} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Экран приветственного сообщения
const GreetingScreen = ({ onBack }: { onBack: () => void }) => {
  const [text, setText] = useState(() => localStorage.getItem("dzchat_greeting") || "");
  const [enabled, setEnabled] = useState(() => localStorage.getItem("dzchat_greeting_on") === "1");

  const save = () => {
    localStorage.setItem("dzchat_greeting", text);
    localStorage.setItem("dzchat_greeting_on", enabled ? "1" : "0");
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={onBack} className="text-[#25D366]">
          <Icon name="ArrowLeft" size={22} />
        </button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Приветственное сообщение</h2>
        <button onClick={save} className="text-[#25D366] text-sm font-medium">Сохранить</button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-white text-[15px]">Включить приветствие</p>
          <button
            onClick={() => setEnabled(e => !e)}
            className="w-12 h-6 rounded-full relative transition-colors"
            style={{ background: enabled ? "#25D366" : "#3a3a3c" }}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: enabled ? "translateX(26px)" : "translateX(2px)" }} />
          </button>
        </div>
        <p className="text-white/40 text-sm">Автоматически отправляется новым контактам</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Здравствуйте! Чем могу помочь?"
          rows={5}
          className="w-full bg-[#1c1c1e] text-white text-sm px-3 py-3 rounded-xl outline-none placeholder-white/30 resize-none"
        />
      </div>
    </div>
  );
};

// Экран "нет на месте"
const AwayScreen = ({ onBack }: { onBack: () => void }) => {
  const [text, setText] = useState(() => localStorage.getItem("dzchat_away") || "");
  const [enabled, setEnabled] = useState(() => localStorage.getItem("dzchat_away_on") === "1");

  const save = () => {
    localStorage.setItem("dzchat_away", text);
    localStorage.setItem("dzchat_away_on", enabled ? "1" : "0");
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={onBack} className="text-[#25D366]">
          <Icon name="ArrowLeft" size={22} />
        </button>
        <h2 className="text-white font-semibold text-[17px] flex-1">Сообщение "Нет на месте"</h2>
        <button onClick={save} className="text-[#25D366] text-sm font-medium">Сохранить</button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-white text-[15px]">Включить</p>
          <button
            onClick={() => setEnabled(e => !e)}
            className="w-12 h-6 rounded-full relative transition-colors"
            style={{ background: enabled ? "#25D366" : "#3a3a3c" }}>
            <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: enabled ? "translateX(26px)" : "translateX(2px)" }} />
          </button>
        </div>
        <p className="text-white/40 text-sm">Отправляется автоматически когда вы не онлайн</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Я сейчас недоступен. Отвечу позже."
          rows={5}
          className="w-full bg-[#1c1c1e] text-white text-sm px-3 py-3 rounded-xl outline-none placeholder-white/30 resize-none"
        />
      </div>
    </div>
  );
};

type SubScreen = null | "quick_replies" | "greeting" | "away";

const DzChatScreenTools = ({ me, token, chats }: Props) => {
  const [sub, setSub] = useState<SubScreen>(null);

  const totalChats = chats.length;
  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);

  if (sub === "quick_replies") return <QuickRepliesScreen token={token} onBack={() => setSub(null)} />;
  if (sub === "greeting") return <GreetingScreen onBack={() => setSub(null)} />;
  if (sub === "away") return <AwayScreen onBack={() => setSub(null)} />;

  return (
    <div className="flex flex-col h-full" style={{ background: "#000" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3">
        <div className="w-9" />
        <h1 className="text-white font-bold text-[22px]">Инструменты</h1>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Статистика */}
        <div className="px-4 pb-2">
          <p className="text-white/40 text-xs mb-3">Эффективность за последние 7 дней ℹ️</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "Grid3x3", label: "Просмотры каталога", value: "—" },
              { icon: "User", label: "Просмотры профиля", value: String(totalChats) },
              { icon: "Circle", label: "Просмотры статуса", value: "—" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#1c1c1e] rounded-2xl p-3">
                <Icon name={stat.icon as any} size={20} className="text-white/60 mb-2" />
                <p className="text-white font-bold text-xl">{stat.value}</p>
                <p className="text-white/40 text-[10px] mt-1 leading-tight">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Развитие компании */}
        <p className="px-4 pt-5 pb-2 text-white font-bold text-[17px]">Развитие компании</p>
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-5">
          <ToolRow icon="Grid3x3" label="Каталог" desc="Покажите свои товары и услуги" onPress={() => {
            window.open("/catalog", "_blank");
          }} />
          <ToolRow icon="Megaphone" label="Размещение рекламы" desc="Создайте рекламу с переходом в DzChat" />
        </div>

        {/* Упорядочивание чатов */}
        <p className="px-4 pb-2 text-white font-bold text-[17px]">Упорядочивание чатов</p>
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-5">
          <ToolRow icon="Tag" label="Ярлыки" desc="Упорядочивание чатов и клиентов" />
          <ToolRow icon="MessageCircle" label="Приветственное сообщение" desc="Автоматическое приветствие" onPress={() => setSub("greeting")} />
          <ToolRow icon="Moon" label='Сообщение "Нет на месте"' desc="Автоматический ответ" onPress={() => setSub("away")} />
          <ToolRow icon="Zap" label="Быстрые ответы" desc="Часто отправляемые сообщения" onPress={() => setSub("quick_replies")} badge={
            (() => { try { return JSON.parse(localStorage.getItem("dzchat_quick_replies") || "[]").length; } catch { return 0; } })()
          } />
        </div>

        {/* Управление аккаунтом */}
        <p className="px-4 pb-2 text-white font-bold text-[17px]">Управление аккаунтом</p>
        <div className="mx-4 bg-[#1c1c1e] rounded-2xl overflow-hidden mb-8">
          <ToolRow icon="User" label="Профиль" desc="Адрес, часы работы и сайты" />
          <ToolRow icon="BarChart2" label="Статистика" desc={`${totalChats} чатов · ${totalUnread} непрочитанных`} />
        </div>
      </div>
    </div>
  );
};

export default DzChatScreenTools;

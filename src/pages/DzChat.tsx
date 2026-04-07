/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import DzChatAuth from "@/components/dzchat/DzChatAuth";
import DzChatView from "@/components/dzchat/DzChatView";
import DzChatSidebar from "@/components/dzchat/DzChatSidebar";
import DzChatModalsLayer from "@/components/dzchat/DzChatModalsLayer";
import DzChatScreenStatus from "@/components/dzchat/DzChatScreenStatus";
import DzChatScreenCalls from "@/components/dzchat/DzChatScreenCalls";
import DzChatScreenTools from "@/components/dzchat/DzChatScreenTools";
import DzChatScreenSettings from "@/components/dzchat/DzChatScreenSettings";
import { useDzChatState } from "@/components/dzchat/useDzChatState";
import { getTheme } from "@/components/dzchat/dzchat.theme";

type TabId = "status" | "calls" | "tools" | "chats" | "settings";

// ── Splash Screen ──────────────────────────────────────────────────
const DzChatSplash = ({ onDone }: { onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(160deg, #050d14 0%, #0a1929 50%, #06131f 100%)" }}>
      <div className="relative mb-6" style={{ animation: "dz-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
        <div className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl"
          style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}>
          <Icon name="MessageCircle" size={48} className="text-white" />
        </div>
        <div className="absolute inset-0 rounded-[28px]"
          style={{ background: "rgba(37,211,102,0.25)", animation: "dz-pulse-ring 1.2s ease-out 0.5s infinite" }} />
      </div>
      <p className="text-white text-3xl font-black tracking-tight mb-1"
        style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif", animation: "dz-slide-up 0.4s 0.3s both" }}>
        DzChat
      </p>
      <p className="text-white/35 text-sm" style={{ animation: "dz-slide-up 0.4s 0.5s both" }}>
        Мессенджер нового поколения
      </p>
      <div className="absolute bottom-16 w-32 h-[2px] rounded-full overflow-hidden bg-white/10">
        <div className="h-full bg-[#25D366] rounded-full" style={{ animation: "splashBar 1.4s ease both" }} />
      </div>
    </div>
  );
};

// ── Tab Bar ────────────────────────────────────────────────────────
const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: "status",   icon: "Circle",        label: "Статус" },
  { id: "calls",    icon: "Phone",         label: "Звонки" },
  { id: "tools",    icon: "Store",         label: "Инструменты" },
  { id: "chats",    icon: "MessageCircle", label: "Чаты" },
  { id: "settings", icon: "Settings",      label: "Настройки" },
];

const TabBar = ({ active, onChange, totalUnread, notifGranted }: {
  active: TabId; onChange: (t: TabId) => void; totalUnread: number; notifGranted: boolean;
}) => (
  <div className="flex items-end justify-around shrink-0"
    style={{
      background: "rgba(8,10,16,0.98)",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      paddingBottom: "max(env(safe-area-inset-bottom),6px)",
      paddingTop: "7px",
    }}>
    {TABS.map(tab => {
      const isActive = active === tab.id;
      const badge = tab.id === "chats" && totalUnread > 0 ? totalUnread
        : tab.id === "settings" && !notifGranted && "Notification" in window ? 1 : 0;
      return (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className="flex flex-col items-center gap-[3px] relative transition-all active:scale-90"
          style={{ minWidth: 52, padding: "2px 8px" }}>
          {isActive && (
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[#25D366]"
              style={{ animation: "dz-tab-dot 0.2s ease both" }} />
          )}
          <div className="relative">
            <Icon name={tab.icon as any} size={23}
              style={{
                color: isActive ? "#25D366" : "rgba(255,255,255,0.3)",
                filter: isActive ? "drop-shadow(0 0 8px rgba(37,211,102,0.6))" : "none",
                transition: "color 0.18s, filter 0.18s",
              }} />
            {badge > 0 && (
              <span className="absolute -top-1.5 -right-2 text-white font-bold rounded-full flex items-center justify-center"
                style={{
                  background: tab.id === "settings" ? "#ff3b30" : "#25D366",
                  fontSize: 9, minWidth: 15, height: 15, padding: "0 3px",
                  fontFamily: "-apple-system,sans-serif",
                }}>
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? "#25D366" : "rgba(255,255,255,0.28)",
            fontFamily: "-apple-system,BlinkMacSystemFont,sans-serif",
            transition: "color 0.18s",
            letterSpacing: "-0.1px",
          }}>
            {tab.label}
          </span>
        </button>
      );
    })}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────
const DzChat = () => {
  const [activeTab, setActiveTab] = useState<TabId>("chats");
  const [showSplash, setShowSplash] = useState(() => {
    // Показываем сплэш только один раз за сессию
    const shown = sessionStorage.getItem("dzchat_splash");
    if (!shown) { sessionStorage.setItem("dzchat_splash", "1"); return true; }
    return false;
  });

  const {
    token, setToken,
    me, setMe,
    chats,
    activeChat, setActiveChat,
    showNewChat, setShowNewChat,
    showNewGroup, setShowNewGroup,
    showProfile, setShowProfile,
    loadingChats,
    setNewChatId,
    installPrompt,
    notifGranted,
    searchQuery, setSearchQuery,
    theme, setTheme,
    showSetupGuide, setShowSetupGuide,
    incomingCall, setIncomingCall,
    sendTokenToSW,
    requestNotifications,
    loadChats,
    logout,
    installApp,
  } = useDzChatState();

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);
  const filteredChats = searchQuery.trim()
    ? chats.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  const modals = (
    <DzChatModalsLayer
      token={token ?? ""} me={me} chats={chats} theme={theme}
      showNewChat={showNewChat} showNewGroup={showNewGroup}
      showProfile={showProfile} showSetupGuide={showSetupGuide}
      installPrompt={installPrompt} incomingCall={incomingCall}
      onCloseNewChat={() => setShowNewChat(false)}
      onCloseNewGroup={() => setShowNewGroup(false)}
      onCloseProfile={() => setShowProfile(false)}
      onCloseSetupGuide={() => setShowSetupGuide(false)}
      onChatCreated={id => { setNewChatId(id); if (token) loadChats(token); setActiveTab("chats"); }}
      onGroupCreated={id => { setNewChatId(id); if (token) loadChats(token); setActiveTab("chats"); }}
      onMeUpdate={u => setMe(u)}
      onLogout={() => { setShowProfile(false); logout(); }}
      onSwitchAccount={() => { setShowProfile(false); logout(); }}
      onThemeChange={() => setTheme(getTheme(localStorage.getItem("dzchat_theme") ?? "dark"))}
      onOpenSetupGuide={() => { setShowProfile(false); setShowSetupGuide(true); }}
      onInstallApp={installApp}
      onCloseCall={() => setIncomingCall(null)}
    />
  );

  // ── Режим открытого чата (полный экран) ──
  if (token && me && activeChat) {
    return (
      <div className="dzchat-root h-[100dvh] w-full flex justify-center bg-black">
        <div className="w-full max-w-[430px] h-[100dvh] flex flex-col overflow-hidden bg-[#0f1923]">
          <DzChatView
            chat={activeChat} me={me} token={token} theme={theme}
            onBack={() => setActiveChat(null)}
            onChatUpdate={() => loadChats(token)}
          />
          {modals}
        </div>
      </div>
    );
  }

  // ── Авторизация ──
  if (!token || !me) {
    return (
      <div className="dzchat-root h-[100dvh] w-full flex justify-center bg-black">
        <div className="w-full max-w-[430px] h-[100dvh] overflow-hidden">
          <DzChatAuth onAuth={(tok, user) => { sendTokenToSW(tok); setToken(tok); setMe(user); }} />
        </div>
      </div>
    );
  }

  // ── Основной UI с таббаром ──
  const renderScreen = () => {
    switch (activeTab) {
      case "status":
        return <DzChatScreenStatus key="status" me={me} token={token} chats={chats}
          onOpenChat={c => setActiveChat(c)} />;
      case "calls":
        return <DzChatScreenCalls key="calls" me={me} chats={chats}
          onStartCall={c => setActiveChat(c)} onOpenChat={c => setActiveChat(c)} />;
      case "tools":
        return <DzChatScreenTools key="tools" me={me} token={token} chats={chats} />;
      case "settings":
        return <DzChatScreenSettings key="settings"
          me={me} token={token}
          onUpdate={u => setMe(u)}
          onLogout={logout}
          onThemeChange={() => setTheme(getTheme(localStorage.getItem("dzchat_theme") ?? "dark"))}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
          notifGranted={notifGranted}
          onRequestNotifications={requestNotifications}
          totalUnread={totalUnread}
        />;
      default:
        return <DzChatSidebar key="chats"
          me={me} chats={chats} activeChat={activeChat}
          loadingChats={loadingChats} searchQuery={searchQuery}
          notifGranted={notifGranted} installPrompt={installPrompt}
          theme={theme} incomingCall={incomingCall}
          totalUnread={totalUnread} filteredChats={filteredChats}
          onSetActiveChat={setActiveChat}
          onShowProfile={() => setShowProfile(true)}
          onShowNewGroup={() => setShowNewGroup(true)}
          onShowNewChat={() => setShowNewChat(true)}
          onSearchChange={setSearchQuery}
          onRequestNotifications={requestNotifications}
          onInstallApp={installApp}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
        />;
    }
  };

  return (
    <div className="dzchat-root h-[100dvh] w-full flex justify-center bg-black">
      {showSplash && <DzChatSplash onDone={() => setShowSplash(false)} />}

      <div className="w-full max-w-[430px] h-[100dvh] flex flex-col overflow-hidden bg-black">
        <div className="flex-1 overflow-hidden relative" style={{ animation: "dz-slide-up 0.3s ease both" }}>
          {renderScreen()}
        </div>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          totalUnread={totalUnread}
          notifGranted={notifGranted}
        />
        {modals}
      </div>
    </div>
  );
};

export default DzChat;

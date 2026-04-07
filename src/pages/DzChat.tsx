/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
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

interface TabBarProps {
  active: TabId;
  onChange: (t: TabId) => void;
  totalUnread: number;
  notifGranted: boolean;
}

const TabBar = ({ active, onChange, totalUnread, notifGranted }: TabBarProps) => {
  const tabs: { id: TabId; icon: string; label: string }[] = [
    { id: "status",   icon: "Circle",         label: "Статус" },
    { id: "calls",    icon: "Phone",           label: "Звонки" },
    { id: "tools",    icon: "Store",           label: "Инструменты" },
    { id: "chats",    icon: "MessageCircle",   label: "Чаты" },
    { id: "settings", icon: "Settings",        label: "Настройки" },
  ];

  return (
    <div
      className="flex items-center justify-around border-t shrink-0"
      style={{
        background: "#111",
        borderColor: "rgba(255,255,255,0.08)",
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        paddingTop: "8px",
      }}>
      {tabs.map(tab => {
        const isActive = active === tab.id;
        const showBadge =
          (tab.id === "chats" && totalUnread > 0) ||
          (tab.id === "settings" && !notifGranted && "Notification" in window);
        const badgeCount = tab.id === "chats" ? totalUnread : 1;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-0.5 min-w-[52px] relative">
            <div className="relative">
              <Icon
                name={tab.icon as any}
                size={tab.id === "tools" ? 22 : 23}
                style={{ color: isActive ? "#25D366" : "rgba(255,255,255,0.3)" }}
              />
              {showBadge && (
                <span
                  className="absolute -top-1 -right-1.5 text-white text-[9px] font-bold min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-0.5"
                  style={{ background: tab.id === "settings" ? "#e74c3c" : "#25D366" }}>
                  {tab.id === "chats" && totalUnread > 9 ? "9+" : badgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium"
              style={{ color: isActive ? "#25D366" : "rgba(255,255,255,0.3)" }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const DzChat = () => {
  const [activeTab, setActiveTab] = useState<TabId>("chats");

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

  if (!token || !me) return <DzChatAuth onAuth={(tok, user) => { sendTokenToSW(tok); setToken(tok); setMe(user); }} />;

  const totalUnread = chats.reduce((s, c) => s + (c.unread || 0), 0);
  const filteredChats = searchQuery.trim()
    ? chats.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : chats;

  // Если открыт чат — показываем только его
  if (activeChat) {
    return (
      <div className="h-[100dvh] w-full flex items-stretch justify-center overflow-hidden bg-black">
        <div className="flex w-full max-w-[430px] h-[100dvh] overflow-hidden relative bg-[#0f1923]">
          <DzChatView
            chat={activeChat}
            me={me}
            token={token}
            theme={theme}
            onBack={() => setActiveChat(null)}
            onChatUpdate={() => loadChats(token)}
          />
          <DzChatModalsLayer
            token={token} me={me} chats={chats} theme={theme}
            showNewChat={false} showNewGroup={false} showProfile={false}
            showSetupGuide={false} installPrompt={installPrompt}
            incomingCall={incomingCall}
            onCloseNewChat={() => {}} onCloseNewGroup={() => {}} onCloseProfile={() => {}}
            onCloseSetupGuide={() => {}}
            onChatCreated={() => {}} onGroupCreated={() => {}}
            onMeUpdate={u => setMe(u)} onLogout={logout} onSwitchAccount={logout}
            onThemeChange={() => setTheme(getTheme(localStorage.getItem("dzchat_theme") ?? "dark"))}
            onOpenSetupGuide={() => setShowSetupGuide(true)}
            onInstallApp={installApp}
            onCloseCall={() => setIncomingCall(null)}
          />
        </div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case "status":
        return (
          <DzChatScreenStatus
            me={me} token={token} chats={chats}
            onOpenChat={c => { setActiveChat(c); setActiveTab("chats"); }}
          />
        );
      case "calls":
        return (
          <DzChatScreenCalls
            me={me} chats={chats}
            onStartCall={c => setActiveChat(c)}
            onOpenChat={c => { setActiveChat(c); setActiveTab("chats"); }}
          />
        );
      case "tools":
        return <DzChatScreenTools me={me} token={token} chats={chats} />;
      case "settings":
        return (
          <DzChatScreenSettings
            me={me} token={token}
            onUpdate={u => setMe(u)}
            onLogout={logout}
            onThemeChange={() => setTheme(getTheme(localStorage.getItem("dzchat_theme") ?? "dark"))}
            onOpenSetupGuide={() => setShowSetupGuide(true)}
            notifGranted={notifGranted}
            onRequestNotifications={requestNotifications}
            totalUnread={totalUnread}
          />
        );
      default:
        return (
          <DzChatSidebar
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
          />
        );
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-stretch justify-center overflow-hidden bg-black">
      <div className="flex flex-col w-full max-w-[430px] h-[100dvh] overflow-hidden relative bg-black">

        {/* Контент экрана */}
        <div className="flex-1 overflow-hidden relative">
          {renderScreen()}
        </div>

        {/* Нижний таббар */}
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          totalUnread={totalUnread}
          notifGranted={notifGranted}
        />

        {/* Модалки (новый чат, профиль, группа, звонок) */}
        <DzChatModalsLayer
          token={token} me={me} chats={chats} theme={theme}
          showNewChat={showNewChat} showNewGroup={showNewGroup}
          showProfile={showProfile} showSetupGuide={showSetupGuide}
          installPrompt={installPrompt} incomingCall={incomingCall}
          onCloseNewChat={() => setShowNewChat(false)}
          onCloseNewGroup={() => setShowNewGroup(false)}
          onCloseProfile={() => setShowProfile(false)}
          onCloseSetupGuide={() => setShowSetupGuide(false)}
          onChatCreated={id => { setNewChatId(id); loadChats(token); setActiveTab("chats"); }}
          onGroupCreated={id => { setNewChatId(id); loadChats(token); setActiveTab("chats"); }}
          onMeUpdate={u => setMe(u)}
          onLogout={() => { setShowProfile(false); logout(); }}
          onSwitchAccount={() => { setShowProfile(false); logout(); }}
          onThemeChange={() => setTheme(getTheme(localStorage.getItem("dzchat_theme") ?? "dark"))}
          onOpenSetupGuide={() => { setShowProfile(false); setShowSetupGuide(true); }}
          onInstallApp={installApp}
          onCloseCall={() => setIncomingCall(null)}
        />
      </div>
    </div>
  );
};

export default DzChat;

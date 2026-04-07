/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import DzChatAuth from "@/components/dzchat/DzChatAuth";
import DzChatView from "@/components/dzchat/DzChatView";
import DzChatSidebar from "@/components/dzchat/DzChatSidebar";
import DzChatModalsLayer from "@/components/dzchat/DzChatModalsLayer";
import { useDzChatState } from "@/components/dzchat/useDzChatState";
import { getTheme } from "@/components/dzchat/dzchat.theme";

const DzChat = () => {
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

  const isGlass = theme.isGlass;

  return (
    <div className="h-[100dvh] w-full flex items-stretch justify-center overflow-hidden"
      style={{ background: isGlass ? "linear-gradient(135deg,#0a0a2e,#001a0e)" : "#000" }}>

      <div className="flex w-full max-w-[430px] h-[100dvh] overflow-hidden relative"
        style={{ background: isGlass ? "transparent" : theme.bg }}>

        {isGlass && (
          <div className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(135deg, #0a0a2e 0%, #001a0e 50%, #0a0a2e 100%)" }} />
        )}

        {/* ── SIDEBAR ── */}
        <DzChatSidebar
          me={me}
          chats={chats}
          activeChat={activeChat}
          loadingChats={loadingChats}
          searchQuery={searchQuery}
          notifGranted={notifGranted}
          installPrompt={installPrompt}
          theme={theme}
          incomingCall={incomingCall}
          totalUnread={totalUnread}
          filteredChats={filteredChats}
          onSetActiveChat={setActiveChat}
          onShowProfile={() => setShowProfile(true)}
          onShowNewGroup={() => setShowNewGroup(true)}
          onShowNewChat={() => setShowNewChat(true)}
          onSearchChange={setSearchQuery}
          onRequestNotifications={requestNotifications}
          onInstallApp={installApp}
          onOpenSetupGuide={() => setShowSetupGuide(true)}
        />

        {/* ── CHAT AREA ── */}
        <div className={`${activeChat ? "flex" : "hidden"} flex-1 flex-col relative overflow-hidden ${isGlass ? "dz-glass" : ""}`}
          style={{ background: theme.chatBg }}>
          {activeChat ? (
            <DzChatView
              chat={activeChat}
              me={me}
              token={token}
              theme={theme}
              onBack={() => setActiveChat(null)}
              onChatUpdate={() => loadChats(token)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize: "24px 24px" }}>
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                style={{ background: theme.accent + "18" }}>
                <Icon name="MessageCircle" size={48} style={{ color: theme.accent + "55" } as any} />
              </div>
              <p className="text-xl font-light" style={{ color: theme.textMuted }}>DzChat</p>
              <p className="text-sm mt-2" style={{ color: theme.textMuted + "99" }}>Выберите чат или начните новый</p>
            </div>
          )}
        </div>

        {/* ── MODALS ── */}
        <DzChatModalsLayer
          token={token}
          me={me}
          chats={chats}
          theme={theme}
          showNewChat={showNewChat}
          showNewGroup={showNewGroup}
          showProfile={showProfile}
          showSetupGuide={showSetupGuide}
          installPrompt={installPrompt}
          incomingCall={incomingCall}
          onCloseNewChat={() => setShowNewChat(false)}
          onCloseNewGroup={() => setShowNewGroup(false)}
          onCloseProfile={() => setShowProfile(false)}
          onCloseSetupGuide={() => setShowSetupGuide(false)}
          onChatCreated={id => { setNewChatId(id); loadChats(token); }}
          onGroupCreated={id => { setNewChatId(id); loadChats(token); }}
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
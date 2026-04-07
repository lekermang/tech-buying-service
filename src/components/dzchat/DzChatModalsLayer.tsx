/* eslint-disable @typescript-eslint/no-explicit-any */
import Icon from "@/components/ui/icon";
import { NewChatModal, ProfileModal, CreateGroupModal } from "@/components/dzchat/DzChatModals";
import { DzChatSetupGuide } from "@/components/dzchat/DzChatInstall";
import DzChatCall from "@/components/dzchat/DzChatCall";

interface DzChatModalsLayerProps {
  token: string;
  me: any;
  chats: any[];
  theme: any;
  showNewChat: boolean;
  showNewGroup: boolean;
  showProfile: boolean;
  showSetupGuide: boolean;
  installPrompt: any;
  incomingCall: any;
  onCloseNewChat: () => void;
  onCloseNewGroup: () => void;
  onCloseProfile: () => void;
  onCloseSetupGuide: () => void;
  onChatCreated: (id: number) => void;
  onGroupCreated: (id: number) => void;
  onMeUpdate: (u: any) => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
  onThemeChange: () => void;
  onOpenSetupGuide: () => void;
  onInstallApp: () => void;
  onCloseCall: () => void;
}

const DzChatModalsLayer = ({
  token, me, chats, theme,
  showNewChat, showNewGroup, showProfile, showSetupGuide,
  installPrompt, incomingCall,
  onCloseNewChat, onCloseNewGroup, onCloseProfile, onCloseSetupGuide,
  onChatCreated, onGroupCreated, onMeUpdate, onLogout, onSwitchAccount,
  onThemeChange, onOpenSetupGuide, onInstallApp, onCloseCall,
}: DzChatModalsLayerProps) => {
  return (
    <>
      {showNewChat && (
        <NewChatModal
          token={token}
          chats={chats}
          onClose={onCloseNewChat}
          onChatCreated={onChatCreated}
        />
      )}
      {showNewGroup && (
        <CreateGroupModal
          token={token}
          onClose={onCloseNewGroup}
          onCreated={onGroupCreated}
        />
      )}
      {showProfile && (
        <ProfileModal
          me={me}
          token={token}
          onClose={onCloseProfile}
          onUpdate={onMeUpdate}
          onLogout={onLogout}
          onSwitchAccount={onSwitchAccount}
          onThemeChange={onThemeChange}
          onOpenSetupGuide={onOpenSetupGuide}
        />
      )}

      {/* Экран установки и уведомлений */}
      {showSetupGuide && (
        <div className="absolute inset-0 z-[70] flex flex-col" style={{ background: theme.bg }}>
          <div className="flex items-center gap-2 px-3 py-3 border-b"
            style={{ background: theme.sidebarHeader, borderColor: theme.border }}>
            <button onClick={onCloseSetupGuide}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              style={{ color: theme.textMuted }}>
              <Icon name="ArrowLeft" size={20} />
            </button>
            <p className="text-white font-semibold text-sm flex-1">Установка и уведомления</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <DzChatSetupGuide installPrompt={installPrompt} onInstall={onInstallApp} />
          </div>
        </div>
      )}

      {/* Входящий звонок */}
      {incomingCall && (
        <DzChatCall
          me={me}
          token={token}
          incomingCall={incomingCall}
          onClose={onCloseCall}
        />
      )}
    </>
  );
};

export default DzChatModalsLayer;
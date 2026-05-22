import { RefObject } from "react";
import Icon from "@/components/ui/icon";
import { Me } from "./vipChatTypes";

type Props = {
  me: Me;
  myAvatar: string | null;
  avatarInputRef: RefObject<HTMLInputElement>;
  setShowAvatarModal: (v: boolean) => void;
  uploadMyAvatar: (file: File) => void;
  onRemoveAvatar: () => void;
};

export default function VipChatAvatarModal({
  me,
  myAvatar,
  avatarInputRef,
  setShowAvatarModal,
  uploadMyAvatar,
  onRemoveAvatar,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowAvatarModal(false)}
    >
      <div
        className="bg-[#0E0E0E] border border-[#FFD700]/30 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Icon name="UserCircle" size={20} className="text-[#FFD700]" />
          <h3 className="font-oswald font-bold text-white uppercase tracking-wider">
            Моя аватарка
          </h3>
          <button
            onClick={() => setShowAvatarModal(false)}
            className="ml-auto p-1 rounded hover:bg-white/10"
          >
            <Icon name="X" size={18} className="text-white/60" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full bg-[#FFD700]/15 border-2 border-[#FFD700]/40 flex items-center justify-center text-3xl text-[#FFD700] font-bold overflow-hidden">
            {myAvatar ? (
              <img src={myAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              me.full_name.slice(0, 1).toUpperCase()
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#FFE34D] to-[#d4a017] text-black text-[12px] font-bold uppercase tracking-wider"
          >
            <Icon name="Upload" size={14} className="inline mr-1.5" />
            Загрузить фото
          </button>
          {myAvatar && (
            <button
              onClick={onRemoveAvatar}
              className="text-[11px] text-white/40 hover:text-red-400 underline"
            >
              Удалить аватарку
            </button>
          )}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadMyAvatar(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

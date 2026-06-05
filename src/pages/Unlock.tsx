import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { getToken, clearToken, authCall } from "./unlock/unlockConstants";
import { AuthScreen } from "./unlock/UnlockAuth";
import { Cabinet } from "./unlock/UnlockCabinet";

export default function Unlock() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setAuthed(false); return; }
    authCall({ action: "me" }).then(d => {
      if (d?.id) setAuthed(true);
      else { clearToken(); setAuthed(false); }
    }).catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060406" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#FFD700,#b8860b)" }}>
            <Icon name="Unlock" size={22} className="text-black" />
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: "#FFD700", animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;
  return <Cabinet onLogout={() => setAuthed(false)} />;
}

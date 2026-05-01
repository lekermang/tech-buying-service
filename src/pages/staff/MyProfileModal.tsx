import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";
import { EMPLOYEE_AUTH_URL } from "../staff.types";

type Props = {
  token: string;
  onClose: () => void;
  onUpdated?: (data: { full_name?: string; avatar_url?: string }) => void;
};

type MyProfile = {
  id: number;
  full_name: string;
  login: string;
  role: string;
  avatar_url?: string | null;
  email?: string | null;
  phone?: string | null;
};

async function api<T = unknown>(token: string, body: Record<string, unknown>): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const r = await fetch(EMPLOYEE_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Employee-Token": token },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) return { ok: false, error: j.error || `HTTP ${r.status}` };
    return { ok: true, data: j as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Сеть" };
  }
}

export default function MyProfileModal({ token, onClose, onUpdated }: Props) {
  const [me, setMe] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"info" | "password" | "pin">("info");

  // Поля
  const [fullName, setFullName] = useState("");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const [curPin, setCurPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPin2, setNewPin2] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(EMPLOYEE_AUTH_URL, { headers: { "X-Employee-Token": token } });
        const j = await r.json();
        if (r.ok) {
          setMe(j as MyProfile);
          setFullName(j.full_name || "");
          setLogin(j.login || "");
          setEmail(j.email || "");
          setPhone(j.phone || "");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const onAvatar = async (file: File) => {
    setBusy(true); setMsg(null);
    try {
      const compressed = await compress(file, 600, 0.85);
      const r = await api<{ avatar_url: string }>(token, { action: "me_upload_avatar", image_base64: compressed });
      if (r.ok && r.data) {
        setMe(p => p ? { ...p, avatar_url: r.data!.avatar_url } : p);
        setMsg({ ok: true, text: "Фото обновлено" });
        onUpdated?.({ avatar_url: r.data.avatar_url });
      } else {
        setMsg({ ok: false, text: r.error || "Ошибка" });
      }
    } finally {
      setBusy(false);
    }
  };

  const removeAvatar = async () => {
    setBusy(true); setMsg(null);
    const r = await api(token, { action: "me_update", avatar_url: "" });
    setBusy(false);
    if (r.ok) {
      setMe(p => p ? { ...p, avatar_url: null } : p);
      setMsg({ ok: true, text: "Фото удалено" });
      onUpdated?.({ avatar_url: "" });
    } else setMsg({ ok: false, text: r.error || "Ошибка" });
  };

  const saveInfo = async () => {
    setBusy(true); setMsg(null);
    const r = await api(token, {
      action: "me_update",
      full_name: fullName.trim(),
      login: login.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: "Сохранено" });
      onUpdated?.({ full_name: fullName.trim() });
      try { localStorage.setItem("employee_name", fullName.trim()); } catch { /* ignore */ }
    } else setMsg({ ok: false, text: r.error || "Ошибка" });
  };

  const changePassword = async () => {
    if (!curPw || !newPw) { setMsg({ ok: false, text: "Заполните все поля" }); return; }
    if (newPw !== newPw2) { setMsg({ ok: false, text: "Новые пароли не совпадают" }); return; }
    if (newPw.length < 4) { setMsg({ ok: false, text: "Минимум 4 символа" }); return; }
    setBusy(true); setMsg(null);
    const r = await api(token, { action: "me_update", current_password: curPw, new_password: newPw });
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: "Пароль изменён" });
      setCurPw(""); setNewPw(""); setNewPw2("");
    } else setMsg({ ok: false, text: r.error || "Ошибка" });
  };

  const changePin = async () => {
    if (!newPin) { setMsg({ ok: false, text: "Введите новый PIN" }); return; }
    if (!/^\d{4,8}$/.test(newPin)) { setMsg({ ok: false, text: "PIN — 4–8 цифр" }); return; }
    if (newPin !== newPin2) { setMsg({ ok: false, text: "PIN не совпадают" }); return; }
    setBusy(true); setMsg(null);
    const r = await api(token, { action: "me_change_pin", current_pin: curPin, new_pin: newPin });
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: "PIN изменён" });
      setCurPin(""); setNewPin(""); setNewPin2("");
    } else setMsg({ ok: false, text: r.error || "Ошибка" });
  };

  const initials = (me?.full_name || "?").trim().split(/\s+/).map(s => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-end sm:items-center justify-center p-2" onClick={onClose}>
      <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-3 flex items-center justify-between z-10">
          <div className="font-bold flex items-center gap-2">
            <Icon name="UserCog" size={16} className="text-[#FFD700]" />
            Мой профиль
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1"><Icon name="X" size={18} /></button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-white/30 text-sm">
            <Icon name="Loader" size={16} className="animate-spin inline mr-1" />Загрузка...
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Аватар */}
            <div className="flex items-center gap-3 bg-[#0F0F0F] border border-[#1F1F1F] rounded-xl p-3">
              <div className="relative shrink-0">
                {me?.avatar_url ? (
                  <img src={me.avatar_url} alt="ava" className="w-16 h-16 rounded-full object-cover border-2 border-[#FFD700]/30" />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg ${
                    me?.role === "owner" ? "bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black" :
                    me?.role === "admin" ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white" :
                    "bg-gradient-to-br from-[#333] to-[#1a1a1a] text-white/70 border border-white/10"
                  }`}>{initials}</div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <button onClick={() => fileRef.current?.click()} disabled={busy}
                  className="w-full bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] text-[12px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 disabled:opacity-50">
                  <Icon name="Camera" size={12} />{me?.avatar_url ? "Сменить фото" : "Загрузить фото"}
                </button>
                {me?.avatar_url && (
                  <button onClick={removeAvatar} disabled={busy}
                    className="w-full bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] py-1.5 rounded-lg disabled:opacity-50">
                    Удалить фото
                  </button>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={e => { const f = e.target.files?.[0]; if (f) onAvatar(f); e.target.value = ""; }} />
            </div>

            {/* Вкладки */}
            <div className="flex gap-1 bg-[#0F0F0F] border border-[#1F1F1F] rounded-lg p-1">
              {([
                { k: "info", l: "Профиль", icon: "User" },
                { k: "password", l: "Пароль", icon: "Key" },
                { k: "pin", l: "PIN", icon: "Lock" },
              ] as const).map(t => (
                <button key={t.k} onClick={() => { setTab(t.k); setMsg(null); }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded text-[11px] font-bold transition-colors ${
                    tab === t.k ? "bg-[#FFD700] text-black" : "text-white/60 hover:bg-white/5"
                  }`}>
                  <Icon name={t.icon} size={11} />{t.l}
                </button>
              ))}
            </div>

            {tab === "info" && (
              <div className="space-y-2">
                <Field l="ФИО"><input value={fullName} onChange={e => setFullName(e.target.value)} className={inp} /></Field>
                <Field l="Логин (для входа)"><input value={login} onChange={e => setLogin(e.target.value)} className={inp} /></Field>
                <Field l="Email"><input value={email} onChange={e => setEmail(e.target.value)} type="email" className={inp} /></Field>
                <Field l="Телефон"><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" className={inp} /></Field>
                <button onClick={saveInfo} disabled={busy} className={btnPrimary}>
                  <Icon name={busy ? "Loader" : "Check"} size={14} className={busy ? "animate-spin" : ""} />
                  Сохранить
                </button>
              </div>
            )}

            {tab === "password" && (
              <div className="space-y-2">
                <Field l="Текущий пароль"><input value={curPw} onChange={e => setCurPw(e.target.value)} type="password" className={inp} /></Field>
                <Field l="Новый пароль"><input value={newPw} onChange={e => setNewPw(e.target.value)} type="password" className={inp} /></Field>
                <Field l="Повторите новый"><input value={newPw2} onChange={e => setNewPw2(e.target.value)} type="password" className={inp} /></Field>
                <button onClick={changePassword} disabled={busy} className={btnPrimary}>
                  <Icon name={busy ? "Loader" : "Key"} size={14} className={busy ? "animate-spin" : ""} />
                  Изменить пароль
                </button>
              </div>
            )}

            {tab === "pin" && (
              <div className="space-y-2">
                {me?.role === "owner" && (
                  <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] p-2 rounded text-[11px]">
                    PIN владельца зафиксирован системой и не может быть изменён.
                  </div>
                )}
                <Field l="Текущий PIN (если уже задан)">
                  <input value={curPin} onChange={e => setCurPin(e.target.value.replace(/\D/g, ""))} type="password" inputMode="numeric" maxLength={8} className={inp} />
                </Field>
                <Field l="Новый PIN (4–8 цифр)">
                  <input value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))} type="password" inputMode="numeric" maxLength={8} className={inp} />
                </Field>
                <Field l="Повторите новый PIN">
                  <input value={newPin2} onChange={e => setNewPin2(e.target.value.replace(/\D/g, ""))} type="password" inputMode="numeric" maxLength={8} className={inp} />
                </Field>
                <button onClick={changePin} disabled={busy || me?.role === "owner"} className={btnPrimary}>
                  <Icon name={busy ? "Loader" : "Lock"} size={14} className={busy ? "animate-spin" : ""} />
                  Изменить PIN
                </button>
              </div>
            )}

            {msg && (
              <div className={`p-2 rounded text-sm ${msg.ok ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300"}`}>
                {msg.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inp = "w-full bg-[#141414] border border-[#1F1F1F] rounded-lg px-3 py-2 text-sm focus:border-[#FFD700]/40 outline-none";
const btnPrimary = "w-full bg-gradient-to-br from-[#FFD700] to-yellow-600 text-black font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition";

function Field({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/40 mb-1">{l}</div>
      {children}
    </div>
  );
}

async function compress(file: File, maxSize: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        c.width = w; c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return reject(new Error("Canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Image"));
      img.src = ev.target?.result as string;
    };
    r.onerror = () => reject(new Error("Read"));
    r.readAsDataURL(file);
  });
}

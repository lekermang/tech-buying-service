import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import PhotoLightbox from "./PhotoLightbox";
import { LEADS_URL, type LeadPhoto } from "./types";

interface Props {
  leadId: number;
  initialPhotos?: LeadPhoto[];
  token: string;
}

const fmtRemaining = (expiresAt?: string): string => {
  if (!expiresAt) return "";
  const t = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = t - now;
  if (diff <= 0) return "истекло";
  const h = Math.floor(diff / 3_600_000);
  if (h >= 1) return `осталось ${h}ч`;
  const m = Math.floor(diff / 60_000);
  return `осталось ${m}м`;
};

export default function LeadPhotoStrip({ leadId, initialPhotos, token }: Props) {
  const [photos, setPhotos] = useState<LeadPhoto[]>(initialPhotos || []);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(!!initialPhotos);
  const [lightboxIdx, setLightboxIdx] = useState<number>(-1);

  useEffect(() => {
    if (tried) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${LEADS_URL}?action=lead_photos&lead_id=${leadId}`, {
          headers: { "X-Admin-Token": token, "X-Employee-Token": token },
        });
        if (!r.ok) {
          if (!cancelled) { setTried(true); setLoading(false); }
          return;
        }
        const d = await r.json();
        if (cancelled) return;
        if (d && Array.isArray(d.photos)) setPhotos(d.photos as LeadPhoto[]);
        setTried(true);
      } catch {
        if (!cancelled) setTried(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [leadId, tried, token]);

  if (!tried && loading) {
    return (
      <div className="mt-2 flex items-center gap-1 text-white/40 text-[10px]">
        <Icon name="Loader" size={11} className="animate-spin" /> загрузка фото...
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 scrollbar-thin">
        {photos.map((ph, i) => (
          <button
            key={ph.id}
            type="button"
            onClick={() => setLightboxIdx(i)}
            className="relative shrink-0 group"
            title="Открыть фото"
          >
            <img
              src={ph.cdn_url}
              alt={`фото ${i + 1}`}
              loading="lazy"
              className="w-[60px] h-[60px] object-cover rounded border border-white/10 group-hover:border-[#FFD700]/60 transition-colors"
            />
            {ph.expires_at && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded bg-black/85 text-white/80 text-[8px] font-roboto whitespace-nowrap leading-none border border-white/10">
                {fmtRemaining(ph.expires_at)}
              </span>
            )}
          </button>
        ))}
      </div>

      {lightboxIdx >= 0 && (
        <PhotoLightbox
          photos={photos.map(p => p.cdn_url)}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(-1)}
          onIndexChange={setLightboxIdx}
        />
      )}
    </>
  );
}

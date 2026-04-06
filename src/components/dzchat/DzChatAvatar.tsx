import { useState, useEffect } from "react";

const COLORS = ["#e53e3e","#dd6b20","#d69e2e","#38a169","#3182ce","#805ad5","#d53f8c"];

// Чистим ?t= и лишние параметры которые ломают CDN
function cleanUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // Если это data: URL — возвращаем как есть
  if (url.startsWith("data:")) return url;
  try {
    const u = new URL(url);
    u.searchParams.delete("t");
    return u.toString();
  } catch {
    return url;
  }
}

const DzChatAvatar = ({ name, url, size = 40 }: { name: string; url?: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  const initials = (name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    setImgError(false);
    setImgKey(k => k + 1);
  }, [url]);

  const src = cleanUrl(url);

  if (src && !imgError) {
    return (
      <div
        className="rounded-full shrink-0 overflow-hidden bg-[#1a2634] flex items-center justify-center"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <img
          key={imgKey}
          src={src}
          alt={name || "?"}
          onError={() => setImgError(true)}
          decoding="async"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 text-white font-bold select-none"
      style={{ width: size, height: size, minWidth: size, minHeight: size, background: color, fontSize: Math.round(size * 0.38) }}>
      {initials}
    </div>
  );
};

export default DzChatAvatar;

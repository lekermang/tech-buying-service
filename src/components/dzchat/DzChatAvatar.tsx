const COLORS = ["#e53e3e","#dd6b20","#d69e2e","#38a169","#3182ce","#805ad5","#d53f8c"];

const DzChatAvatar = ({ name, url, size = 40 }: { name: string; url?: string; size?: number }) => {
  const color = COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];
  const initials = (name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  return url
    ? (
      <div className="rounded-full shrink-0 overflow-hidden bg-[#1a2634]"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}>
        <img
          src={url} alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
          loading="lazy"
        />
      </div>
    )
    : (
      <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold select-none"
        style={{ width: size, height: size, minWidth: size, minHeight: size, background: color, fontSize: Math.round(size * 0.38) }}>
        {initials}
      </div>
    );
};

export default DzChatAvatar;

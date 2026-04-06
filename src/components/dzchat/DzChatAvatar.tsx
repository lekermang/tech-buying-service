 
const COLORS = ["#e53e3e","#dd6b20","#d69e2e","#38a169","#3182ce","#805ad5","#d53f8c"];

const DzChatAvatar = ({ name, url, size = 40 }: { name: string; url?: string; size?: number }) => {
  const color = COLORS[name.charCodeAt(0) % COLORS.length];
  const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  return url
    ? <img src={url} alt={name} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} loading="lazy" />
    : <div className="rounded-full flex items-center justify-center shrink-0 text-white font-bold"
        style={{ width: size, height: size, background: color, fontSize: size * 0.35 }}>{initials}</div>;
};

export default DzChatAvatar;

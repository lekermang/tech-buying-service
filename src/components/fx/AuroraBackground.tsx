/**
 * Aurora — переливающееся северное сияние в фоне.
 * Три больших blob с blur, плавно движутся по разным траекториям.
 * Современный эффект 2024-2026, используется в Vercel, Linear, etc.
 */
export default function AuroraBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <style>{`
        @keyframes aurora-1 {
          0%,100% { transform: translate(-10%,-15%) scale(1.1) rotate(0deg); }
          33%      { transform: translate(8%,5%)   scale(0.95) rotate(15deg); }
          66%      { transform: translate(-5%,10%) scale(1.05) rotate(-8deg); }
        }
        @keyframes aurora-2 {
          0%,100% { transform: translate(10%,10%)  scale(1.0) rotate(0deg); }
          33%      { transform: translate(-8%,-5%) scale(1.1) rotate(-12deg); }
          66%      { transform: translate(5%,-10%) scale(0.9) rotate(10deg); }
        }
        @keyframes aurora-3 {
          0%,100% { transform: translate(0%,-5%)   scale(1.05) rotate(0deg); }
          50%      { transform: translate(5%,8%)   scale(0.95) rotate(20deg); }
        }
        @keyframes aurora-pulse {
          0%,100% { opacity: 0.55; }
          50%      { opacity: 0.85; }
        }
      `}</style>

      {/* Blob 1 — золотой, верх-лево */}
      <div className="absolute -top-[30%] -left-[20%] w-[80vw] h-[70vw] max-w-[900px] max-h-[700px] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(ellipse,rgba(255,215,0,0.18) 0%,rgba(255,160,0,0.08) 50%,transparent 80%)",
          animation: "aurora-1 22s ease-in-out infinite, aurora-pulse 8s ease-in-out infinite",
          willChange: "transform",
        }} />

      {/* Blob 2 — янтарный, право-низ */}
      <div className="absolute -bottom-[20%] -right-[15%] w-[70vw] h-[60vw] max-w-[800px] max-h-[600px] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(ellipse,rgba(255,100,0,0.1) 0%,rgba(255,200,0,0.07) 50%,transparent 80%)",
          animation: "aurora-2 28s ease-in-out infinite 3s, aurora-pulse 10s ease-in-out infinite 2s",
          willChange: "transform",
        }} />

      {/* Blob 3 — голубой акцент, центр */}
      <div className="absolute top-[20%] left-[30%] w-[60vw] h-[50vw] max-w-[700px] max-h-[500px] rounded-full blur-[140px]"
        style={{
          background: "radial-gradient(ellipse,rgba(34,158,217,0.07) 0%,transparent 70%)",
          animation: "aurora-3 18s ease-in-out infinite 1s",
          willChange: "transform",
        }} />
    </div>
  );
}

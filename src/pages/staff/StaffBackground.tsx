type Props = { roleColor: string };

export default function StaffBackground({ roleColor }: Props) {
  return (
    <>
      {/* Hex-сетка */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32L28 66zm0-2.31L54 49.2V19.8L28 5.11 2 19.8v29.4L28 63.69z' fill='%23FFD700' /%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
        }}
      />
      {/* Скан-линии */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
          backgroundSize: "100% 4px",
        }}
      />
      {/* Угловые свечения */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none z-0 rounded-full blur-[120px]"
        style={{ background: `radial-gradient(circle, ${roleColor}18 0%, transparent 70%)`, transform: "translate(-30%, -30%)" }} />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] pointer-events-none z-0 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", transform: "translate(30%, 30%)" }} />
      <div className="fixed top-1/2 left-1/2 w-[600px] h-[600px] pointer-events-none z-0 rounded-full blur-[160px] -translate-x-1/2 -translate-y-1/2"
        style={{ background: "radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 60%)" }} />
    </>
  );
}

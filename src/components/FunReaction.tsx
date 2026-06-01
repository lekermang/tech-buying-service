import { useEffect, useState, useCallback } from "react";

// ─── Типы событий ─────────────────────────────────────────────────────────────
export type ReactionEvent =
  | "repair_accepted"   // ремонт принят
  | "repair_ready"      // ремонт готов
  | "repair_issued"     // ремонт выдан клиенту
  | "item_bought"       // товар куплен (скупка)
  | "item_sold"         // товар продан
  | "goal_reached";     // цель накопления достигнута

// ─── Реакции для каждого события (по 10-15 вариантов) ────────────────────────
const REACTIONS: Record<ReactionEvent, Array<{ emoji: string[]; text: string; color: string }>> = {
  repair_accepted: [
    { emoji: ["🔧","✨"], text: "Принято в работу!", color: "#34d399" },
    { emoji: ["💪","🔥"], text: "Берём в работу!", color: "#fb923c" },
    { emoji: ["⚡","🛠️"], text: "Уже чиним!", color: "#60a5fa" },
    { emoji: ["🤝","👌"], text: "Клиент доверяет — не подведём!", color: "#a78bfa" },
    { emoji: ["🚀","🔧"], text: "Ремонт запущен!", color: "#34d399" },
    { emoji: ["🎯","🛠️"], text: "Задача принята!", color: "#FFD700" },
    { emoji: ["💥","⚙️"], text: "Поехали!", color: "#f472b6" },
    { emoji: ["🏆","🔧"], text: "Мастер принял вызов!", color: "#FFD700" },
    { emoji: ["😤","💪"], text: "Разберёмся!", color: "#34d399" },
    { emoji: ["🎪","🛠️"], text: "Шоу начинается!", color: "#a78bfa" },
  ],
  repair_ready: [
    { emoji: ["✅","🎉"], text: "Готово! Зови клиента!", color: "#34d399" },
    { emoji: ["🔔","📱"], text: "Клиент уже едет!", color: "#60a5fa" },
    { emoji: ["🏅","✨"], text: "Готово раньше срока!", color: "#FFD700" },
    { emoji: ["💎","🔧"], text: "Качество — огонь!", color: "#a78bfa" },
    { emoji: ["🎊","✅"], text: "Мастер сделал!", color: "#34d399" },
    { emoji: ["📞","📱"], text: "Звоним клиенту!", color: "#60a5fa" },
    { emoji: ["🥳","🎯"], text: "Ещё один в копилку!", color: "#fb923c" },
    { emoji: ["⚡","✅"], text: "Молния! Уже готово!", color: "#FFD700" },
    { emoji: ["🙌","📱"], text: "Телефон воскрес!", color: "#34d399" },
    { emoji: ["🔥","🏆"], text: "Горим! Следующий!", color: "#f472b6" },
  ],
  repair_issued: [
    { emoji: ["💸","🤩"], text: "Деньги в кассе!", color: "#FFD700" },
    { emoji: ["🎉","💰"], text: "Клиент доволен!", color: "#34d399" },
    { emoji: ["🤑","🔥"], text: "Ещё один выполнен!", color: "#fb923c" },
    { emoji: ["🏆","💵"], text: "Заработано!", color: "#FFD700" },
    { emoji: ["🎊","😄"], text: "Клиент улыбается — мы тоже!", color: "#34d399" },
    { emoji: ["✨","💸"], text: "В кассу! Так держать!", color: "#FFD700" },
    { emoji: ["🚀","💰"], text: "Ещё один успех!", color: "#60a5fa" },
    { emoji: ["🥊","💵"], text: "Нокаут! Деньги наши!", color: "#fb923c" },
    { emoji: ["😎","💸"], text: "Профи работают!", color: "#a78bfa" },
    { emoji: ["🎯","💰"], text: "В яблочко!", color: "#FFD700" },
    { emoji: ["🦁","💪"], text: "Лев сделал дело!", color: "#f472b6" },
    { emoji: ["⚡","💵"], text: "Быстро и чётко!", color: "#FFD700" },
  ],
  item_bought: [
    { emoji: ["🛍️","🔥"], text: "Скупка прошла!", color: "#34d399" },
    { emoji: ["💎","🤝"], text: "Товар наш!", color: "#a78bfa" },
    { emoji: ["📦","✨"], text: "Пополнение склада!", color: "#60a5fa" },
    { emoji: ["🏪","💪"], text: "Магазин пополнился!", color: "#34d399" },
    { emoji: ["💰","📱"], text: "Выгодная скупка!", color: "#FFD700" },
    { emoji: ["🎯","📦"], text: "Хорошая покупка!", color: "#fb923c" },
    { emoji: ["🤑","📱"], text: ["iPhone", "Samsung", "💎"].includes("📱") ? "Скупили!" : "Взяли!", color: "#34d399" },
    { emoji: ["🛒","✅"], text: "В корзину — на продажу!", color: "#60a5fa" },
    { emoji: ["🦅","💸"], text: "Орёл взял добычу!", color: "#FFD700" },
    { emoji: ["🎪","📦"], text: "Ещё один лот!", color: "#a78bfa" },
    { emoji: ["🔮","💎"], text: "Чуйка не подвела!", color: "#f472b6" },
    { emoji: ["💡","📱"], text: "Будет что продать!", color: "#34d399" },
  ],
  item_sold: [
    { emoji: ["💸","🎉"], text: "Продано! Деньги в кассе!", color: "#FFD700" },
    { emoji: ["🏆","💰"], text: "Выручка растёт!", color: "#34d399" },
    { emoji: ["🤑","🔥"], text: "Деньги пришли!", color: "#fb923c" },
    { emoji: ["🎯","💵"], text: "Продал как профи!", color: "#FFD700" },
    { emoji: ["🚀","💰"], text: "Товар улетел!", color: "#60a5fa" },
    { emoji: ["😎","💸"], text: "Сделка закрыта!", color: "#a78bfa" },
    { emoji: ["🎊","📈"], text: "Плюс в прибыль!", color: "#34d399" },
    { emoji: ["⚡","💵"], text: "Молниеносная продажа!", color: "#FFD700" },
    { emoji: ["🦈","💰"], text: "Акула продаж!", color: "#f472b6" },
    { emoji: ["🔥","💸"], text: "Горим! Следующий!", color: "#fb923c" },
    { emoji: ["🎸","💰"], text: "Ритм продаж!", color: "#a78bfa" },
    { emoji: ["🌟","💵"], text: "Звёздная сделка!", color: "#FFD700" },
    { emoji: ["🥇","💸"], text: "Первое место по продажам!", color: "#FFD700" },
    { emoji: ["🏄","💰"], text: "Едем на волне!", color: "#60a5fa" },
  ],
  goal_reached: [
    { emoji: ["🏆","🎉","✨"], text: "ЦЕЛЬ ДОСТИГНУТА!", color: "#FFD700" },
    { emoji: ["🎊","💎","🌟"], text: "Ты сделал это!", color: "#a78bfa" },
    { emoji: ["🥳","🎉","💸"], text: "Накопил! Молодец!", color: "#34d399" },
    { emoji: ["🔥","🏆","💰"], text: "Цель взята!", color: "#FFD700" },
    { emoji: ["🚀","⭐","🎯"], text: "К следующей цели!", color: "#60a5fa" },
  ],
};

// ─── Конфетти-частица ─────────────────────────────────────────────────────────
type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotSpeed: number;
  shape: "rect" | "circle" | "star";
};

const CONFETTI_COLORS = [
  "#FFD700","#FF6B6B","#4ECDC4","#45B7D1","#96CEB4",
  "#FFEAA7","#DDA0DD","#98D8C8","#F7DC6F","#BB8FCE",
  "#52BE80","#F1948A","#5DADE2","#F0B27A","#A9DFBF",
];

// ─── Emoji-частица ─────────────────────────────────────────────────────────────
type EmojiParticle = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vy: number;
  vx: number;
  scale: number;
  opacity: number;
  rotation: number;
};

// ─── Хук для глобальной шины событий ─────────────────────────────────────────
type ReactionPayload = { event: ReactionEvent; amount?: number };

const listeners: Array<(p: ReactionPayload) => void> = [];

export function triggerReaction(event: ReactionEvent, amount?: number) {
  listeners.forEach(fn => fn({ event, amount }));
}

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function FunReaction() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [emojiParticles, setEmojiParticles] = useState<EmojiParticle[]>([]);
  const [reaction, setReaction] = useState<{
    text: string; emoji: string[]; color: string; amount?: number;
  } | null>(null);
  const [visible, setVisible] = useState(false);

  const fire = useCallback(({ event, amount }: ReactionPayload) => {
    const options = REACTIONS[event];
    const pick = options[Math.floor(Math.random() * options.length)];

    // Конфетти
    const newParticles: Particle[] = Array.from({ length: 80 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: -5,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      shape: ["rect", "circle", "star"][Math.floor(Math.random() * 3)] as Particle["shape"],
    }));

    // Emoji-фейерверк
    const newEmoji: EmojiParticle[] = pick.emoji.flatMap((e, ei) =>
      Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + 1000 + ei * 10 + i,
        emoji: e,
        x: 30 + Math.random() * 40,
        y: 40 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -(Math.random() * 3 + 1),
        scale: 1 + Math.random() * 1.5,
        opacity: 1,
        rotation: (Math.random() - 0.5) * 30,
      }))
    );

    setParticles(newParticles);
    setEmojiParticles(newEmoji);
    setReaction({ text: pick.text, emoji: pick.emoji, color: pick.color, amount });
    setVisible(true);

    setTimeout(() => setVisible(false), 3200);
    setTimeout(() => { setParticles([]); setEmojiParticles([]); setReaction(null); }, 3800);
  }, []);

  useEffect(() => {
    listeners.push(fire);
    return () => {
      const idx = listeners.indexOf(fire);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [fire]);

  if (!reaction && particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ overflow: "hidden" }}
    >
      {/* Конфетти */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 1.6,
            background: p.shape === "star" ? "none" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${1.5 + Math.random() * 1.5}s ease-in forwards`,
            animationDelay: `${Math.random() * 0.4}s`,
            fontSize: p.shape === "star" ? p.size + 2 : undefined,
          }}
        >
          {p.shape === "star" && (
            <span style={{ color: p.color }}>★</span>
          )}
        </div>
      ))}

      {/* Emoji-частицы */}
      {emojiParticles.map(ep => (
        <div
          key={ep.id}
          className="absolute text-2xl"
          style={{
            left: `${ep.x}%`,
            top: `${ep.y}%`,
            transform: `scale(${ep.scale}) rotate(${ep.rotation}deg)`,
            animation: `emojiPop ${1.2 + Math.random() * 0.8}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        >
          {ep.emoji}
        </div>
      ))}

      {/* Центральная карточка */}
      {reaction && (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -60%)",
            animation: visible
              ? "reactionPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards"
              : "reactionFade 0.5s ease-in forwards",
          }}
        >
          <div
            className="rounded-3xl px-8 py-6 text-center shadow-2xl"
            style={{
              background: "linear-gradient(145deg,rgba(0,0,0,0.92),rgba(20,20,20,0.95))",
              border: `2px solid ${reaction.color}60`,
              boxShadow: `0 0 60px ${reaction.color}40, 0 20px 60px rgba(0,0,0,0.5)`,
              minWidth: "260px",
            }}
          >
            {/* Большой emoji */}
            <div className="text-5xl mb-2 flex items-center justify-center gap-2">
              {reaction.emoji.map((e, i) => (
                <span
                  key={i}
                  style={{
                    animation: `emojiBounce 0.6s ease-out ${i * 0.1}s both`,
                    display: "inline-block",
                  }}
                >
                  {e}
                </span>
              ))}
            </div>

            {/* Текст */}
            <div
              className="font-oswald font-black text-xl uppercase tracking-wide leading-tight"
              style={{ color: reaction.color, textShadow: `0 0 20px ${reaction.color}80` }}
            >
              {reaction.text}
            </div>

            {/* Сумма если есть */}
            {reaction.amount && reaction.amount > 0 && (
              <div
                className="font-oswald font-black text-3xl tabular-nums mt-1"
                style={{ color: "#FFD700", textShadow: "0 0 20px rgba(255,215,0,0.6)" }}
              >
                +{Math.round(reaction.amount).toLocaleString("ru-RU")} ₽
              </div>
            )}

            {/* Полоска снизу */}
            <div
              className="h-1 rounded-full mt-3 mx-auto"
              style={{
                background: `linear-gradient(90deg,transparent,${reaction.color},transparent)`,
                width: "80%",
                animation: "shrinkBar 3s linear forwards",
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes emojiPop {
          0%   { transform: scale(0) translateY(0); opacity: 1; }
          40%  { opacity: 1; }
          100% { transform: scale(1.5) translateY(-120px); opacity: 0; }
        }
        @keyframes reactionPop {
          0%   { transform: translate(-50%,-60%) scale(0.3); opacity: 0; }
          60%  { transform: translate(-50%,-60%) scale(1.08); opacity: 1; }
          100% { transform: translate(-50%,-60%) scale(1); opacity: 1; }
        }
        @keyframes reactionFade {
          0%   { transform: translate(-50%,-60%) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-60%) scale(0.8) translateY(-30px); opacity: 0; }
        }
        @keyframes emojiBounce {
          0%   { transform: scale(0) rotate(-20deg); }
          60%  { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes shrinkBar {
          0%   { width: 80%; }
          100% { width: 0%; }
        }
      `}</style>
    </div>
  );
}

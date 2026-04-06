import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  src: string;        // data URL исходного фото
  onSave: (b64: string, preview: string) => void;
  onClose: () => void;
}

const DzChatAvatarEditor = ({ src, onSave, onClose }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [loaded, setLoaded] = useState(false);

  const SIZE = 300; // размер холста редактора
  const OUTPUT = 256; // итоговый размер

  // Загружаем изображение
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Авто-масштаб чтобы заполнить круг
      const minSide = Math.min(img.width, img.height);
      setScale(SIZE / minSide);
      setOffset({ x: 0, y: 0 });
      setLoaded(true);
    };
    img.src = src;
  }, [src]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, SIZE, SIZE);

    // Фон
    ctx.fillStyle = "#1a2634";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Затемнение вне круга
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, SIZE, SIZE);
    // Вырезаем круг — чистим затемнение
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Рисуем фото под оверлеем
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const x = SIZE / 2 - drawW / 2 + offset.x;
    const y = SIZE / 2 - drawH / 2 + offset.y;
    ctx.drawImage(img, x, y, drawW, drawH);
    ctx.restore();

    // Обводка круга
    ctx.save();
    ctx.strokeStyle = "#25D366";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [offset, scale, brightness, contrast]);

  useEffect(() => {
    if (loaded) draw();
  }, [loaded, draw]);

  // ── Перетаскивание ──────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      const t = e.touches[0];
      const rect = canvasRef.current!.getBoundingClientRect();
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).nativeEvent.offsetX, y: (e as React.MouseEvent).nativeEvent.offsetY };
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    lastPos.current = getPos(e);
  };
  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const pos = getPos(e);
    setOffset(prev => ({ x: prev.x + pos.x - lastPos.current.x, y: prev.y + pos.y - lastPos.current.y }));
    lastPos.current = pos;
  };
  const onPointerUp = () => { isDragging.current = false; };

  // Пинч-зум на мобиле
  const lastDist = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      lastDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else {
      onPointerDown(e);
    }
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastDist.current;
      setScale(s => Math.max(0.3, Math.min(5, s * delta)));
      lastDist.current = dist;
    } else {
      onPointerMove(e);
    }
  };

  // ── Сохранение ──────────────────────────────────────────────────
  const handleSave = () => {
    const img = imgRef.current;
    if (!img) return;

    const out = document.createElement("canvas");
    out.width = OUTPUT; out.height = OUTPUT;
    const ctx = out.getContext("2d")!;

    // Белый фон (нужен для JPEG)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT, OUTPUT);

    // Круглый clip
    ctx.beginPath();
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Рисуем фото с теми же параметрами (масштабированными под OUTPUT)
    const ratio = OUTPUT / SIZE;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    const drawW = img.width * scale * ratio;
    const drawH = img.height * scale * ratio;
    const x = OUTPUT / 2 - drawW / 2 + offset.x * ratio;
    const y = OUTPUT / 2 - drawH / 2 + offset.y * ratio;
    ctx.drawImage(img, x, y, drawW, drawH);

    const dataUrl = out.toDataURL("image/jpeg", 0.9);
    onSave(dataUrl.split(",")[1], dataUrl);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center px-4"
      onClick={e => e.stopPropagation()}>

      {/* Шапка */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4">
        <button onClick={onClose} className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm">
          <Icon name="ArrowLeft" size={18} /> Назад
        </button>
        <p className="text-white font-semibold text-sm">Редактор фото</p>
        <button onClick={handleSave}
          className="bg-[#25D366] text-white text-sm font-semibold px-4 py-1.5 rounded-xl active:bg-[#1da851]">
          Сохранить
        </button>
      </div>

      {/* Холст */}
      <div className="relative mb-5" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="rounded-full cursor-grab active:cursor-grabbing"
          style={{ width: SIZE, height: SIZE, touchAction: "none" }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onPointerUp}
        />
        <p className="text-white/30 text-xs text-center mt-2">Перетащи и масштабируй</p>
      </div>

      {/* Ползунки */}
      <div className="w-full max-w-sm space-y-4 bg-[#1a2634] rounded-2xl p-4">

        {/* Масштаб */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-white/50 text-xs flex items-center gap-1"><Icon name="ZoomIn" size={12} /> Масштаб</span>
            <span className="text-white/30 text-xs">{Math.round(scale * 100)}%</span>
          </div>
          <input type="range" min="0.3" max="5" step="0.05" value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            className="w-full accent-[#25D366] h-1.5" />
        </div>

        {/* Яркость */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-white/50 text-xs flex items-center gap-1"><Icon name="Sun" size={12} /> Яркость</span>
            <span className="text-white/30 text-xs">{brightness}%</span>
          </div>
          <input type="range" min="40" max="200" step="1" value={brightness}
            onChange={e => setBrightness(parseInt(e.target.value))}
            className="w-full accent-[#25D366] h-1.5" />
        </div>

        {/* Контраст */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-white/50 text-xs flex items-center gap-1"><Icon name="Contrast" size={12} /> Контраст</span>
            <span className="text-white/30 text-xs">{contrast}%</span>
          </div>
          <input type="range" min="40" max="200" step="1" value={contrast}
            onChange={e => setContrast(parseInt(e.target.value))}
            className="w-full accent-[#25D366] h-1.5" />
        </div>

        {/* Сброс */}
        <button onClick={() => { setScale(SIZE / Math.min(imgRef.current?.width ?? SIZE, imgRef.current?.height ?? SIZE)); setOffset({ x: 0, y: 0 }); setBrightness(100); setContrast(100); }}
          className="w-full text-white/40 text-xs py-1 hover:text-white/70">
          Сбросить
        </button>
      </div>

      <canvas ref={previewRef} className="hidden" />
    </div>
  );
};

export default DzChatAvatarEditor;

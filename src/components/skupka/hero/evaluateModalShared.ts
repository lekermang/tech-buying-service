export const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

export const INP_CLS = [
  "w-full text-white px-4 py-3.5 font-roboto text-base",
  "focus:outline-none transition-all duration-200 rounded-xl",
  "placeholder:text-white/20",
  "[background:linear-gradient(145deg,rgba(16,12,7,0.97),rgba(10,8,5,0.99))]",
  "[border:1px_solid_rgba(255,255,255,0.08)]",
  "focus:[border-color:rgba(255,215,0,0.5)]",
  "focus:[box-shadow:0_0_0_3px_rgba(255,215,0,0.08),inset_0_1px_0_rgba(255,255,255,0.03)]",
].join(" ");
export const LBL_CLS = "font-roboto text-[11px] uppercase tracking-widest block mb-1.5 [color:rgba(255,255,255,0.38)]";

export const compressImage = (file: File, maxW = 1200, quality = 0.75): Promise<string> =>
  new Promise(resolve => {
    const fallback = () => {
      const reader = new FileReader();
      reader.onload = ev => resolve((ev.target?.result as string).split(",")[1]);
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    };
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const scale = Math.min(1, maxW / Math.max(img.width, img.height, 1));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        const b64 = canvas.toDataURL("image/jpeg", quality).split(",")[1];
        resolve(b64 || "");
      } catch {
        fallback();
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); fallback(); };
    img.src = url;
  });

/**
 * Загружает ОДНО фото в S3 сразу (не дожидаясь отправки формы), с реальным
 * прогрессом (0-100) через XMLHttpRequest (fetch не даёт progress на upload).
 * Возвращает photo_id — используется потом чтобы привязать фото к заявке.
 * Так каждое фото видно "загружено ✓" ещё до нажатия "Отправить заявку",
 * и большие фото не режутся лимитом keepalive-запроса (~64KB).
 */
export const uploadPhotoWithProgress = (
  base64: string,
  onProgress: (pct: number) => void
): Promise<{ photo_id: number; cdn_url: string }> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${SEND_LEAD_URL}?action=upload_photo_temp`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data?.ok && data?.photo_id) {
            onProgress(100);
            resolve({ photo_id: data.photo_id, cdn_url: data.cdn_url });
            return;
          }
        } catch { /* noop */ }
      }
      reject(new Error("upload failed"));
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.timeout = 30000;
    xhr.ontimeout = () => reject(new Error("timeout"));
    xhr.send(JSON.stringify({ photo: base64 }));
  });
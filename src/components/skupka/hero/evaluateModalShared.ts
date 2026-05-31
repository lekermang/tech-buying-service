export const SEND_LEAD_URL = "https://functions.poehali.dev/52666ff7-db52-4b6a-a90e-d60aeed699de";

export const INP_CLS = "w-full bg-[#0D0D0D] border border-[#2a2a2a] text-white px-4 py-3.5 font-roboto text-base focus:outline-none focus:border-[#FFD700] transition-colors rounded-lg placeholder:text-white/25";
export const LBL_CLS = "font-roboto text-white/40 text-[11px] uppercase tracking-wider block mb-1.5";

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

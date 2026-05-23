/** Страница, на которую возвращается Яндекс OAuth: /safe-deals/yandex-callback.
 * Парсит ?code=... и передаёт через postMessage в родительское окно (popup-flow). */
import { useEffect } from "react";

export default function SafeDealsYandexCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code && window.opener) {
      window.opener.postMessage({ type: "yandex_oauth_code", code }, window.location.origin);
      window.close();
    }
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] text-[#F0F0F0]">
      <div className="text-center">
        <div className="text-2xl font-bold text-[#FFD700] mb-2">Закрываем окно...</div>
        <div className="text-sm text-[#999]">Если ничего не произошло — закройте это окно</div>
      </div>
    </div>
  );
}

/**
 * Режим «С компьютера» — тот же отправитель, но:
 * - подсказка что файлы могут быть любого размера (через pre-signed S3)
 * - входной баннер с акцентом на скорость
 */
import Icon from "@/components/ui/icon";
import SenderFlow from "./SenderFlow";

export default function PcFlow({ onCancel }: { onCancel: () => void }) {
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 sm:px-5 pt-4">
        <div className="bg-gradient-to-r from-[#FFD700]/[0.1] via-[#FFD700]/[0.04] to-transparent border border-[#FFD700]/30 rounded-2xl p-3.5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/15 flex items-center justify-center shrink-0 text-[#FFD700]">
            <Icon name="Monitor" size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-[#FFD700]">Режим «С компьютера»</div>
            <div className="text-xs text-[#999] mt-1 leading-relaxed">
              Файлы любого размера (видео, бэкапы, архивы) загружаются <b>напрямую в защищённое хранилище</b>,
              минуя сервер. Никаких лимитов 25 МБ.
            </div>
          </div>
        </div>
      </div>
      <SenderFlow onCancel={onCancel} />
    </>
  );
}

/**
 * Премиум UI-кит для модуля СмартЛомбард.
 * Файл — фасад: re-export всех публичных компонентов из подпапки ./slUI/.
 *
 * Декомпозиция:
 *  - ./slUI/tooltip.tsx     — SLTooltip (визуальный tooltip через portal)
 *  - ./slUI/primitives.tsx  — slClasses, SLCard, SLSection, SLField, SLInput,
 *                             SLTextarea, SLSelect, SLGrid, SLPageWrap
 *  - ./slUI/controls.tsx    — SLButton, SLPill, SLStat, SLModal, SLCheckbox
 *  - ./slUI/tabs.tsx        — SLTabItem, SLTabs, SLTabsGrid
 */

export { SLTooltip } from "./slUI/tooltip";

export {
  slClasses,
  SLCard,
  SLSection,
  SLField,
  SLInput,
  SLTextarea,
  SLSelect,
  SLGrid,
  SLPageWrap,
} from "./slUI/primitives";

export {
  SLButton,
  SLPill,
  SLStat,
  SLModal,
  SLCheckbox,
} from "./slUI/controls";

export type { SLTabItem } from "./slUI/tabs";
export { SLTabs, SLTabsGrid } from "./slUI/tabs";

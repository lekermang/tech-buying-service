export const REPAIR_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

// ─── 4 ОСНОВНЫХ статуса воронки CRM ─────────────────────────────
// Принят → На согласование → Готов → Выдан
// Остальные (в работе, ждём запчасть, гарантия, отменено) — служебные / редкие,
// доступны через подменю "Прочее", в истории и фильтрах.
export const PRIMARY_STATUS_KEYS = ["new", "pending_approval", "ready", "done"] as const;

export const STATUSES = [
  { key: "new",              label: "Принят",          color: "bg-blue-500/20 text-blue-300",       dot: "bg-blue-400",     primary: true  },
  { key: "pending_approval", label: "На согласование", color: "bg-purple-500/20 text-purple-300",   dot: "bg-purple-400",   primary: true  },
  { key: "accepted",         label: "Принят мастером", color: "bg-violet-500/20 text-violet-400",   dot: "bg-violet-400",   primary: false },
  { key: "in_progress",      label: "В работе",        color: "bg-sky-500/20 text-sky-400",         dot: "bg-sky-400",      primary: false },
  { key: "waiting_parts",    label: "Ждём запчасть",   color: "bg-orange-500/20 text-orange-400",   dot: "bg-orange-400",   primary: false },
  { key: "ready",            label: "Готов",           color: "bg-yellow-500/20 text-[#FFD700]",    dot: "bg-[#FFD700]",    primary: true  },
  { key: "done",             label: "Выдан",           color: "bg-green-500/20 text-green-400",     dot: "bg-green-400",    primary: true  },
  { key: "warranty",         label: "На гарантии",     color: "bg-teal-500/20 text-teal-400",       dot: "bg-teal-400",     primary: false },
  { key: "cancelled",        label: "Отменено",        color: "bg-red-500/20 text-red-400",         dot: "bg-red-400",      primary: false },
];

export type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string; comment: string | null;
  purchase_amount: number | null; repair_amount: number | null; completed_at: string | null;
  master_income: number | null; parts_name: string | null; picked_up_at: string | null;
  advance: number | null; is_paid: boolean | null;
  payment_method: string | null;
  status_updated_at?: string | null;
  client_email?: string | null;
  // Выбранная клиентом запчасть из подбора (откуда заказывать)
  part_id?: string | null;
  part_name?: string | null;
  part_quality?: string | null;
  part_source?: string | null;     // 'stock' (МойСклад) | 'order' (Прайс)
  part_supplier?: string | null;
  part_code?: string | null;
  part_category?: string | null;
  part_supplier_price?: number | null;
};

export type DayStat = {
  day: string; total: number; done: number; cancelled: number;
  revenue: number; costs: number; profit: number; master_income: number;
};

export const EMPTY_FORM = { name: "", phone: "", model: "", repair_type: "", price: "", comment: "", client_email: "" };
export const EMPTY_COMPLETE = { purchase_amount: "", repair_amount: "", parts_name: "" };

export const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

export const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const fmtDay = (day: string) => {
  const d = new Date(day + "T12:00:00");
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", weekday: "short" });
};

export const INP = "w-full bg-gradient-to-br from-[#0E0E0E] to-[#0A0A0A] border border-[#1F1F1F] hover:border-[#262626] focus:border-[#FFD700]/60 focus:bg-[#101010] focus:shadow-[0_0_0_3px_rgba(255,215,0,0.08),inset_0_1px_0_rgba(255,215,0,0.04)] text-white px-3 py-2 font-roboto text-[13px] rounded-md focus:outline-none transition-all placeholder:text-white/25";
export const LBL = "font-roboto text-white/55 text-[10px] uppercase tracking-[0.06em] font-bold block mb-1";

export const printAct = async (o: Order) => {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, VerticalAlign, ImageRun } = await import("docx");
  const { saveAs } = await import("file-saver");

  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU");
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  // Загружаем логотип
  let logoData: ArrayBuffer | null = null;
  try {
    const resp = await fetch("https://cdn.poehali.dev/projects/aebcc4b4-364a-471f-b076-f05b82d2d364/bucket/f4f18755-1806-41a9-bcbe-82823a66929b.JPG");
    if (resp.ok) logoData = await resp.arrayBuffer();
  } catch (_e) { /* без логотипа */ }

  const F = "Arial";
  const b = (t: string, sz = 18) => new TextRun({ text: t, bold: true, size: sz, font: F });
  const n = (t: string, sz = 18) => new TextRun({ text: t, size: sz, font: F });
  const NONE = BorderStyle.NONE;
  const SINGLE = BorderStyle.SINGLE;

  const noBorder = { top: { style: NONE }, bottom: { style: NONE }, left: { style: NONE }, right: { style: NONE } };
  const allBorder = (sz = 4, color = "000000") => ({
    top: { style: SINGLE, size: sz, color }, bottom: { style: SINGLE, size: sz, color },
    left: { style: SINGLE, size: sz, color }, right: { style: SINGLE, size: sz, color },
  });

  // Строка таблицы данных: метка | значение
  const dataRow = (label: string, value: string, shaded = false) => new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: shaded ? { fill: "F5F5F5" } : undefined,
        borders: allBorder(4),
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [b(label, 18)] })],
      }),
      new TableCell({
        width: { size: 65, type: WidthType.PERCENTAGE },
        shading: shaded ? { fill: "F5F5F5" } : undefined,
        borders: allBorder(4),
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [n(value || "—", 18)] })],
      }),
    ],
  });

  // Таблица с данными заявки
  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorder(6),
    rows: [
      dataRow("№ заявки", String(o.id), true),
      dataRow("Дата / Время", `${dateStr}  ${timeStr}`),
      dataRow("Клиент", o.name, true),
      dataRow("Телефон", o.phone),
      dataRow("Устройство", o.model || "—", true),
      dataRow("Вид работ", o.repair_type || "—"),
      dataRow("Описание неисправности", o.comment || "—", true),
      dataRow("Предв. стоимость", o.price ? `${o.price.toLocaleString("ru-RU")} руб.` : "По результатам диагностики"),
    ],
  });

  // Таблица состояния устройства при приёме
  const conditionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorder(6),
    rows: [
      new TableRow({ children: [
        new TableCell({ columnSpan: 4, borders: allBorder(4), shading: { fill: "EEEEEE" },
          children: [new Paragraph({ spacing: { before: 40, after: 40 }, alignment: AlignmentType.CENTER, children: [b("ВНЕШНИЙ ВИД УСТРОЙСТВА ПРИ ПРИЁМЕ", 18)] })] }),
      ]}),
      new TableRow({ children: [
        ...(["Царапины", "Трещины", "Сколы", "Другое"].map(label =>
          new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, borders: allBorder(4),
            children: [
              new Paragraph({ spacing: { before: 40, after: 60 }, alignment: AlignmentType.CENTER, children: [n(label, 16)] }),
              new Paragraph({ spacing: { before: 0, after: 40 }, alignment: AlignmentType.CENTER, children: [n("☐  Есть     ☐  Нет", 16)] }),
            ]})
        )),
      ]}),
      new TableRow({ children: [
        new TableCell({ columnSpan: 4, borders: allBorder(4),
          children: [new Paragraph({ spacing: { before: 40, after: 60 }, children: [b("Примечания: ", 16), n("_".repeat(80), 16)] })] }),
      ]}),
    ],
  });

  // Таблица рисков
  const risks = [
    "После воды аппарат может полностью умереть при любом ремонте. Мастерская не обязана его оживлять.",
    "Компонентная пайка — риск гибели платы. Если телефон умер в процессе — работа оплачивается.",
    "При снятии дисплея он может сломаться. Замена — за счёт клиента.",
    "Данные (фото, контакты) могут быть потеряны безвозвратно.",
    "Гарантии на результат нет. В худшем случае — оплата диагностики и сделанной работы.",
  ];
  const risksTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorder(6),
    rows: [
      new TableRow({ children: [
        new TableCell({ columnSpan: 2, borders: allBorder(4), shading: { fill: "EEEEEE" },
          children: [new Paragraph({ spacing: { before: 40, after: 40 }, alignment: AlignmentType.CENTER, children: [b("УСЛОВИЯ РЕМОНТА — КЛИЕНТ ОЗНАКОМЛЕН И СОГЛАСЕН", 18)] })] }),
      ]}),
      ...risks.map((risk, i) => new TableRow({ children: [
        new TableCell({ width: { size: 5, type: WidthType.PERCENTAGE }, borders: allBorder(4), shading: { fill: "F5F5F5" }, verticalAlign: VerticalAlign.CENTER,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [b(`${i + 1}`, 18)] })] }),
        new TableCell({ width: { size: 95, type: WidthType.PERCENTAGE }, borders: allBorder(4),
          children: [new Paragraph({ spacing: { before: 40, after: 40 }, children: [n(risk, 17)] })] }),
      ]})),
    ],
  });

  // Таблица подписей
  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorder(6),
    rows: [
      new TableRow({ children: [
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: allBorder(4), shading: { fill: "F5F5F5" },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [b("МАСТЕР", 18)] })] }),
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, borders: allBorder(4), shading: { fill: "F5F5F5" },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 }, children: [b("КЛИЕНТ", 18)] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: allBorder(4),
          children: [
            new Paragraph({ spacing: { before: 20, after: 20 }, children: [n("ФИО: _______________________________", 17)] }),
            new Paragraph({ spacing: { before: 60, after: 20 }, children: [n("Подпись: ___________________________", 17)] }),
          ] }),
        new TableCell({ borders: allBorder(4),
          children: [
            new Paragraph({ spacing: { before: 20, after: 20 }, children: [n("ФИО: _______________________________", 17)] }),
            new Paragraph({ spacing: { before: 60, after: 20 }, children: [n("Подпись: ___________________________", 17)] }),
          ] }),
      ]}),
    ],
  });

  const gap = new Paragraph({ spacing: { before: 120, after: 0 }, children: [] });

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 720 } } },
      children: [
        // Шапка
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: allBorder(8, "000000"),
          rows: [new TableRow({ children: [
            // Логотип
            ...(logoData ? [new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              borders: { ...noBorder, right: { style: SINGLE, size: 6, color: "DDDDDD" } },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [new ImageRun({ data: logoData, transformation: { width: 90, height: 90 }, type: "jpg" })],
              })],
            })] : []),
            // Реквизиты
            new TableCell({
              width: { size: logoData ? 52 : 60, type: WidthType.PERCENTAGE },
              borders: { ...noBorder, right: { style: SINGLE, size: 8, color: "000000" } },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({ spacing: { before: 60, after: 20 }, children: [b("ИП МАМЕДОВ АДИЛЬ МИРЗА ОГЛЫ", 22)] }),
                new Paragraph({ spacing: { before: 0, after: 20 }, children: [n("г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11", 17)] }),
                new Paragraph({ spacing: { before: 0, after: 20 }, children: [n("ИНН: 402810962699  |  ОГРНИП: 307402814200032", 16)] }),
                new Paragraph({ spacing: { before: 0, after: 60 }, children: [n("Тел.: +7 (992) 990-33-33  |  skypka24.com", 16)] }),
              ],
            }),
            // Акт №
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: noBorder,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 10 }, children: [b("АКТ ПРИЁМА В РЕМОНТ", 24)] }),
                new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [b(`№ ${o.id}`, 22)] }),
              ],
            }),
          ]})]
        }),

        gap,
        infoTable,
        gap,
        conditionTable,
        gap,
        risksTable,
        gap,
        signTable,

        // Реквизиты
        new Paragraph({ spacing: { before: 100, after: 0 }, alignment: AlignmentType.CENTER,
          children: [n("Р/с: 40802810422270001866  |  КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК  |  БИК: 042908612", 15)] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Акт_приёмки_№${o.id}_${o.name.replace(/\s+/g, "_")}.docx`);
};

export const getActHtmlString = (o: Order): string => {
  const now = new Date(o.created_at);
  const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const barNum = String(o.id).padStart(12, "0");
  const orderNum = String(o.id).padStart(6, "0");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Акт приёма №${o.id}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js">` + `</script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:10px;color:#000;background:#fff}
.page{width:210mm;margin:0 auto;padding:7mm 9mm}
.print-btn{text-align:center;padding:10px;background:#f5f5f5;border-bottom:1px solid #ccc}
@media print{.print-btn{display:none}body{margin:0}.page{padding:7mm 9mm;width:100%}}
.page-break{page-break-before:always;padding-top:5mm}
.page-num{font-size:8px;color:#777;text-align:right;margin-bottom:1px}

/* ШАПКА */
.hdr{display:flex;align-items:stretch;margin-bottom:5px;border:1px solid #000}
.hdr-bc{padding:5px 8px;border-right:1px solid #000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-width:150px}
.hdr-bc svg{display:block}
.bc-num{font-size:8.5px;letter-spacing:1px;text-align:center}
.warn{border:1.5px solid #000;padding:3px 5px;font-size:8px;font-weight:bold;line-height:1.4;text-align:center;max-width:145px}
.hdr-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 10px;border-right:1px solid #000;text-align:center}
.hdr-mid .t1{font-size:14px;font-weight:bold;letter-spacing:0.3px}
.hdr-mid .t2{font-size:9px;color:#555;margin:1px 0 5px}
.hdr-mid .t3{font-size:12px;font-weight:bold}
.hdr-mid .t4{font-size:9px;color:#333;margin-top:2px}
.hdr-right{padding:5px 8px;font-size:8.5px;line-height:1.7;text-align:left;min-width:175px;display:flex;flex-direction:column;justify-content:center}
.hdr-right b{font-size:9.5px;display:block;margin-bottom:1px}

/* 3 секции: Клиент / Устройство / Ремонт */
.sec3{display:flex;border:1px solid #000;margin-bottom:5px}
.sc{flex:1;border-right:1px solid #ccc}
.sc:last-child{border-right:none}
.sc-h{background:#efefef;padding:2px 6px;font-weight:bold;font-size:9px;border-bottom:1px solid #ccc;text-underline-offset:2px;text-decoration:underline}
.sc-b{padding:4px 6px}
.f{margin-bottom:2px}
.fl{font-size:8px;color:#555}
.fv{font-weight:bold;font-size:10px;word-break:break-word}
.fvn{font-size:10px;word-break:break-word}

/* Заметки приёмщика */
.notes{margin-bottom:5px;border-bottom:1px solid #000;padding-bottom:3px}
.notes-lbl{font-size:8.5px;font-weight:bold;margin-bottom:12px}

/* Блок повреждений + таблица функций */
.dmg-wrap{display:flex;border:1px solid #000;margin-bottom:5px}
.dmg-left{flex:1.2;border-right:1px solid #ccc;padding:5px 6px;display:flex;flex-direction:column;gap:6px}
.dmg-title{font-size:9px;font-weight:bold;margin-bottom:1px}
.dmg-hint{font-size:7.5px;color:#555;margin-bottom:3px}
.dmg-right{flex:1;padding:4px 5px}
.ctbl{width:100%;border-collapse:collapse;font-size:8.5px}
.ctbl th{background:#efefef;border:1px solid #bbb;padding:2px 4px;text-align:left;font-size:8.5px}
.ctbl td{border:1px solid #bbb;padding:2px 4px}
.ctbl td:last-child{font-size:8px;color:#555;width:95px}

/* Телефон SVG */
.phone-row{display:flex;align-items:stretch;justify-content:space-between;gap:0}
.phone-view{display:flex;flex-direction:column;align-items:center;flex:1}
.phone-view svg{width:100%;height:auto;display:block}
.phone-view-wide{display:flex;flex-direction:column;align-items:center;flex:2}
.phone-view-wide svg{width:100%;height:auto;display:block}
/* Ноутбук SVG */
.laptop-row{display:flex;align-items:stretch;justify-content:space-between;gap:0}
.laptop-view{display:flex;flex-direction:column;align-items:center;flex:3}
.laptop-view svg{width:100%;height:auto;display:block}
.laptop-view-narrow{display:flex;flex-direction:column;align-items:center;flex:1}
.laptop-view-narrow svg{width:100%;height:auto;display:block}

/* Условия */
.cond-wrap{display:flex;border:1px solid #000;margin-bottom:5px}
.cond-left{flex:1;padding:4px 8px 4px 6px;border-right:1px solid #ccc}
.cond-right{width:130px;padding:5px 7px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;text-align:center}
.cond-title{font-size:8.5px;font-weight:bold;background:#efefef;padding:2px 6px;border-bottom:1px solid #ccc;margin:-4px -8px 4px -6px}
.cond-ol{padding-left:16px;font-size:7.8px;line-height:1.6;margin:0}
.cond-ol li{margin-bottom:1px}
.cond-agree{font-size:8px;font-weight:bold;line-height:1.4;border:1px solid #000;padding:4px;text-align:center}
.cond-link{font-size:9px;font-weight:bold;color:#000;word-break:break-all}

/* Подписи */
.signs{display:flex;border:1px solid #000}
.sign-col{flex:1;padding:6px 10px}
.sign-col:first-child{border-right:1px solid #000}
.sign-title{font-size:8.5px;margin-bottom:2px}
.sign-who{font-size:9px;margin-bottom:12px}
.sign-line-row{display:flex;gap:16px;margin-bottom:2px}
.sign-blank{flex:1;border-bottom:1px solid #000;margin-bottom:1px;height:14px}
.sign-hint{display:flex;gap:16px;font-size:7.5px;color:#777}
.sign-hint span{flex:1;text-align:center}
.date-line{font-size:8px;margin-bottom:2px}
</style>
</head><body>
<div class="print-btn" style="text-align:center;padding:10px 12px;background:#f5f5f5;border-bottom:1px solid #ccc;display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap">
  <button onclick="window.print()" style="padding:9px 28px;font-size:14px;cursor:pointer;background:#FFD700;border:2px solid #000;font-weight:bold;border-radius:4px">🖨 Распечатать акт</button>
  <a href="https://skypka24.com/repair-status?id=${o.id}" target="_blank" style="display:inline-block;padding:9px 20px;font-size:13px;background:#fff;border:2px solid #333;font-weight:bold;text-decoration:none;color:#000;border-radius:4px">🔍 Статус ремонта</a>
  <a href="https://skypka24.com/act" target="_blank" style="display:inline-block;padding:9px 20px;font-size:13px;background:#fff;border:2px solid #888;font-weight:normal;text-decoration:none;color:#333;border-radius:4px">📋 Условия гарантии</a>
</div>
<div class="page">

<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
  <span style="font-size:8px;color:#555">Экз. Клиента</span>
  <span style="font-size:8px;color:#777">Стр. 1 из 2</span>
</div>

<!-- ШАПКА -->
<div class="hdr">
  <div class="hdr-bc">
    <svg id="barcode"></svg>
    <div class="bc-num">${barNum}</div>
    <div class="warn">ВНИМАНИЕ! Оплата производится только в сервисном центре при получении заказа.</div>
  </div>
  <div class="hdr-mid">
    <div class="t1">Акт приёма — передачи</div>
    <div class="t2">устройства в ремонт</div>
    <div class="t3">№ ${orderNum}</div>
    <div class="t4">от ${dateStr}</div>
  </div>
  <div class="hdr-right">
    <b>Исполнитель:</b>
    ИП Мамедов Адиль Мирза Оглы<br>
    ИНН: 402810962699<br>
    ОГРНИП: 307402814200032<br>
    г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
    Тел.: +7 (992) 990-33-33<br>
    skypka24.com
  </div>
</div>

<!-- КЛИЕНТ / УСТРОЙСТВО / РЕМОНТ -->
<div class="sec3">
  <div class="sc">
    <div class="sc-h">Клиент:</div>
    <div class="sc-b">
      <div class="f"><div class="fl">ФИО Клиента:</div><div class="fv">${o.name}</div></div>
      <div style="height:8px"></div>
      <div class="f"><div class="fl">Телефон Клиента:</div><div class="fv">${o.phone}</div></div>
    </div>
  </div>
  <div class="sc">
    <div class="sc-h">Устройство:</div>
    <div class="sc-b">
      <div class="f"><div class="fl">Устройство:</div><div class="fv">${o.model || "—"}</div></div>
      <div class="f"><div class="fl">Цвет:</div><div class="fvn">—</div></div>
      <div class="f"><div class="fl">Пароль от устройства:</div><div class="fvn">&nbsp;</div></div>
      <div class="f"><div class="fl">Сер. №:</div><div class="fvn">—</div></div>
      <div class="f"><div class="fl">Внешний вид:</div><div class="fvn">Царапины, потёртости, возможны скрытые дефекты</div></div>
      <div class="f"><div class="fl">IMEI:</div><div class="fvn">&nbsp;</div></div>
    </div>
  </div>
  <div class="sc">
    <div class="sc-h">Ремонт:</div>
    <div class="sc-b">
      <div class="f"><div class="fl">Ориентировочная стоимость:</div><div class="fvn">${o.price ? o.price.toLocaleString("ru-RU") + " ₽" : "0"}</div></div>
      <div class="f"><div class="fl">Аванс:</div><div class="fvn">0</div></div>
      <div style="height:6px"></div>
      <div class="f"><div class="fl">Ориентировочный срок ремонта:</div><div class="fvn">По договорённости</div></div>
      <div class="f"><div class="fl">Заявленные неисправности:</div><div class="fvn">${o.comment || o.repair_type || "—"}</div></div>
    </div>
  </div>
</div>

<!-- ЗАМЕТКИ ПРИЁМЩИКА -->
<div class="notes">
  <div class="notes-lbl">Заметки приёмщика:</div>
</div>

<!-- НАРУЖНЫЕ ПОВРЕЖДЕНИЯ + ПРОВЕРКА ФУНКЦИЙ -->
<div class="dmg-wrap">
  <div class="dmg-left">
    <div>
      <div class="dmg-title">Наружные повреждения</div>
      <div class="dmg-hint">Отметить на схеме: * – скол, / – вмятина, v – царапина</div>
    </div>

    <!-- ТЕЛЕФОН 4 ВИДА — на весь квадрат -->
    <div class="phone-row">
      <div class="phone-view">
        <svg viewBox="0 0 60 116" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="56" height="112" rx="8" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="7" y="13" width="46" height="90" fill="none" stroke="#000" stroke-width="1.1"/>
          <ellipse cx="30" cy="8" rx="8" ry="2.5" fill="none" stroke="#000" stroke-width="1"/>
          <circle cx="30" cy="107" r="4.5" fill="none" stroke="#000" stroke-width="1"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center">Спереди</div>
      </div>
      <div class="phone-view">
        <svg viewBox="0 0 60 116" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="56" height="112" rx="8" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="6" y="7" width="22" height="22" rx="5" fill="none" stroke="#000" stroke-width="1.3"/>
          <circle cx="17" cy="18" r="7" fill="none" stroke="#000" stroke-width="1.1"/>
          <circle cx="32" cy="10" r="3.5" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="7" y="32" width="12" height="2.5" rx="1.2" fill="#ccc" stroke="none"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center">Сзади</div>
      </div>
      <div class="phone-view" style="flex:0.38">
        <svg viewBox="0 0 22 116" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="18" height="112" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="0" y="24" width="4" height="18" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="0" y="46" width="4" height="18" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="18" y="34" width="4" height="24" rx="2" fill="none" stroke="#000" stroke-width="1"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center">Слева</div>
      </div>
      <div class="phone-view-wide" style="flex:1.1;justify-content:flex-end">
        <svg viewBox="0 0 116 22" xmlns="http://www.w3.org/2000/svg" style="margin-bottom:auto">
          <rect x="2" y="2" width="112" height="18" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
          <rect x="38" y="4" width="40" height="14" rx="3.5" fill="none" stroke="#000" stroke-width="1.1"/>
          <rect x="8" y="5" width="5" height="12" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="17" y="5" width="5" height="12" rx="2" fill="none" stroke="#000" stroke-width="1"/>
          <rect x="98" y="5" width="5" height="12" rx="2" fill="none" stroke="#000" stroke-width="1"/>
        </svg>
        <div style="font-size:7px;color:#555;text-align:center;margin-top:2px">Снизу</div>
      </div>
    </div>

    <!-- НОУТБУК / ПЛАНШЕТ 3 ВИДА — на весь квадрат -->
    <div>
      <div style="font-size:8px;color:#555;margin-bottom:2px;font-weight:bold">Ноутбук / Планшет:</div>
      <div class="laptop-row">
        <div class="laptop-view">
          <svg viewBox="0 0 130 102" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="126" height="78" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="8" y="8" width="114" height="66" fill="none" stroke="#000" stroke-width="1.1"/>
            <circle cx="65" cy="5" r="2.2" fill="none" stroke="#000" stroke-width="1"/>
            <rect x="0" y="82" width="130" height="12" rx="3" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="44" y="84" width="42" height="8" rx="2.5" fill="none" stroke="#000" stroke-width="1"/>
          </svg>
          <div style="font-size:7px;color:#555;text-align:center">Спереди</div>
        </div>
        <div class="laptop-view">
          <svg viewBox="0 0 130 102" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="126" height="12" rx="4" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="0" y="16" width="130" height="78" rx="5" fill="none" stroke="#000" stroke-width="1.8"/>
          </svg>
          <div style="font-size:7px;color:#555;text-align:center">Сзади</div>
        </div>
        <div class="laptop-view-narrow">
          <svg viewBox="0 0 32 102" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="2" width="12" height="66" rx="3" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="2" y="70" width="28" height="12" rx="3" fill="none" stroke="#000" stroke-width="1.8"/>
            <rect x="4" y="72" width="10" height="8" rx="1.5" fill="none" stroke="#000" stroke-width="1"/>
          </svg>
          <div style="font-size:7px;color:#555;text-align:center">Сбоку</div>
        </div>
      </div>
    </div>
  </div>

  <!-- ТАБЛИЦА ФУНКЦИЙ — пустые ячейки "До ремонта" -->
  <div class="dmg-right">
    <table class="ctbl">
      <thead><tr><th>Проверка функций</th><th>До ремонта</th></tr></thead>
      <tbody>
        <tr><td>Кнопка Home</td><td>&nbsp;</td></tr>
        <tr><td>Кнопка Вкл./Выкл.</td><td>&nbsp;</td></tr>
        <tr><td>Изменение геометрии</td><td>&nbsp;</td></tr>
        <tr><td>Деформация корпуса</td><td>&nbsp;</td></tr>
        <tr><td>Компас и гироскоп</td><td>&nbsp;</td></tr>
        <tr><td>Кнопки громкости (меню)</td><td>&nbsp;</td></tr>
        <tr><td>Поиск сети</td><td>&nbsp;</td></tr>
        <tr><td>Нижний микрофон (диктофон)</td><td>&nbsp;</td></tr>
        <tr><td>Полифонический динамик</td><td>&nbsp;</td></tr>
        <tr><td>Wi-Fi/Bluetooth (адрес Wi-Fi/сеть)</td><td>&nbsp;</td></tr>
        <tr><td>Фонарик</td><td>&nbsp;</td></tr>
        <tr><td>Датчик приближения</td><td>&nbsp;</td></tr>
        <tr><td>Кнопки громкости (вызов)</td><td>&nbsp;</td></tr>
        <tr><td>Камера основная (фокус/пятна/пиксели)</td><td>&nbsp;</td></tr>
        <tr><td>Чтение SIM-карты</td><td>&nbsp;</td></tr>
        <tr><td>Датчик освещённости</td><td>&nbsp;</td></tr>
        <tr><td>Дисплей (touchscreen/стекло/рамка/полосы/пиксели/3D touch)</td><td>&nbsp;</td></tr>
        <tr><td>Сканер радужки глаз</td><td>&nbsp;</td></tr>
        <tr><td>Touch ID / Face ID</td><td>&nbsp;</td></tr>
        <tr><td>Беспроводная зарядка</td><td>&nbsp;</td></tr>
        <tr><td>Слуховой динамик</td><td>&nbsp;</td></tr>
        <tr><td>Разъём зарядки</td><td>&nbsp;</td></tr>
        <tr><td>Переключатель вибро</td><td>&nbsp;</td></tr>
        <tr><td>Камера фронтальная (фокус/пятна/пиксели)</td><td>&nbsp;</td></tr>
        <tr><td>Аудиоразъём (L/R)</td><td>&nbsp;</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- РАЗРЫВ СТРАНИЦЫ -->
<div class="page-break">
<div class="page-num">Стр. 2 из 2</div>
</div>

<!-- УСЛОВИЯ + СОГЛАСИЕ -->
<div class="cond-wrap">
  <div class="cond-left">
    <div class="cond-title">Правила и условия проведения ремонтных работ</div>
    <ol class="cond-ol">
      <li>Правила и условия проведения ремонтных работ изложены на сайте <b>skypka24.com/act</b></li>
      <li>Устройство Клиента принимается без разборки и проверки внутренних неисправностей.</li>
      <li>Клиент согласен с тем, что гарантия от производителя после произведённого ремонта не возможна.</li>
      <li>Клиент принимает на себя риск, связанный с возможным проявлением при ремонте скрытых дефектов, имеющихся в устройстве на момент приёмки от клиента, которые невозможно проверить и зафиксировать в данном документе (наличие следов коррозии, попадания влаги, посторонних предметов, следов механических повреждений и прочих непредусмотренных производителем в устройство и его компоненты).</li>
      <li>Ремонт и обслуживание осуществляется в соответствии с требованиями нормативных документов, в том числе ГОСТ Р МЭК 60065-2002, ГОСТ Р МЭК 60950-2002, ГОСТ Р 50936-2013, ГОСТ Р 57137-2016, ГОСТ Р 50938-2013 и согласно Федеральному закону «О защите прав потребителей».</li>
      <li>Установленные узлы и расходные материалы возврату не подлежат согласно Перечню сложных технических товаров, не подлежащих обмену или возврату.</li>
      <li>Исполнитель не несёт ответственности за сохранность гарантийных пломб сторонних сервисных центров и производителя устройства.</li>
      <li>Исполнитель не несёт ответственности за возможную потерю информации на внутренних носителях устройства, связанную с заменой узлов и компонентов.</li>
      <li>Факт возврата устройства из ремонта фиксируется в форме ВО-13, которую исполнитель заполняет в двух экземплярах при возврате устройства клиенту.</li>
      <li>Клиент согласен с тем, что при ремонте устройства могут быть заменены компоненты, узлы, модули, влияющие на идентификацию IMEI номера устройства.</li>
      <li><b>Ремонт Устройств после попадания влаги.</b> В том случае, если Устройство Клиента подвергалось взаимодействию с водной средой, то в Устройстве возможны окисления мест соединения. Клиент согласен, что при обнаружении следов взаимодействия с водной средой есть риск выхода из строя многофункциональных шлейфов, а также других узлов Устройства (вибромотор, полифонический и слуховой динамики, кнопка Home с функцией Touch ID, основная камера, системы антенн и др.), за который Исполнитель ответственности не несёт. Клиент уведомлен о вероятности самопроизвольного выхода из строя материнской платы (частично или полностью), потери или полной утраты функциональности Устройства. Клиент предупреждён, что указанные неисправности могут проявиться как во время проведения ремонта, так и в течение трёх месяцев после выдачи Устройства Клиенту.</li>
      <li><b>Ремонт Устройств, полностью или частично восстановленных с использованием неоригинальных комплектующих.</b> С Клиентом согласовано, что при проведении сложного ремонта в случае обнаружения на Устройстве установленных ранее неоригинальных комплектующих с нарушением заводских допусков в работоспособности и установке последних есть риск частичного или полного выхода из строя функциональных узлов (дисплейный модуль, системы антенн), за который Исполнитель ответственности не несёт. Клиент согласен, что если Устройство ранее подвергалось некачественному ремонту в другом сервисном центре, то возможен риск выхода из строя материнской платы Устройства по одной из следующих причин: трещины в текстолите, отсутствие необходимых микроэлементов на поверхности платы, нарушение системы пайки (BGA) микросхем на поверхности платы, за который Исполнитель ответственности не несёт, равно как и за полный выход Устройства из строя без возможности его восстановления.</li>
      <li>Клиент согласен с тем, что Исполнитель не несёт ответственности за возможную неработоспособность Устройства или его отдельных компонентов из-за невозможности проверки всех функций Устройства.</li>
    </ol>
  </div>
  <div class="cond-right">
    <div class="cond-agree">Ознакомлен с условиями ремонта и согласен</div>
    <div style="font-size:7.5px;color:#555;text-align:center;margin-top:2px">Полные правила на сайте:</div>
    <div class="cond-link">skypka24.com/act</div>
    <div style="margin-top:16px;border-top:1px solid #000;width:100%;padding-top:2px;font-size:7.5px;color:#777;text-align:center">(подпись клиента)</div>
  </div>
</div>

<!-- ПОДПИСИ -->
<div class="signs">
  <div class="sign-col">
    <div class="sign-title">Клиент:</div>
    <div class="sign-who">С условиями ознакомлен и согласен, устройство в работоспособном состоянии и рабочоспособность передал:</div>
    <div class="date-line">___________ 20___ г.</div>
    <div class="sign-line-row"><div class="sign-blank"></div><div class="sign-blank"></div></div>
    <div class="sign-hint"><span>(подпись)</span><span>(Фамилия, Имя, Отчество)</span></div>
  </div>
  <div class="sign-col">
    <div class="sign-title">Исполнитель:</div>
    <div class="sign-who">Устройство в указанном состоянии принял, работоспособность подтвердил:</div>
    <div class="date-line">___________ 20___ г.</div>
    <div class="sign-line-row"><div class="sign-blank"></div><div class="sign-blank"></div></div>
    <div class="sign-hint"><span>(подпись)</span><span>(Фамилия, Имя, Отчество)</span></div>
  </div>
</div>

</div>
<script>
  window.addEventListener('load', function() {
    JsBarcode("#barcode", "${barNum}", {
      format: "CODE128",
      width: 1.5,
      height: 42,
      displayValue: false,
      margin: 0,
    });
  });
` + `</script>
</body></html>`;
  return html;
};

export const printActHTML = (o: Order) => {
  const html = getActHtmlString(o);
  const win = window.open("", "_blank", "width=980,height=1300");
  if (!win) return;
  win.document.write(html);
  win.document.close();
};

export const printReceipt = (o: Order) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU");
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const isWater = /вода|влага|залит|liquid|water/i.test((o.repair_type || "") + " " + (o.comment || ""));
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Чек #${o.id}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:12px;color:#000;background:#fff}
    .page{width:100%;display:flex;gap:0}
    .half{width:50%;padding:18px 16px;border-right:2px dashed #aaa}
    .half:last-child{border-right:none}
    h1{font-size:15px;font-weight:bold;text-align:center;margin-bottom:2px}
    .subtitle{font-size:10px;text-align:center;color:#444;margin-bottom:10px}
    .section-title{font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #000;padding-bottom:3px;margin:10px 0 6px}
    .row{display:flex;justify-content:space-between;margin-bottom:3px;font-size:11px}
    .row .label{color:#555;flex-shrink:0;margin-right:6px}
    .row .val{font-weight:600;text-align:right}
    .total-row{display:flex;justify-content:space-between;font-size:14px;font-weight:bold;border-top:2px solid #000;padding-top:6px;margin-top:6px}
    .dashed{border-top:1px dashed #999;margin:8px 0}
    .requisites{font-size:9px;color:#555;margin-top:8px;line-height:1.5}
    .warranty-box{border:2px solid #000;padding:8px;margin-top:10px}
    .warranty-title{font-size:12px;font-weight:bold;text-align:center;margin-bottom:6px}
    .warranty-item{font-size:10px;margin-bottom:3px;padding-left:10px;position:relative}
    .warranty-item:before{content:"•";position:absolute;left:0}
    .no-warranty{font-size:11px;font-weight:bold;color:#000;border:2px solid #000;padding:6px;text-align:center;margin-top:8px}
    .sign-line{display:flex;justify-content:space-between;margin-top:14px;font-size:10px}
    .sign-line span{border-top:1px solid #000;padding-top:3px;min-width:100px;text-align:center}
    @media print{body{margin:0}button{display:none!important}.page{width:210mm}}
  </style></head><body>
  <div style="text-align:center;padding:10px"><button onclick="window.print()" style="padding:8px 20px;font-size:13px;cursor:pointer;background:#FFD700;border:none;font-weight:bold">🖨 Печатать</button></div>
  <div class="page">
    <div class="half">
      <h1>Скупка24</h1>
      <div class="subtitle">ИП Мамедов Адиль Мирза Оглы · г.Калуга, ул.Кирова, 7 / ул.Кирова, 11 · skypka24.com</div>
      <div class="section-title">Квитанция об оплате</div>
      <div class="row"><span class="label">№ заявки:</span><span class="val">#${o.id}</span></div>
      <div class="row"><span class="label">Дата:</span><span class="val">${dateStr} ${timeStr}</span></div>
      <div class="dashed"></div>
      <div class="row"><span class="label">Клиент:</span><span class="val">${o.name}</span></div>
      <div class="row"><span class="label">Телефон:</span><span class="val">${o.phone}</span></div>
      ${o.model ? `<div class="row"><span class="label">Устройство:</span><span class="val">${o.model}</span></div>` : ""}
      <div class="dashed"></div>
      ${o.repair_type ? `<div class="row"><span class="label">Вид работы:</span><span class="val">${o.repair_type}</span></div>` : ""}
      ${o.comment ? `<div class="row"><span class="label">Описание:</span><span class="val" style="max-width:130px">${o.comment}</span></div>` : ""}
      <div class="total-row"><span>К оплате:</span><span>${(o.repair_amount || 0).toLocaleString("ru-RU")} ₽</span></div>
      <div class="dashed"></div>
      <div style="font-size:10px;color:#555;margin-top:4px">Оплата принята. Спасибо за обращение!</div>
      <div class="requisites">
        ИНН: 402810962699 · ОГРНИП: 307402814200032<br>
        Р/с: 40802810422270001866<br>
        КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК<br>
        БИК: 042908612 · К/с: 30101810100000000612
      </div>
      <div class="sign-line"><span>Выдал</span><span>Получил</span></div>
    </div>
    <div class="half">
      <h1>Гарантийный талон</h1>
      <div class="subtitle">Скупка24 · г.Калуга, ул.Кирова, 7 / ул.Кирова, 11 · skypka24.com</div>
      <div class="section-title">Данные ремонта</div>
      <div class="row"><span class="label">№ заявки:</span><span class="val">#${o.id}</span></div>
      <div class="row"><span class="label">Дата:</span><span class="val">${dateStr}</span></div>
      <div class="row"><span class="label">Клиент:</span><span class="val">${o.name}</span></div>
      ${o.model ? `<div class="row"><span class="label">Устройство:</span><span class="val">${o.model}</span></div>` : ""}
      ${o.repair_type ? `<div class="row"><span class="label">Работа:</span><span class="val">${o.repair_type}</span></div>` : ""}
      <div class="dashed"></div>
      ${isWater ? `
      <div class="no-warranty">
        ⚠ ГАРАНТИЯ НЕ ПРЕДОСТАВЛЯЕТСЯ<br>
        <span style="font-size:10px;font-weight:normal">Ремонт после воздействия влаги/воды</span>
      </div>
      ` : `
      <div class="warranty-box">
        <div class="warranty-title">Гарантия: 30 дней</div>
        <div class="warranty-item">Гарантия распространяется только на выполненную работу и установленные запчасти</div>
        <div class="warranty-item">Гарантия не распространяется на механические повреждения, попадание влаги и воды</div>
        <div class="warranty-item">Гарантия не распространяется на программное обеспечение</div>
        <div class="warranty-item">При нарушении пломб гарантия аннулируется</div>
      </div>
      `}
      <div style="font-size:10px;color:#555;margin-top:10px">
        Сохраняйте талон до окончания гарантийного срока.<br>
        По вопросам: ул.Кирова, 7 / ул.Кирова, 11, г.Калуга · skypka24.com
      </div>
      <div class="sign-line"><span>Мастер</span><span>Клиент</span></div>
    </div>
  </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};

const SEND_CHECK_URL = "https://functions.poehali.dev/3e5c5c1a-5e16-4ae2-8b34-8618e4f6558d";
const SITE_URL = "https://skypka24.com";

// Общая «обёртка» письма — тёмная, в стиле бренда
const emailWrap = (title: string, badge: string, bodyHtml: string, order: Order) => {
  const statusUrl = `${SITE_URL}/repair-status?id=${order.id}`;
  const termsUrl  = `${SITE_URL}/act`;
  return `
<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:28px 12px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

  <!-- ШАПКА -->
  <tr><td style="background:linear-gradient(135deg,#1a1a1a,#111);border-radius:16px 16px 0 0;padding:28px 36px;border-bottom:2px solid #FFD700">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><div style="font-size:26px;font-weight:900;color:#FFD700;letter-spacing:2px">СКУПКА<span style="color:#fff">24</span></div>
          <div style="font-size:11px;color:#555;margin-top:3px;letter-spacing:1px;text-transform:uppercase">Ремонт техники · г. Калуга</div></td>
      <td align="right"><div style="background:#FFD700;color:#000;padding:7px 16px;border-radius:30px;font-size:12px;font-weight:800;letter-spacing:0.5px">${badge}</div></td>
    </tr></table>
  </td></tr>

  <!-- ТЕЛО -->
  <tr><td style="background:#161616;padding:28px 36px">
    <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:6px">Здравствуйте, ${order.name}!</div>
    <div style="font-size:13px;color:#aaa;line-height:1.7;margin-bottom:20px">${title} по заявке <span style="color:#FFD700;font-weight:700">#${order.id}</span></div>
    <div style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;padding:20px;color:#e0e0e0;font-size:13px;line-height:1.9">
      ${bodyHtml}
    </div>
  </td></tr>

  <!-- КНОПКИ -->
  <tr><td style="background:#161616;padding:4px 36px 24px;text-align:center">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
      <td style="padding:0 6px"><a href="${statusUrl}" style="display:inline-block;background:#FFD700;color:#000;font-weight:800;font-size:13px;padding:12px 24px;border-radius:30px;text-decoration:none">🔍 Проверить статус</a></td>
      <td style="padding:0 6px"><a href="${termsUrl}" style="display:inline-block;background:#1e1e1e;color:#aaa;border:1px solid #333;font-size:13px;padding:12px 24px;border-radius:30px;text-decoration:none">📋 Условия гарантии</a></td>
    </tr></table>
    <div style="font-size:11px;color:#444;margin-top:12px">
      Статус ремонта: <a href="${statusUrl}" style="color:#FFD700;text-decoration:none">${statusUrl}</a>
    </div>
  </td></tr>

  <!-- КОНТАКТЫ -->
  <tr><td style="background:#111;padding:16px 36px;border-top:1px solid #222">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-size:12px;color:#555;line-height:2">
        📍 г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
        📞 <a href="tel:+79929903333" style="color:#888;text-decoration:none">+7 (992) 990-33-33</a><br>
        🌐 <a href="${SITE_URL}" style="color:#FFD700;text-decoration:none">skypka24.com</a>
      </td>
      <td align="right" style="font-size:11px;color:#444;line-height:1.8">
        ИП Мамедов Адиль Мирза Оглы<br>ИНН: 402810962699<br>ОГРНИП: 307402814200032
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#0a0a0a;border-radius:0 0 16px 16px;padding:12px 36px;text-align:center">
    <div style="font-size:11px;color:#333">© 2025 Скупка24 · Все права защищены</div>
  </td></tr>

</table></td></tr></table></body></html>`;
};

const row = (label: string, value: string) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:6px"><tr>
    <td style="color:#888;font-size:13px;width:45%">${label}</td>
    <td style="color:#fff;font-size:13px;font-weight:600;text-align:right">${value}</td>
  </tr></table>`;

const divider = () => `<div style="height:1px;background:#2a2a2a;margin:10px 0"></div>`;

// ── 1. АКТ ПРИЁМКИ для email — полноценный table-based HTML без SVG/JS ──────
export const getIntakeActHtml = (o: Order): string => {
  const d = new Date(o.created_at);
  const dateStr = d.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const orderNum = String(o.id).padStart(6, "0");
  const statusUrl = `https://skypka24.com/repair-status?id=${o.id}`;
  const termsUrl  = "https://skypka24.com/act";

  const FUNCS = [
    "Кнопка Home","Кнопка Вкл./Выкл.","Изменение геометрии","Деформация корпуса",
    "Компас и гироскол","Кнопки громкости (меню)","Поиск сети",
    "Нижний микрофон (диктофон)","Полифонический динамик","Wi-Fi/Bluetooth",
    "Фонарик","Датчик приближения","Кнопки громкости (вызов)","Камера основная",
    "Чтение SIM-карты","Датчик освещённости","Дисплей (touch/экран/рамка)",
    "Сканер радужки глаз","Touch ID / Face ID","Беспроводная зарядка",
    "Слуховой динамик","Разъём зарядки","Переключатель вибро","Камера фронтальная",
    "Аудиоразъём (L/R)",
  ];

  const funcRows = FUNCS.map(f =>
    `<tr><td style="border:1px solid #ccc;padding:3px 6px;font-size:11px">${f}</td><td style="border:1px solid #ccc;padding:3px 6px;width:90px"></td></tr>`
  ).join("");

  // Схема телефона — простые прямоугольники вместо SVG (работают в email)
  const phoneDiagrams = `
<table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0">
<tr>
  <td style="text-align:center;padding:0 6px">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;width:54px;height:100px;border:2px solid #333;border-radius:6px;background:#f9f9f9">
      <tr><td style="height:10px;border-bottom:1px solid #ccc;font-size:7px;color:#777;text-align:center">────</td></tr>
      <tr><td style="height:72px"></td></tr>
      <tr><td style="height:18px;border-top:1px solid #ccc;text-align:center"><div style="width:16px;height:16px;border:1px solid #999;border-radius:50%;margin:1px auto"></div></td></tr>
    </table>
    <div style="font-size:8px;color:#666;margin-top:2px">Спереди</div>
  </td>
  <td style="text-align:center;padding:0 6px">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;width:54px;height:100px;border:2px solid #333;border-radius:6px;background:#f9f9f9">
      <tr><td style="height:8px"></td></tr>
      <tr><td style="text-align:center"><div style="width:22px;height:22px;border:1px solid #999;border-radius:4px;margin:0 auto"></div></td></tr>
      <tr><td style="height:60px"></td></tr>
    </table>
    <div style="font-size:8px;color:#666;margin-top:2px">Сзади</div>
  </td>
  <td style="text-align:center;padding:0 6px">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;width:20px;height:100px;border:2px solid #333;border-radius:4px;background:#f9f9f9">
      <tr><td></td></tr>
    </table>
    <div style="font-size:8px;color:#666;margin-top:2px">Слева</div>
  </td>
  <td style="text-align:center;padding:0 6px">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;width:100px;height:20px;border:2px solid #333;border-radius:4px;background:#f9f9f9">
      <tr><td></td></tr>
    </table>
    <div style="font-size:8px;color:#666;margin-top:2px">Снизу</div>
  </td>
</tr>
</table>`;

  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><title>Акт приёмки №${o.id}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:16px 8px">
<tr><td align="center">
<table width="700" cellpadding="0" cellspacing="0" style="max-width:700px;width:100%;background:#fff;border:1px solid #ccc">

  <!-- ШАПКА -->
  <tr>
    <td style="padding:12px 16px;border-bottom:2px solid #000">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:180px;padding:6px;border:1px solid #ccc;text-align:center;vertical-align:middle">
          <div style="font-size:18px;font-weight:900;letter-spacing:2px">СКУПКА<span style="color:#b8860b">24</span></div>
          <div style="font-size:9px;color:#777;margin-top:2px">ВНИМАНИЕ! Оплата производится только в сервисном центре при получении заказа.</div>
        </td>
        <td style="text-align:center;padding:8px;vertical-align:middle">
          <div style="font-size:14px;font-weight:bold">Акт приёма — передачи</div>
          <div style="font-size:11px;color:#555">устройства в ремонт</div>
          <div style="font-size:16px;font-weight:bold;margin-top:4px">№ ${orderNum}</div>
          <div style="font-size:11px;color:#333">от ${dateStr}</div>
        </td>
        <td style="width:200px;padding:6px;border:1px solid #ccc;font-size:10px;line-height:1.7;vertical-align:top">
          <b style="font-size:11px">Исполнитель:</b><br>
          ИП Мамедов Адиль Мирза Оглы<br>
          ИНН: 402810962699<br>
          ОГРНИП: 307402814200032<br>
          г. Калуга, ул. Кирова, 7/47 и 11<br>
          Тел.: +7 (992) 990-33-33<br>
          skypka24.com
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- КЛИЕНТ / УСТРОЙСТВО / РЕМОНТ -->
  <tr>
    <td style="padding:0;border-bottom:1px solid #000">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:33%;padding:8px 10px;border-right:1px solid #ccc;vertical-align:top">
          <div style="font-size:10px;font-weight:bold;background:#efefef;padding:2px 4px;margin-bottom:6px;border-bottom:1px solid #ccc">Клиент:</div>
          <div style="font-size:9px;color:#555">ФИО Клиента:</div>
          <div style="font-size:12px;font-weight:bold;margin-bottom:8px">${o.name}</div>
          <div style="font-size:9px;color:#555">Телефон Клиента:</div>
          <div style="font-size:12px;font-weight:bold">${o.phone || "—"}</div>
          ${o.client_email ? `<div style="font-size:9px;color:#555;margin-top:4px">Email:</div><div style="font-size:11px">${o.client_email}</div>` : ""}
        </td>
        <td style="width:33%;padding:8px 10px;border-right:1px solid #ccc;vertical-align:top">
          <div style="font-size:10px;font-weight:bold;background:#efefef;padding:2px 4px;margin-bottom:6px;border-bottom:1px solid #ccc">Устройство:</div>
          <div style="font-size:9px;color:#555">Устройство:</div>
          <div style="font-size:12px;font-weight:bold;margin-bottom:4px">${o.model || "—"}</div>
          <div style="font-size:9px;color:#555">Внешний вид:</div>
          <div style="font-size:10px">Царапины, потёртости, возможны скрытые дефекты</div>
        </td>
        <td style="width:34%;padding:8px 10px;vertical-align:top">
          <div style="font-size:10px;font-weight:bold;background:#efefef;padding:2px 4px;margin-bottom:6px;border-bottom:1px solid #ccc">Ремонт:</div>
          <div style="font-size:9px;color:#555">Ориентировочная стоимость:</div>
          <div style="font-size:13px;font-weight:bold;margin-bottom:4px">${o.price ? o.price.toLocaleString("ru-RU") + " ₽" : "По договорённости"}</div>
          <div style="font-size:9px;color:#555">Аванс:</div>
          <div style="font-size:11px;margin-bottom:4px">0</div>
          <div style="font-size:9px;color:#555">Ориентировочный срок:</div>
          <div style="font-size:10px;margin-bottom:4px">По договорённости</div>
          <div style="font-size:9px;color:#555">Заявленные неисправности:</div>
          <div style="font-size:11px;font-weight:bold">${o.comment || o.repair_type || "—"}</div>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- НАРУЖНЫЕ ПОВРЕЖДЕНИЯ + ФУНКЦИИ -->
  <tr>
    <td style="padding:0;border-bottom:1px solid #000">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="width:50%;padding:8px 10px;border-right:1px solid #ccc;vertical-align:top">
          <div style="font-size:10px;font-weight:bold;margin-bottom:4px">Наружные повреждения</div>
          <div style="font-size:8px;color:#777;margin-bottom:6px">Отметить на схеме: * – скол, / – вмятина, v – царапина</div>
          ${phoneDiagrams}
        </td>
        <td style="width:50%;padding:8px 10px;vertical-align:top">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr>
              <th style="border:1px solid #ccc;padding:3px 6px;font-size:10px;background:#efefef;text-align:left">Проверка функций</th>
              <th style="border:1px solid #ccc;padding:3px 6px;font-size:10px;background:#efefef;width:90px">До ремонта</th>
            </tr>
            ${funcRows}
          </table>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- ПРАВИЛА -->
  <tr>
    <td style="padding:10px 14px;border-bottom:1px solid #000">
      <div style="font-size:10px;font-weight:bold;margin-bottom:6px">Правила и условия проведения ремонтных работ</div>
      <ol style="margin:0;padding-left:16px;font-size:9px;line-height:1.7;color:#222">
        <li>Правила изложены на сайте <b>skypka24.com/act</b></li>
        <li>Устройство Клиента принимается без разборки и проверки внутренних неисправностей.</li>
        <li>Клиент согласен с тем, что гарантия от производителя после произведённого ремонта не возможна.</li>
        <li>Клиент принимает на себя риск, связанный с возможным проявлением скрытых дефектов.</li>
        <li>Ремонт осуществляется в соответствии с ГОСТ Р МЭК 60065-2002, 60950-2002 и ФЗ «О защите прав потребителей».</li>
        <li>Установленные узлы и расходные материалы возврату не подлежат.</li>
        <li>Исполнитель не несёт ответственности за сохранность гарантийных пломб сторонних сервисных центров.</li>
      </ol>
    </td>
  </tr>

  <!-- КНОПКИ -->
  <tr>
    <td style="padding:14px;text-align:center;background:#f9f9f9;border-bottom:1px solid #ddd">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
        <td style="padding:0 6px">
          <a href="${statusUrl}" style="display:inline-block;background:#FFD700;color:#000;font-weight:900;font-size:13px;padding:12px 24px;border-radius:30px;text-decoration:none;letter-spacing:0.5px">🔍 Статус ремонта</a>
        </td>
        <td style="padding:0 6px">
          <a href="${termsUrl}" style="display:inline-block;background:#fff;color:#333;border:2px solid #ccc;font-size:13px;font-weight:700;padding:10px 22px;border-radius:30px;text-decoration:none">📋 Условия гарантии</a>
        </td>
      </tr></table>
      <div style="font-size:10px;color:#999;margin-top:8px">
        Статус ремонта онлайн: <a href="${statusUrl}" style="color:#b8860b">${statusUrl}</a>
      </div>
    </td>
  </tr>

  <!-- ПОДВАЛ -->
  <tr>
    <td style="background:#111;padding:14px 20px;border-radius:0 0 4px 4px">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:11px;color:#888;line-height:2">
          📍 г. Калуга, ул. Кирова, 7/47 и ул. Кирова, 11<br>
          📞 <a href="tel:+79929903333" style="color:#aaa;text-decoration:none">+7 (992) 990-33-33</a> · 
          🌐 <a href="https://skypka24.com" style="color:#FFD700;text-decoration:none">skypka24.com</a>
        </td>
        <td style="font-size:10px;color:#555;text-align:right;line-height:1.8">
          ИП Мамедов Адиль Мирза Оглы<br>
          ИНН: 402810962699 · ОГРНИП: 307402814200032
        </td>
      </tr></table>
    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`;
};

// ── 2. АКТ ГОТОВНОСТИ — отправляется при статусе «Готов» ───────────────────
export const getReadyActHtml = (o: Order): string => {
  const body = `
    ${row("№ заявки", `#${o.id}`)}
    ${o.model ? row("Устройство", o.model) : ""}
    ${divider()}
    ${o.repair_type ? row("Выполненные работы", o.repair_type) : ""}
    ${o.parts_name ? row("Замененные запчасти", o.parts_name) : ""}
    ${divider()}
    ${row("Стоимость ремонта", `${(o.repair_amount || 0).toLocaleString("ru-RU")} ₽`)}
    ${o.advance ? row("Аванс", `${o.advance.toLocaleString("ru-RU")} ₽`) : ""}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>
      <td style="padding:10px 12px;background:#1a2a1a;border-radius:8px;border-left:3px solid #4ade80;font-size:13px;color:#4ade80;font-weight:600">
        ✅ Ваше устройство готово! Ждём вас в офисе.
      </td>
    </tr></table>`;
  return emailWrap("Ваш ремонт готов!", "✅ Ремонт готов", body, o);
};

// ── 3. ГАРАНТИЙНЫЙ ЧЕК — отправляется при выдаче / при приёмке ─────────────
export const getWarrantyActHtml = (o: Order): string => {
  const isWater = /вода|влага|залит|liquid|water/i.test((o.repair_type || "") + " " + (o.comment || ""));
  const warrantyBlock = isWater
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>
        <td style="padding:10px 12px;background:#2a1a1a;border-radius:8px;border-left:3px solid #f87171;font-size:12px;color:#f87171">
          ⚠️ <strong>Гарантия не предоставляется</strong><br>Ремонт после воздействия влаги/жидкости
        </td>
      </tr></table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr>
        <td style="padding:12px;background:#1a1f2a;border-radius:8px;border:1px solid #FFD700/30;font-size:12px;color:#aaa;line-height:2">
          <div style="font-size:13px;font-weight:700;color:#FFD700;margin-bottom:6px">🛡 Гарантия: 30 дней</div>
          • Гарантия на выполненные работы и установленные запчасти<br>
          • Не распространяется на механические повреждения<br>
          • Не распространяется на попадание влаги<br>
          • При нарушении пломб гарантия аннулируется<br>
          • Полные условия: <a href="${SITE_URL}/act" style="color:#FFD700">${SITE_URL}/act</a>
        </td>
      </tr></table>`;
  const body = `
    ${row("№ заявки", `#${o.id}`)}
    ${o.model ? row("Устройство", o.model) : ""}
    ${o.repair_type ? row("Вид работы", o.repair_type) : ""}
    ${o.parts_name ? row("Запчасти", o.parts_name) : ""}
    ${divider()}
    ${row("Итого оплачено", `${(o.repair_amount || 0).toLocaleString("ru-RU")} ₽`)}
    ${warrantyBlock}`;
  return emailWrap("Гарантийный талон", "🛡 Гарантия", body, o);
};

// ── Старый getReceiptHtml — оставляем для совместимости (при выдаче) ────────
export const getReceiptHtml = (o: Order): string => getWarrantyActHtml(o);

// ── Отправка одного письма ──────────────────────────────────────────────────
const sendOneEmail = async (
  email: string, token: string,
  checkHtml: string, checkType: string,
  orderId: number, clientName: string, subject?: string,
): Promise<void> => {
  const res = await fetch(SEND_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Token": token },
    body: JSON.stringify({ email, check_html: checkHtml, check_type: checkType, order_id: orderId, client_name: clientName, subject }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.sent) throw new Error(data.error || "Ошибка отправки");
};

// ── Отправка 3 документов при приёмке ──────────────────────────────────────
export const sendIntakeEmailBundle = async (o: Order, email: string, token: string): Promise<void> => {
  await Promise.all([
    sendOneEmail(email, token, getIntakeActHtml(o),   "repair", o.id, o.name, `Акт приёмки #${o.id} — ${o.model || o.name}`),
    sendOneEmail(email, token, getWarrantyActHtml(o), "repair", o.id, o.name, `Условия гарантии — ${o.model || o.name}`),
  ]);
};

// ── Отправка чека при готовности ────────────────────────────────────────────
export const sendReadyEmail = async (o: Order, email: string, token: string): Promise<void> => {
  await sendOneEmail(email, token, getReadyActHtml(o), "repair", o.id, o.name, `Ремонт готов! Заявка #${o.id}`);
};

// ── Ручная отправка чека (из карточки) ─────────────────────────────────────
export const sendReceiptByEmail = async (o: Order, email: string, token: string): Promise<void> => {
  await sendOneEmail(email, token, getWarrantyActHtml(o), "repair", o.id, o.name, `Чек ремонта #${o.id} — ${o.model || o.name}`);
};
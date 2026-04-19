export const REPAIR_URL = "https://functions.poehali.dev/a105aede-d55d-4b99-9d3e-5e977887aa04";

export const STATUSES = [
  { key: "new", label: "Принята", color: "bg-white/10 text-white/70", dot: "bg-white/40" },
  { key: "in_progress", label: "В работе", color: "bg-blue-500/20 text-blue-400", dot: "bg-blue-400" },
  { key: "waiting_parts", label: "Ждём запчасть", color: "bg-orange-500/20 text-orange-400", dot: "bg-orange-400" },
  { key: "ready", label: "Готово ✓", color: "bg-yellow-500/20 text-[#FFD700]", dot: "bg-[#FFD700]" },
  { key: "done", label: "Выдано", color: "bg-green-500/20 text-green-400", dot: "bg-green-400" },
  { key: "cancelled", label: "Отменено", color: "bg-red-500/20 text-red-400", dot: "bg-red-400" },
];

export type Order = {
  id: number; name: string; phone: string; model: string | null;
  repair_type: string | null; price: number | null; status: string;
  admin_note: string | null; created_at: string; comment: string | null;
  purchase_amount: number | null; repair_amount: number | null; completed_at: string | null;
  master_income: number | null; parts_name: string | null; picked_up_at: string | null;
};

export type DayStat = {
  day: string; total: number; done: number; cancelled: number;
  revenue: number; costs: number; profit: number; master_income: number;
};

export const EMPTY_FORM = { name: "", phone: "", model: "", repair_type: "", price: "", comment: "" };
export const EMPTY_COMPLETE = { purchase_amount: "", repair_amount: "", parts_name: "" };

export const statusInfo = (key: string) => STATUSES.find(s => s.key === key) || STATUSES[0];

export const fmt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })
    + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const fmtDay = (day: string) => {
  const d = new Date(day);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", weekday: "short" });
};

export const INP = "w-full bg-[#0D0D0D] border border-[#333] text-white px-3 py-2 font-roboto text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-white/20";
export const LBL = "font-roboto text-white/40 text-[10px] block mb-1";

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
                new Paragraph({ spacing: { before: 0, after: 20 }, children: [n("г. Калуга, ул. Кирова, 21а", 17)] }),
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

export const printActHTML = (o: Order) => {
  const now = new Date(o.created_at);
  const dateStr = now.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  // Номер заявки в формате штрихкода: дополняем нулями до 12 символов (EAN-13 стиль)
  const barNum = String(o.id).padStart(12, "0");

  // Иконки устройств — SVG-схемы (телефон, ноутбук, планшет)
  const phoneViewsSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" style="width:100%;max-width:480px">
  <!-- Телефон спереди -->
  <g transform="translate(10,10)">
    <rect x="20" y="0" width="80" height="150" rx="10" ry="10" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="30" y="12" width="60" height="115" fill="none" stroke="#000" stroke-width="1"/>
    <ellipse cx="60" cy="8" rx="8" ry="2.5" fill="none" stroke="#000" stroke-width="1"/>
    <circle cx="60" cy="143" r="5" fill="none" stroke="#000" stroke-width="1"/>
    <text x="60" y="180" text-anchor="middle" font-size="9" fill="#000">Спереди</text>
  </g>
  <!-- Телефон сзади -->
  <g transform="translate(120,10)">
    <rect x="20" y="0" width="80" height="150" rx="10" ry="10" fill="none" stroke="#000" stroke-width="2"/>
    <circle cx="45" cy="20" r="10" fill="none" stroke="#000" stroke-width="1.5"/>
    <circle cx="45" cy="20" r="6" fill="none" stroke="#000" stroke-width="1"/>
    <text x="60" y="180" text-anchor="middle" font-size="9" fill="#000">Сзади</text>
  </g>
  <!-- Телефон слева -->
  <g transform="translate(230,10)">
    <rect x="38" y="0" width="24" height="150" rx="5" ry="5" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="28" y="35" width="8" height="25" rx="2" fill="none" stroke="#000" stroke-width="1.5"/>
    <rect x="28" y="65" width="8" height="25" rx="2" fill="none" stroke="#000" stroke-width="1.5"/>
    <rect x="64" y="45" width="8" height="35" rx="2" fill="none" stroke="#000" stroke-width="1.5"/>
    <text x="50" y="180" text-anchor="middle" font-size="9" fill="#000">Слева</text>
  </g>
  <!-- Телефон снизу -->
  <g transform="translate(310,50)">
    <rect x="10" y="30" width="130" height="30" rx="8" ry="8" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="55" y="38" width="40" height="14" rx="3" fill="none" stroke="#000" stroke-width="1"/>
    <rect x="20" y="35" width="5" height="20" rx="2" fill="none" stroke="#000" stroke-width="1"/>
    <rect x="30" y="35" width="5" height="20" rx="2" fill="none" stroke="#000" stroke-width="1"/>
    <text x="75" y="80" text-anchor="middle" font-size="9" fill="#000">Снизу</text>
  </g>
</svg>`;

  const laptopViewsSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 200" style="width:100%;max-width:480px">
  <!-- Ноутбук спереди открытый -->
  <g transform="translate(5,5)">
    <rect x="5" y="5" width="130" height="90" rx="4" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="10" y="10" width="120" height="80" fill="none" stroke="#000" stroke-width="1"/>
    <rect x="0" y="96" width="140" height="12" rx="2" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="50" y="99" width="40" height="6" rx="2" fill="none" stroke="#000" stroke-width="1"/>
    <text x="70" y="125" text-anchor="middle" font-size="9" fill="#000">Спереди</text>
  </g>
  <!-- Ноутбук сзади закрытый -->
  <g transform="translate(170,5)">
    <rect x="5" y="5" width="130" height="12" rx="4" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="0" y="20" width="140" height="85" rx="4" fill="none" stroke="#000" stroke-width="2"/>
    <text x="70" y="125" text-anchor="middle" font-size="9" fill="#000">Сзади</text>
  </g>
  <!-- Ноутбук сбоку -->
  <g transform="translate(335,40)">
    <rect x="60" y="5" width="12" height="65" rx="2" fill="none" stroke="#000" stroke-width="2"/>
    <rect x="30" y="70" width="80" height="12" rx="2" fill="none" stroke="#000" stroke-width="2"/>
    <line x1="60" y1="70" x2="72" y2="70" stroke="#000" stroke-width="1"/>
    <text x="66" y="100" text-anchor="middle" font-size="9" fill="#000">Сбоку</text>
  </g>
</svg>`;

  const checkItems = [
    ["Кнопка питания", ""], ["Кнопки громкости", ""], ["Тачскрин", ""],
    ["Дисплей (пиксели/пятна)", ""], ["Основная камера", ""], ["Фронтальная камера", ""],
    ["Динамик разговорный", ""], ["Динамик основной", ""], ["Микрофон", ""],
    ["Wi-Fi", ""], ["Bluetooth", ""], ["Face ID / Touch ID", ""],
    ["Разъём зарядки", ""], ["Аккумулятор", ""], ["SIM-карта", ""],
  ];

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Акт приёма №${o.id}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#000;background:#fff;padding:12mm 10mm}
    .top-label{font-size:9px;text-align:right;margin-bottom:4px;color:#555}
    .header{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;border:1.5px solid #000;padding:8px 12px;margin-bottom:8px}
    .header-left{display:flex;flex-direction:column;gap:4px;min-width:160px}
    .barcode-block{display:flex;flex-direction:column;align-items:center}
    .barcode-block svg{height:48px}
    .barcode-num{font-size:10px;letter-spacing:1px;margin-top:1px}
    .warn-box{border:1.5px solid #000;padding:4px 8px;font-size:9px;font-weight:bold;max-width:170px;margin-top:4px;line-height:1.4}
    .header-center{text-align:center;flex:1}
    .act-title{font-size:16px;font-weight:bold;margin-bottom:2px}
    .act-sub{font-size:10px;color:#333;margin-bottom:6px}
    .act-num{font-size:13px;font-weight:bold}
    .act-date{font-size:10px;margin-top:2px}
    .header-right{text-align:right;font-size:9px;line-height:1.7;min-width:200px}
    .header-right b{font-size:10px}
    .section{display:flex;gap:12px;margin-bottom:8px}
    .section-block{flex:1;border:1.5px solid #000}
    .section-block .head{background:#eee;padding:4px 8px;font-weight:bold;font-size:10px;border-bottom:1px solid #000}
    .section-block .body{padding:6px 8px}
    .field{margin-bottom:4px}
    .field .lbl{color:#555;font-size:9px}
    .field .val{font-weight:bold;font-size:11px}
    .field-line{display:flex;gap:6px;align-items:baseline}
    .damages-block{border:1.5px solid #000;margin-bottom:8px}
    .damages-block .head{background:#eee;padding:4px 8px;font-weight:bold;font-size:10px;border-bottom:1px solid #000}
    .damages-inner{display:flex;gap:0}
    .devices-col{flex:1.2;padding:8px;border-right:1px solid #ccc;display:flex;flex-direction:column;gap:4px;align-items:center}
    .devices-label{font-size:8px;color:#555;margin-bottom:2px}
    .check-col{flex:1;padding:8px}
    .check-table{width:100%;border-collapse:collapse;font-size:9px}
    .check-table th{background:#f0f0f0;border:1px solid #aaa;padding:3px 5px;text-align:left}
    .check-table td{border:1px solid #aaa;padding:3px 5px}
    .check-table td:last-child{width:90px;color:#555}
    .conditions{border:1.5px solid #000;margin-bottom:8px}
    .conditions .head{background:#eee;padding:4px 8px;font-weight:bold;font-size:10px;border-bottom:1px solid #000}
    .conditions ol{padding:6px 8px 6px 22px;font-size:9px;line-height:1.7}
    .signs{display:flex;gap:0;border:1.5px solid #000}
    .sign-cell{flex:1;padding:8px 12px;text-align:center}
    .sign-cell:first-child{border-right:1px solid #000}
    .sign-line-block{margin-top:24px;border-top:1px solid #000;padding-top:3px;font-size:9px;color:#555}
    .print-btn{text-align:center;padding:10px;margin-bottom:8px}
    @media print{.print-btn{display:none}.body{padding:0}html,body{padding:0;margin:0}}
  </style>
  </head><body>
  <div class="print-btn">
    <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;background:#FFD700;border:2px solid #000;font-weight:bold">🖨 Распечатать акт</button>
  </div>

  <div class="top-label">Экз. Клиента</div>

  <!-- ШАПКА -->
  <div class="header">
    <div class="header-left">
      <div class="barcode-block">
        <svg id="barcode"></svg>
        <div class="barcode-num">${barNum}</div>
      </div>
      <div class="warn-box">ВНИМАНИЕ! Оплата производится только в сервисном центре при получении заказа.</div>
    </div>
    <div class="header-center">
      <div class="act-title">Акт приёма — передачи</div>
      <div class="act-sub">устройства в ремонт</div>
      <div class="act-num">№ ${String(o.id).padStart(6, "0")}</div>
      <div class="act-date">от ${dateStr}, ${timeStr}</div>
    </div>
    <div class="header-right">
      <b>Исполнитель:</b><br>
      ИП Мамедов Адиль Мирза Оглы<br>
      ИНН: 402810962699<br>
      ОГРНИП: 307402814200032<br>
      г. Калуга, ул. Кирова, 21а<br>
      Тел.: +7 (992) 990-33-33<br>
      skypka24.com
    </div>
  </div>

  <!-- КЛИЕНТ / УСТРОЙСТВО / РЕМОНТ -->
  <div class="section">
    <div class="section-block">
      <div class="head">Клиент:</div>
      <div class="body">
        <div class="field"><div class="lbl">ФИО Клиента:</div><div class="val">${o.name}</div></div>
        <div class="field"><div class="lbl">Телефон Клиента:</div><div class="val">${o.phone}</div></div>
      </div>
    </div>
    <div class="section-block">
      <div class="head">Устройство:</div>
      <div class="body">
        <div class="field"><div class="lbl">Устройство:</div><div class="val">${o.model || "—"}</div></div>
        <div class="field"><div class="lbl">Описание неисправности:</div><div class="val">${o.comment || "—"}</div></div>
        <div class="field"><div class="lbl">Внешний вид:</div><div class="val">Царапины, потёртости, возможны скрытые дефекты</div></div>
      </div>
    </div>
    <div class="section-block">
      <div class="head">Ремонт:</div>
      <div class="body">
        <div class="field"><div class="lbl">Вид работ:</div><div class="val">${o.repair_type || "—"}</div></div>
        <div class="field"><div class="lbl">Ориентировочная стоимость:</div><div class="val">${o.price ? o.price.toLocaleString("ru-RU") + " ₽" : "По диагностике"}</div></div>
        <div class="field"><div class="lbl">Аванс:</div><div class="val">—</div></div>
        <div class="field"><div class="lbl">Ориентировочный срок:</div><div class="val">По договорённости</div></div>
      </div>
    </div>
  </div>

  <!-- НАРУЖНЫЕ ПОВРЕЖДЕНИЯ + ПРОВЕРКА ФУНКЦИЙ -->
  <div class="damages-block">
    <div class="head">Наружные повреждения &amp; Проверка функций</div>
    <div class="damages-inner">
      <div class="devices-col">
        <div class="devices-label">Отметить на схеме: * – скол, / – вмятина, v – царапина</div>
        ${phoneViewsSVG}
        ${laptopViewsSVG}
      </div>
      <div class="check-col">
        <table class="check-table">
          <thead><tr><th>Функция</th><th>До ремонта</th></tr></thead>
          <tbody>
            ${checkItems.map(([name]) => `<tr><td>${name}</td><td>Проверка невозможна</td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- УСЛОВИЯ -->
  <div class="conditions">
    <div class="head">Условия ремонта — клиент ознакомлен и согласен</div>
    <ol>
      <li>Правила и условия проведения ремонтных работ изложены на сайте <a href="https://skypka24.com/act" target="_blank">skypka24.com/act</a></li>
      <li>Устройство Клиента принимается без разборки и проверки внутренних неисправностей.</li>
      <li>Клиент согласен с тем, что гарантия от производителя после произведенного ремонта не возможна.</li>
      <li>Клиент принимает на себя риск, связанный с возможным проявлением при ремонте скрытых дефектов, имеющихся в устройстве на момент приемки от клиента, которые невозможно проверить и зафиксировать в данном документе (наличие следов коррозии, попадания влаги, посторонних предметов, следов механических повреждений и прочих непредусмотренных производителем в устройство и его компоненты).</li>
      <li>Ремонт и обслуживание осуществляется в соответствии с требованиями нормативных документов, в том числе ГОСТ Р МЭК 60065-2002, ГОСТ Р МЭК 60950-2002, ГОСТ Р 50936-2013, ГОСТ Р 57137-2016, ГОСТ Р 50938-2013 и согласно Федеральному закону «О защите прав потребителей».</li>
      <li>Установленные узлы и расходные материалы возврату не подлежат согласно Перечню сложных технических товаров, не подлежащих обмену или возврату.</li>
      <li>Исполнитель не несет ответственности за сохранность гарантийных пломб сторонних сервисных центров и производителя устройства.</li>
      <li>Исполнитель не несет ответственности за возможную потерю информации на внутренних носителях устройства, связанную с заменой узлов и компонентов.</li>
      <li>Факт возврата устройства из ремонта фиксируется в форме ВО-13, которую исполнитель заполняет в двух экземплярах при возврате устройства клиенту.</li>
      <li>Клиент согласен с тем, что при ремонте устройства могут быть заменены компоненты, узлы, модули, влияющие на идентификацию IMEI номера устройства.</li>
      <li><b>Ремонт Устройств после попадания влаги.</b> В том случае, если Устройство Клиента подвергалось взаимодействию с водной средой, то в Устройстве возможны окисления мест соединения. Клиент согласен, что при обнаружении следов взаимодействия с водной средой есть риск выхода из строя многофункциональных шлейфов, а также других узлов Устройства (вибромотор, полифонический и слуховой динамики, кнопка Home с функцией Touch ID, основная камера, системы антенн и др.), за который Исполнитель ответственности не несет. Клиент уведомлен о вероятности самопроизвольного выхода из строя материнской платы (частично или полностью), потери или полной утраты функциональности Устройства, за который исполнитель ответственности не несет. Клиент предупрежден, что указанные неисправности могут проявиться как во время проведения ремонта, так и в течение трех месяцев после выдачи Устройства Клиенту.</li>
      <li><b>Ремонт Устройств, полностью или частично восстановленных с использованием неоригинальных комплектующих.</b> С Клиентом согласовано, что при проведении сложного ремонта в случае обнаружения на Устройстве установленных ранее неоригинальных комплектующих с нарушением заводских допусков в работоспособности и установке последних есть риск частичного или полного выхода из строя функциональных узлов (дисплейный модуль, системы антенн), за который Исполнитель ответственности не несет. Клиент согласен, что если Устройство ранее подвергалось некачественному ремонту в другом сервисном центре, то возможен риск выхода из строя материнской платы Устройства по одной из следующих причин: трещины в текстолите, отсутствие необходимых для работы микроэлементов на поверхности платы, нарушение системы пайки (BGA) микросхем на поверхности платы, за который Исполнитель ответственности не несет, равно как и за полный выход Устройства из строя без возможности его восстановления.</li>
      <li>Клиент согласен с тем, что Исполнитель не несет ответственности за возможную неработоспособность Устройства или его отдельных компонентов из-за невозможности проверки всех функций Устройства.</li>
    </ol>
  </div>

  <!-- ПОДПИСИ -->
  <div class="signs">
    <div class="sign-cell">
      <b>Исполнитель</b>
      <div class="sign-line-block">Устройство в указанном состоянии принял:</div>
      <div style="margin-top:4px;font-size:9px">_________________________ / _________________________</div>
      <div style="font-size:9px;color:#555;margin-top:2px">(подпись) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (расшифровка)</div>
    </div>
    <div class="sign-cell">
      <b>Клиент</b>
      <div class="sign-line-block">С условиями ознакомлен и согласен, устройство в ремонт передал:</div>
      <div style="margin-top:4px;font-size:9px">_________________________ / _________________________</div>
      <div style="font-size:9px;color:#555;margin-top:2px">(подпись) &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (расшифровка)</div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      JsBarcode("#barcode", "${barNum}", {
        format: "CODE128",
        width: 1.8,
        height: 50,
        displayValue: false,
        margin: 0,
      });
    });
  </script>
  </body></html>`);
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
      <div class="subtitle">ИП Мамедов Адиль Мирза Оглы · г.Калуга, ул.Кирова, 21а</div>
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
      <div class="subtitle">Скупка24 · г.Калуга, ул.Кирова, 21а</div>
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
        По вопросам: ул.Кирова, 21а, г.Калуга
      </div>
      <div class="sign-line"><span>Мастер</span><span>Клиент</span></div>
    </div>
  </div>
  </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};
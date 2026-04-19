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
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType, ShadingType } = await import("docx");
  const { saveAs } = await import("file-saver");

  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU");
  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  const bold = (text: string, size = 22) => new TextRun({ text, bold: true, size, font: "Times New Roman" });
  const normal = (text: string, size = 22) => new TextRun({ text, size, font: "Times New Roman" });

  const fieldRow = (label: string, value: string) => new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, font: "Times New Roman" }),
      new TextRun({ text: value, size: 22, font: "Times New Roman" }),
    ],
  });

  const riskItem = (n: number, text: string) => new Paragraph({
    spacing: { before: 100, after: 100 },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${n}. `, bold: true, size: 22, font: "Times New Roman" }),
      new TextRun({ text, size: 22, font: "Times New Roman" }),
    ],
  });

  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({ children: [
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [normal("  ")] })],
        }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [normal("")] })] }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" }, top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [normal("  ")] })],
        }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [normal("Мастер (подпись / ФИО)", 18)] })] }),
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ children: [normal("")] })] }),
        new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [normal("Клиент (подпись / ФИО)", 18)] })] }),
      ]}),
    ],
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1701, right: 850 },
        },
      },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [bold("АКТ ПРИЁМКИ НА РЕМОНТ ТЕХНИЧЕСКОГО ОБОРУДОВАНИЯ", 28)] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [normal(`№ ${o.id}`, 24)] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [normal(`г. Калуга, ${dateStr}   ${timeStr}`, 22)] }),

        new Paragraph({ spacing: { after: 60 }, children: [bold("Исполнитель: "), normal("ИП Мамедов Адиль Мирза Оглы, ИНН 402810962699, г. Калуга, ул. Кирова, 21а")] }),
        fieldRow("Заказчик (клиент): ", o.name),
        fieldRow("Телефон: ", o.phone),
        ...(o.model ? [fieldRow("Устройство: ", o.model)] : []),
        ...(o.repair_type ? [fieldRow("Вид работ: ", o.repair_type)] : []),
        ...(o.price ? [fieldRow("Предварительная стоимость: ", `${o.price.toLocaleString("ru-RU")} руб.`)] : []),
        ...(o.comment ? [fieldRow("Описание неисправности: ", o.comment)] : []),

        new Paragraph({ spacing: { before: 300, after: 160 }, children: [bold("УСЛОВИЯ РЕМОНТА — КЛИЕНТ ОЗНАКОМЛЕН И СОГЛАСЕН:", 24)] }),

        new Paragraph({
          spacing: { after: 160 },
          border: { top: { style: BorderStyle.SINGLE, size: 6 }, bottom: { style: BorderStyle.SINGLE, size: 6 }, left: { style: BorderStyle.SINGLE, size: 6 }, right: { style: BorderStyle.SINGLE, size: 6 } },
          shading: { type: ShadingType.CLEAR, fill: "FFF9E6" },
          children: [bold("! ВНИМАТЕЛЬНО ПРОЧИТАЙТЕ ПЕРЕД ПОДПИСЬЮ", 22)],
          alignment: AlignmentType.CENTER,
        }),

        riskItem(1, "После контакта с водой аппарат может полностью выйти из строя при любом виде ремонта (чистка, прогрев, пайка). Мастерская не несёт ответственности и не обязана восстанавливать устройство."),
        riskItem(2, "Компонентная пайка сопряжена с риском безвозвратного повреждения платы. Если телефон перестал включаться в процессе выполнения ремонта — работа оплачивается в полном объёме."),
        riskItem(3, "При снятии дисплея возможно его повреждение: появление полос, артефактов, отказ включения. Замена повреждённого дисплея производится исключительно за счёт клиента."),
        riskItem(4, "Все пользовательские данные (фотографии, контакты, переписка и пр.) могут быть безвозвратно утеряны в процессе ремонта. Мастерская не занимается восстановлением данных. Подписывая настоящий акт, клиент подтверждает, что самостоятельно создал резервную копию, либо согласен на безвозвратную потерю данных."),
        riskItem(5, "Гарантия на результат ремонта не предоставляется. В худшем случае устройство будет возвращено клиенту в нерабочем состоянии; при этом клиент обязуется оплатить стоимость диагностики и всех уже выполненных работ."),

        new Paragraph({ spacing: { before: 400, after: 200 }, children: [normal("Подписывая настоящий акт, клиент подтверждает, что ознакомлен со всеми условиями, рисками и добровольно соглашается на проведение ремонта.", 20)] }),

        signTable,

        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [normal("ИНН: 402810962699  ·  ОГРНИП: 307402814200032  ·  Р/с: 40802810422270001866", 18)] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [normal("КАЛУЖСКОЕ ОТДЕЛЕНИЕ N8608 ПАО СБЕРБАНК  ·  БИК: 042908612  ·  К/с: 30101810100000000612", 18)] }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Акт_приёмки_${o.id}_${o.name.replace(/\s+/g, "_")}.docx`);
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
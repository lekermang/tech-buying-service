import { useCallback } from "react";
import { REPAIR_URL, Order, EMPTY_FORM, printReceipt, printAct, sendIntakeEmailBundle } from "../types";
import { Period, EditForm } from "./staffTabTypes";
import { useStaffToast } from "../../staff/StaffToast";
import { humanizeError } from "./humanizeError";
import type { StaffRepairState } from "./useStaffRepairState";

/**
 * Все действия (actions) вкладки StaffRepair: загрузки, создание/сохранение/смена статуса/удаление.
 * Вынесено из StaffRepairTab.tsx 1:1 без изменения логики.
 */
export function useStaffRepairActions(token: string, st: StaffRepairState) {
  const toast = useStaffToast();
  const headers = { "Content-Type": "application/json", "X-Employee-Token": token };

  const {
    setLoading, setOrders,
    filterStatus, debouncedSearch, dateFrom, dateTo,
    setAnalyticsLoading, setAnalytics, setStats,
    form, setForm, setCreating, setShowForm,
    editForm,
    setSaving, setSaveError,
    setExpandedId,
    setReadyModal, setReadyForm, setReadyError, setReadySaving,
    readyModal, readyForm, saveError,
  } = st;

  // ─── Загрузка заявок ─────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const ps: string[] = [];
    if (filterStatus !== "all") ps.push("status=" + filterStatus);
    if (debouncedSearch.trim()) ps.push("search=" + encodeURIComponent(debouncedSearch.trim()));
    if (dateFrom) ps.push("date_from=" + dateFrom);
    if (dateTo) ps.push("date_to=" + dateTo);
    const url = REPAIR_URL + (ps.length ? "?" + ps.join("&") : "");
    try {
      const res = await fetch(url, { headers: { "X-Employee-Token": token }, signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        toast.error(humanizeError({ action: "load", httpStatus: res.status, serverError: data.error }));
        return;
      }
      setOrders(data.orders || []);
    } catch (e) {
      if ((e as { name?: string })?.name !== "AbortError") {
        toast.error(humanizeError({ action: "load", thrown: e }));
      }
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, debouncedSearch, dateFrom, dateTo, toast, setLoading, setOrders]);

  // ─── Загрузка аналитики ───────────────────────────────────────────────────────
  // Для period='custom' опционально передаём произвольный диапазон через df/dt (YYYY-MM-DD).
  const loadAnalytics = useCallback(async (p: Period, signal?: AbortSignal, df?: string, dt?: string) => {
    setAnalyticsLoading(true);
    try {
      const ps: string[] = [`action=analytics`, `period=${p}`];
      if (p === "custom") {
        if (df) ps.push(`date_from=${df}`);
        if (dt) ps.push(`date_to=${dt}`);
      }
      const [analyticsRes, statsRes] = await Promise.all([
        fetch(`${REPAIR_URL}?${ps.join("&")}`, { headers: { "X-Employee-Token": token }, signal }),
        fetch(`${REPAIR_URL}?action=daily_stats`, { headers: { "X-Employee-Token": token }, signal }),
      ]);
      const [analyticsD, statsD] = await Promise.all([analyticsRes.json(), statsRes.json()]);
      setAnalytics(analyticsD);
      setStats(statsD.stats || []);
    } catch (_) {
      /* abort/network */
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token, setAnalyticsLoading, setAnalytics, setStats]);

  // ─── Создать заявку ───────────────────────────────────────────────────────────
  const createOrder = async () => {
    if (!form.name || !form.phone) {
      toast.warning("Укажите имя клиента и телефон");
      return;
    }
    setCreating(true);
    const tid = toast.loading("Создаю заявку...");
    // Аккуратно парсим price: пустая строка / нечисло -> null (а не NaN)
    let priceNum: number | null = null;
    if (form.price !== undefined && form.price !== null && String(form.price).trim() !== "") {
      const cleaned = String(form.price).replace(/[^\d.-]/g, "");
      const n = parseInt(cleaned, 10);
      priceNum = Number.isFinite(n) ? n : null;
    }
    try {
      const payload = { action: "new_order", ...form, price: priceNum };
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify(payload),
      });
      let data: { order_id?: number; error?: string } = {};
      try { data = await res.json(); } catch { /* not json */ }
      if (data.order_id) {
        const email = (form.client_email || "").trim();
        toast.update(tid, { kind: "success", message: `Заявка #${data.order_id} создана${email ? " · отправляю документы" : ""}`, duration: 3000 });
        const newOrder: Order = {
          id: data.order_id, name: form.name, phone: form.phone,
          model: form.model || null, repair_type: form.repair_type || null,
          price: priceNum,
          comment: form.comment || null, status: "new",
          admin_note: null, created_at: new Date().toISOString(),
          purchase_amount: null, repair_amount: null,
          completed_at: null, master_income: null, parts_name: null, picked_up_at: null,
          advance: null, is_paid: null, payment_method: null,
          client_email: email || null,
          device_password: form.device_password || null,
        };
        printAct(newOrder);
        if (email) {
          sendIntakeEmailBundle(newOrder, email, token)
            .then(() => toast.success(`Акты отправлены на ${email}`))
            .catch(() => toast.warning("Заявка создана, но письмо не отправилось"));
        }
        setShowForm(false);
        setForm(EMPTY_FORM);
        loadOrders();
      } else {
        toast.update(tid, {
          kind: "error",
          message: humanizeError({ action: "create", httpStatus: res.status, serverError: data.error }),
          duration: 7000,
        });
      }
    } catch (e) {
      toast.update(tid, {
        kind: "error",
        message: humanizeError({ action: "create", thrown: e }),
        duration: 7000,
      });
    } finally {
      setCreating(false);
    }
  };

  // ─── Сохранить поля карточки ─────────────────────────────────────────────────
  const saveCard = async (o: Order) => {
    const ef = editForm[o.id];
    if (!ef) return;
    setSaving(true);
    setSaveError(null);
    const body: Record<string, unknown> = { id: o.id };
    if (ef.admin_note !== undefined) body.admin_note = ef.admin_note;
    if (ef.purchase_amount !== "") body.purchase_amount = parseInt(ef.purchase_amount);
    if (ef.repair_amount !== "") body.repair_amount = parseInt(ef.repair_amount);
    if (ef.parts_name) body.parts_name = ef.parts_name;
    body.advance = ef.advance ? parseInt(ef.advance) : 0;
    body.is_paid = ef.is_paid;
    body.payment_method = ef.payment_method || null;
    // Поля заявки
    body.name = ef.name; body.phone = ef.phone;
    body.model = ef.model || null; body.repair_type = ef.repair_type || null;
    body.price = ef.price ? parseInt(ef.price) : null;
    body.comment = ef.comment || null;
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        const msg = humanizeError({ action: "save", httpStatus: res.status, serverError: data.error });
        setSaveError(msg);
        toast.error(msg);
        return;
      }
      toast.success(`Заявка #${o.id} сохранена`);
      setExpandedId(null);
      loadOrders();
    } catch (e) {
      const msg = humanizeError({ action: "save", thrown: e });
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Изменить статус ─────────────────────────────────────────────────────────
  const STATUS_LABELS: Record<string, string> = {
    new: "Принят",
    pending_approval: "На согласование (мастеру отправлено в Telegram)",
    accepted: "Принят мастером",
    in_progress: "В работе",
    waiting_parts: "Ждёт запчасть",
    ready: "Готов (клиенту отправлена SMS)",
    done: "Выдан клиенту",
    warranty: "На гарантии",
    cancelled: "Отменён",
    refused: "Отказ",
  };
  const changeStatus = async (id: number, status: string, extra?: Record<string, unknown>) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ id, status, ...(extra || {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        const msg = humanizeError({ action: "status", httpStatus: res.status, serverError: data.error });
        setSaveError(msg);
        toast.error(msg);
        return false;
      }
      toast.success(`#${id}: ${STATUS_LABELS[status] || status}`);
      loadOrders();
      return true;
    } catch (e) {
      const msg = humanizeError({ action: "status", thrown: e });
      setSaveError(msg);
      toast.error(msg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // ─── Открыть модалку «Готово» ────────────────────────────────────────────────
  const openReadyModal = (o: Order) => {
    setReadyModal(o);
    setReadyForm({
      purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
      repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
      parts_name: o.parts_name || "",
      admin_note: o.admin_note || "",
    });
    setReadyError(null);
  };

  // ─── Выдать клиенту ──────────────────────────────────────────────────────────
  const issueOrder = async (o: Order, issuedAt?: string) => {
    // Жёсткая валидация: для «Выдано» обязательны суммы и дата выдачи
    const ef = editForm[o.id];
    const purchaseStr = ef?.purchase_amount ?? (o.purchase_amount != null ? String(o.purchase_amount) : "");
    const repairStr   = ef?.repair_amount   ?? (o.repair_amount   != null ? String(o.repair_amount)   : "");
    const purchaseOk  = purchaseStr !== "" && !Number.isNaN(parseInt(purchaseStr));
    const repairOk    = repairStr !== ""   && parseInt(repairStr) > 0;
    const dateOk      = !!issuedAt;

    if (!purchaseOk || !repairOk || !dateOk) {
      const missing: string[] = [];
      if (!repairOk)   missing.push("сумму выдачи (ремонт)");
      if (!purchaseOk) missing.push("сумму закупки");
      if (!dateOk)     missing.push("дату выдачи");
      toast.warning(
        `Нельзя выдать заявку #${o.id}: укажите ${missing.join(", ")} — это нужно для статистики`,
        { title: "Заполните обязательные поля", duration: 6000 },
      );
      // Открываем модалку «Готово» — там удобно ввести закупку/выдачу/запчасть
      openReadyModal(o);
      return;
    }

    const extra: Record<string, unknown> = { picked_up_at: new Date(issuedAt!).toISOString() };
    extra.purchase_amount = parseInt(purchaseStr);
    extra.repair_amount   = parseInt(repairStr);
    if (ef?.parts_name) extra.parts_name = ef.parts_name;
    await changeStatus(o.id, "done", extra);
    printReceipt({ ...o, status: "done" });
  };

  // ─── Удалить заявку ──────────────────────────────────────────────────────────
  const deleteOrder = async (id: number) => {
    if (!confirm(`Удалить заявку #${id}?`)) return;
    const tid = toast.loading(`Удаляю заявку #${id}...`);
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.error == null) {
        toast.update(tid, { kind: "success", message: `Заявка #${id} удалена`, duration: 3000 });
        loadOrders();
      } else {
        toast.update(tid, {
          kind: "error",
          message: humanizeError({ action: "delete", httpStatus: res.status, serverError: data.error }),
          duration: 6000,
        });
      }
    } catch (e) {
      toast.update(tid, {
        kind: "error",
        message: humanizeError({ action: "delete", thrown: e }),
        duration: 6000,
      });
    }
  };

  // ─── Подтвердить «Готово» ────────────────────────────────────────────────────
  // Цены НЕ обязательны: можно нажать «Готов» без закупки/выдачи —
  // клиенту автоматически уйдёт СМС о готовности (бэкенд решает шаблон).
  // Финальные суммы вводятся уже при выдаче (статус «Выдано»).
  const submitReady = async () => {
    if (!readyModal) return;
    setReadySaving(true);
    const extra: Record<string, unknown> = { admin_note: readyForm.admin_note };
    const purchaseNum = parseInt(readyForm.purchase_amount);
    const repairNum = parseInt(readyForm.repair_amount);
    if (readyForm.purchase_amount !== "" && !Number.isNaN(purchaseNum)) {
      extra.purchase_amount = purchaseNum;
    }
    if (readyForm.repair_amount !== "" && !Number.isNaN(repairNum)) {
      extra.repair_amount = repairNum;
    }
    if (readyForm.parts_name) {
      extra.parts_name = readyForm.parts_name;
    }
    const ok = await changeStatus(readyModal.id, "ready", extra);
    setReadySaving(false);
    if (ok) {
      const hasAmount = extra.repair_amount != null;
      toast.success(
        hasAmount
          ? `📲 Клиенту отправлено СМС о готовности${extra.repair_amount ? ` (${extra.repair_amount} ₽)` : ""}`
          : "📲 Клиенту отправлено СМС о готовности",
        { duration: 4000 },
      );
      setReadyModal(null);
      setExpandedId(null);
    } else {
      // saveError уже содержит человекочитаемое сообщение из changeStatus
      setReadyError(saveError || humanizeError({ action: "ready" }));
    }
  };

  // ─── Ручной звонок роботом «Ремонт готов» ────────────────────────────────────
  const callRobotReady = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "call_ready", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false || data.error) {
        toast.error(data.error || "Не удалось дозвониться роботом");
        return false;
      }
      toast.success(`#${id}: робот звонит клиенту`);
      return true;
    } catch (e) {
      toast.error(humanizeError({ action: "status", thrown: e }));
      return false;
    }
  };

  // ─── Пригласить клиента в MAX из карточки ремонта ────────────────────────────
  const inviteToMax = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(REPAIR_URL, {
        method: "POST", headers,
        body: JSON.stringify({ action: "invite_max", id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false || data.error) {
        toast.error(data.error || "Не удалось открыть MAX");
        return false;
      }
      if (data.max_url) {
        window.open(data.max_url as string, "_blank");
      }
      const sub = data.sms_sent ? " (SMS отправлена)" : "";
      toast.success(`#${id}: MAX открыт${sub}`);
      return true;
    } catch (e) {
      toast.error(humanizeError({ action: "status", thrown: e }));
      return false;
    }
  };

  // ─── Инициализация формы редактирования ──────────────────────────────────────
  const initEditForm = (o: Order): EditForm => ({
    name: o.name, phone: o.phone,
    model: o.model || "", repair_type: o.repair_type || "",
    price: o.price ? String(o.price) : "",
    comment: o.comment || "", admin_note: o.admin_note || "",
    purchase_amount: o.purchase_amount != null ? String(o.purchase_amount) : "",
    repair_amount: o.repair_amount != null ? String(o.repair_amount) : "",
    parts_name: o.parts_name || "",
    advance: o.advance != null ? String(o.advance) : "",
    is_paid: o.is_paid ?? false,
    payment_method: o.payment_method || "",
  });

  return {
    loadOrders, loadAnalytics,
    createOrder, saveCard, changeStatus,
    issueOrder, deleteOrder,
    openReadyModal, submitReady,
    callRobotReady,
    inviteToMax,
    initEditForm,
  };
}

export type StaffRepairActions = ReturnType<typeof useStaffRepairActions>;
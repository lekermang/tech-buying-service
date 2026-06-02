import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: string | null };

// Корневой предохранитель для всего раздела Staff.
// Если что-то крашит рендер (особенно на мобильных) — показываем
// понятный экран с ошибкой вместо чёрного/белого экрана.
export default class StaffRootBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(e: Error) {
    return { error: e?.message || "Неизвестная ошибка" };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Попадёт в логи фронтенда — поможет точно увидеть причину
    console.error("[StaffRootBoundary]", error?.message, error?.stack, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleLogout = () => {
    try {
      localStorage.removeItem("employee_token");
      localStorage.removeItem("employee_name");
      localStorage.removeItem("employee_role");
    } catch { /* ignore */ }
    window.location.href = "/staff";
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            background: "#050403",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            color: "#fff",
            fontFamily: "'Roboto', sans-serif",
          }}
        >
          <div style={{ fontSize: "44px", marginBottom: "12px" }}>🛠️</div>
          <div
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: "20px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              marginBottom: "8px",
            }}
          >
            Что-то пошло не так
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", maxWidth: "320px", marginBottom: "20px" }}>
            Приложение не смогло открыться. Попробуйте обновить страницу.
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "11px",
              maxWidth: "320px",
              marginBottom: "24px",
              wordBreak: "break-word",
            }}
          >
            {this.state.error}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={this.handleReload}
              style={{
                background: "#FFD700",
                color: "#000",
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "12px 22px",
                borderRadius: "12px",
                fontSize: "14px",
              }}
            >
              Обновить
            </button>
            <button
              onClick={this.handleLogout}
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
                padding: "12px 22px",
                borderRadius: "12px",
                fontSize: "14px",
              }}
            >
              Выйти
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

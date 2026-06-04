import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const NotFound404 = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 — Страница не найдена | Скупка24 Калуга";

    let meta = document.getElementById("meta-404-robots") as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.id = "meta-404-robots";
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";

    return () => {
      document.getElementById("meta-404-robots")?.remove();
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Упс! Страница не найдена</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Вернуться на главную
        </a>
      </div>
    </div>
  );
};

export default NotFound404;

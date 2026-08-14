"use client";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  return visible ? (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 rounded-full bg-indigo-600 p-3 text-white shadow-lg transition hover:bg-indigo-700 animate-in fade-in zoom-in-95 duration-200"
      aria-label="Voltar ao topo"
    >
      <ArrowUp size={20} />
    </button>
  ) : null;
}

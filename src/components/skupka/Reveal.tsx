import { createElement } from "react";
import { useReveal } from "@/hooks/useReveal";

interface RevealProps {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
}

const Reveal = ({ children, delay = 0, className = "", as = "div" }: RevealProps) => {
  const { ref, visible } = useReveal();
  const delayClass = delay > 0 ? `reveal-delay-${delay}` : "";

  return createElement(
    as,
    {
      ref,
      className: `reveal ${visible ? "is-visible" : ""} ${delayClass} ${className}`,
    },
    children,
  );
};

export default Reveal;
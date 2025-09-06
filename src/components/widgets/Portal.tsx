"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: React.ReactNode;
  /** target DOM element */
  target?: HTMLElement | null;
  /** id of element (will query with document.getElementById) */
  targetId?: string;
}

export function Portal({ children, target, targetId }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (target) {
      setElement(target);
    } else if (targetId) {
      setElement(document.getElementById(targetId));
    } else {
      setElement(document.body);
    }
  }, [target, targetId]);

  if (!mounted || !element) return null;

  return createPortal(children, element);
}

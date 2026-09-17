"use client";

import * as React from "react";

/**
 * Hook to manage the hidden 5-click in ~3 seconds trigger on the VEDA SETU logo.
 * Does not interfere with normal single-click navigation or home links.
 */
export function useAdminTrigger() {
  const [isAdminModalOpen, setIsAdminModalOpen] = React.useState(false);
  const clickCountRef = React.useRef(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = React.useCallback((e: React.MouseEvent) => {
    clickCountRef.current += 1;

    // Start or renew 3-second window
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
        timerRef.current = null;
      }, 3000);
    }

    // On 5th click within the window, open modal and stop navigation
    if (clickCountRef.current >= 5) {
      e.preventDefault();
      e.stopPropagation();
      clickCountRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsAdminModalOpen(true);
    }
  }, []);

  return {
    isAdminModalOpen,
    closeAdminModal: () => setIsAdminModalOpen(false),
    handleLogoClick,
  };
}

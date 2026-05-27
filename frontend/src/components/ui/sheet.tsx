"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Sheet({ open, onOpenChange, children, className, side = "left" }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right";
}) {
  // Prevent body scroll when sheet is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className={cn("fixed inset-0 z-50", open ? "" : "pointer-events-none")}>
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ease-out",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          "absolute top-0 h-full w-[280px] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          side === "left" ? "left-0" : "right-0",
          open 
            ? "translate-x-0" 
            : side === "left" ? "-translate-x-full" : "translate-x-full",
          className
        )}
        style={{
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRight: side === "left" ? '1px solid var(--sidebar-border)' : 'none',
          borderLeft: side === "right" ? '1px solid var(--sidebar-border)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export { Sheet }

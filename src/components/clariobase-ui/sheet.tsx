"use client";

import * as Dialog from "@radix-ui/react-dialog";
import React from "react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetPortal = Dialog.Portal;
const SheetClose = Dialog.Close;
const SheetTitle = Dialog.Title;
const SheetDescription = Dialog.Description;

const SheetOverlay = forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-[color:var(--cb-ui-foreground)]/25 backdrop-blur-[1px] transition data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = Dialog.Overlay.displayName;

const SheetContent = forwardRef<
  React.ElementRef<typeof Dialog.Content>,
  React.ComponentPropsWithoutRef<typeof Dialog.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <Dialog.Content
      ref={ref}
      data-slot="sheet-content"
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-[min(88vw,320px)] max-w-[calc(100vw-1rem)] flex-col border-r border-[color:var(--cb-ui-border)] bg-[color:var(--cb-ui-card)] shadow-[0_18px_48px_rgba(15,23,42,0.16)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </SheetPortal>
));
SheetContent.displayName = Dialog.Content.displayName;

const SheetCloseButton = forwardRef<
  React.ElementRef<typeof Dialog.Close>,
  React.ComponentPropsWithoutRef<typeof Dialog.Close>
>(({ className, children, ...props }, ref) => (
  <Dialog.Close
    ref={ref}
    data-slot="sheet-close"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-[var(--cb-ui-radius-md)] border border-transparent px-3 text-sm font-semibold text-[color:var(--cb-ui-muted-foreground)] transition hover:bg-[color:var(--cb-ui-surface)] hover:text-[color:var(--cb-ui-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-ui-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-ui-card)]",
      className
    )}
    {...props}
  >
    {children}
  </Dialog.Close>
));
SheetCloseButton.displayName = Dialog.Close.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetCloseButton as SheetClose,
  SheetTitle,
  SheetDescription
};

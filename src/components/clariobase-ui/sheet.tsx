"use client";

import * as Dialog from "@radix-ui/react-dialog";
import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetPortal = Dialog.Portal;

const SheetTrigger = forwardRef<
  React.ElementRef<typeof Dialog.Trigger>,
  React.ComponentPropsWithoutRef<typeof Dialog.Trigger>
>(({ children, ...props }, ref) => (
  <Dialog.Trigger ref={ref} data-slot="sheet-trigger" {...props}>
    {children}
  </Dialog.Trigger>
));
SheetTrigger.displayName = Dialog.Trigger.displayName;

const SheetOverlay = forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...props }, ref) => (
  <Dialog.Overlay
    ref={ref}
    data-slot="sheet-overlay"
    className={cn(
      "fixed inset-0 z-50 bg-[color:var(--cb-foreground)]/25 opacity-0 transition-opacity duration-200 data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
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
        "fixed inset-y-0 left-0 z-50 flex h-full w-[min(88vw,320px)] max-w-[calc(100vw-1rem)] -translate-x-full transform-gpu flex-col border-r border-[color:var(--cb-border)] bg-[color:var(--cb-elevated-surface)] shadow-[0_18px_48px_rgba(15,23,42,0.16)] outline-none transition-transform duration-200 data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full",
        className
      )}
      {...props}
    >
      {children}
    </Dialog.Content>
  </SheetPortal>
));
SheetContent.displayName = Dialog.Content.displayName;

const SheetClose = forwardRef<
  React.ElementRef<typeof Dialog.Close>,
  React.ComponentPropsWithoutRef<typeof Dialog.Close>
>(({ className, children, ...props }, ref) => (
  <Dialog.Close
    ref={ref}
    data-slot="sheet-close"
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-[var(--cb-radius-md)] border border-transparent px-3 text-sm font-semibold text-[color:var(--cb-muted-foreground)] transition hover:bg-[color:var(--cb-surface)] hover:text-[color:var(--cb-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-elevated-surface)]",
      className
    )}
    {...props}
  >
    {children}
  </Dialog.Close>
));
SheetClose.displayName = Dialog.Close.displayName;

const SheetTitle = forwardRef<
  React.ElementRef<typeof Dialog.Title>,
  React.ComponentPropsWithoutRef<typeof Dialog.Title>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    data-slot="sheet-title"
    className={cn("text-base font-semibold text-[color:var(--cb-foreground)]", className)}
    {...props}
  />
));
SheetTitle.displayName = Dialog.Title.displayName;

const SheetDescription = forwardRef<
  React.ElementRef<typeof Dialog.Description>,
  React.ComponentPropsWithoutRef<typeof Dialog.Description>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    data-slot="sheet-description"
    className={cn("mt-1 text-sm text-[color:var(--cb-muted-foreground)]", className)}
    {...props}
  />
));
SheetDescription.displayName = Dialog.Description.displayName;

export { Sheet, SheetPortal, SheetTrigger, SheetOverlay, SheetContent, SheetClose, SheetTitle, SheetDescription };

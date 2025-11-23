import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({ className, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-background p-4 shadow-lg outline-none",
          className
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("space-y-1.5", className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title className={cn("text-sm font-medium", className)} {...props} />
  )
}

export function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description className={cn("text-xs text-muted-foreground", className)} {...props} />
  )
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("mt-3 flex justify-end gap-2", className)} {...props} />
}
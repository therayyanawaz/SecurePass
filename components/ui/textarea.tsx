import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground/90 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-[22px] border bg-background/82 px-4 py-3 text-base shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)] transition-[color,box-shadow,border-color,background-color] outline-none hover:border-primary/20 hover:bg-background focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/40 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

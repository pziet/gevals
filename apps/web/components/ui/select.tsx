"use client" // import statement

import * as React from "react" // import statement
import * as SelectPrimitive from "@radix-ui/react-select" // import statement
import { Check, ChevronDown } from "lucide-react" // import statement
import { cn } from "@/lib/utils" // import statement

const Select = SelectPrimitive.Root // constant declaration

const SelectGroup = SelectPrimitive.Group // constant declaration

const SelectValue = SelectPrimitive.Value // constant declaration

const SelectTrigger = React.forwardRef< // constant declaration
  React.ElementRef<typeof SelectPrimitive.Trigger>, // statement
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> // statement
>(({ className, children, ...props }, ref) => ( // JSX markup
  <SelectPrimitive.Trigger // JSX markup
    ref={ref} // statement
    className={cn( // statement
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", // statement
      className // statement
    )} // close component
    {...props} // statement
  > // JSX markup
    {children} // statement
    <ChevronDown className="h-4 w-4 opacity-50" /> // JSX markup
  </SelectPrimitive.Trigger> // JSX markup
)) // close component
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName // statement

const SelectContent = React.forwardRef< // constant declaration
  React.ElementRef<typeof SelectPrimitive.Content>, // statement
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> // statement
>(({ className, children, position = "popper", ...props }, ref) => ( // JSX markup
  <SelectPrimitive.Portal> // JSX markup
    <SelectPrimitive.Content // JSX markup
      ref={ref} // statement
      className={cn( // statement
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", // statement
        position === "popper" && // statement
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", // statement
        className // statement
      )} // close component
      position={position} // statement
      {...props} // statement
    > // JSX markup
      <SelectPrimitive.Viewport // JSX markup
        className={cn( // statement
          "p-1", // statement
          position === "popper" && // statement
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]" // statement
        )} // close component
      > // JSX markup
        {children} // statement
      </SelectPrimitive.Viewport> // JSX markup
    </SelectPrimitive.Content> // JSX markup
  </SelectPrimitive.Portal> // JSX markup
)) // close component
SelectContent.displayName = SelectPrimitive.Content.displayName // statement

const SelectItem = React.forwardRef< // constant declaration
  React.ElementRef<typeof SelectPrimitive.Item>, // statement
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> // statement
>(({ className, children, ...props }, ref) => ( // JSX markup
  <SelectPrimitive.Item // JSX markup
    ref={ref} // statement
    className={cn( // statement
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", // statement
      className // statement
    )} // close component
    {...props} // statement
  > // JSX markup
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"> // JSX markup
      <SelectPrimitive.ItemIndicator> // JSX markup
        <Check className="h-4 w-4" /> // JSX markup
      </SelectPrimitive.ItemIndicator> // JSX markup
    </span> // JSX markup

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText> // JSX markup
  </SelectPrimitive.Item> // JSX markup
)) // close component
SelectItem.displayName = SelectPrimitive.Item.displayName // statement

const SelectLabel = React.forwardRef< // constant declaration
  React.ElementRef<typeof SelectPrimitive.Label>, // statement
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <SelectPrimitive.Label // JSX markup
    ref={ref} // statement
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} // statement
    {...props} // statement
  /> // statement
)) // close component
SelectLabel.displayName = SelectPrimitive.Label.displayName // statement

export { // export statement
  Select, // statement
  SelectGroup, // statement
  SelectValue, // statement
  SelectTrigger, // statement
  SelectContent, // statement
  SelectItem, // statement
  SelectLabel, // statement
} // statement

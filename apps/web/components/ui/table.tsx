import * as React from "react" // import statement

import { cn } from "@/lib/utils" // import statement

const Table = React.forwardRef< // constant declaration
  HTMLTableElement, // statement
  React.HTMLAttributes<HTMLTableElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <div className="relative w-full overflow-auto"> // JSX markup
    <table // JSX markup
      ref={ref} // statement
      className={cn("w-full caption-bottom text-sm", className)} // statement
      {...props} // statement
    /> // statement
  </div> // JSX markup
)) // close component
Table.displayName = "Table" // component display name

const TableHeader = React.forwardRef< // constant declaration
  HTMLTableSectionElement, // statement
  React.HTMLAttributes<HTMLTableSectionElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} /> // JSX markup
)) // close component
TableHeader.displayName = "TableHeader" // component display name

const TableBody = React.forwardRef< // constant declaration
  HTMLTableSectionElement, // statement
  React.HTMLAttributes<HTMLTableSectionElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <tbody // JSX markup
    ref={ref} // statement
    className={cn("[&_tr:last-child]:border-0", className)} // statement
    {...props} // statement
  /> // statement
)) // close component
TableBody.displayName = "TableBody" // component display name

const TableFooter = React.forwardRef< // constant declaration
  HTMLTableSectionElement, // statement
  React.HTMLAttributes<HTMLTableSectionElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <tfoot // JSX markup
    ref={ref} // statement
    className={cn( // statement
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", // statement
      className // statement
    )} // close component
    {...props} // statement
  /> // statement
)) // close component
TableFooter.displayName = "TableFooter" // component display name

const TableRow = React.forwardRef< // constant declaration
  HTMLTableRowElement, // statement
  React.HTMLAttributes<HTMLTableRowElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <tr // JSX markup
    ref={ref} // statement
    className={cn( // statement
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", // statement
      className // statement
    )} // close component
    {...props} // statement
  /> // statement
)) // close component
TableRow.displayName = "TableRow" // component display name

const TableHead = React.forwardRef< // constant declaration
  HTMLTableCellElement, // statement
  React.ThHTMLAttributes<HTMLTableCellElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <th // JSX markup
    ref={ref} // statement
    className={cn( // statement
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", // statement
      className // statement
    )} // close component
    {...props} // statement
  /> // statement
)) // close component
TableHead.displayName = "TableHead" // component display name

const TableCell = React.forwardRef< // constant declaration
  HTMLTableCellElement, // statement
  React.TdHTMLAttributes<HTMLTableCellElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <td // JSX markup
    ref={ref} // statement
    className={cn( // statement
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", // statement
      className // statement
    )} // close component
    {...props} // statement
  /> // statement
)) // close component
TableCell.displayName = "TableCell" // component display name

const TableCaption = React.forwardRef< // constant declaration
  HTMLTableCaptionElement, // statement
  React.HTMLAttributes<HTMLTableCaptionElement> // statement
>(({ className, ...props }, ref) => ( // JSX markup
  <caption // JSX markup
    ref={ref} // statement
    className={cn("mt-4 text-sm text-muted-foreground", className)} // statement
    {...props} // statement
  /> // statement
)) // close component
TableCaption.displayName = "TableCaption" // component display name

export { // export statement
  Table, // statement
  TableHeader, // statement
  TableBody, // statement
  TableFooter, // statement
  TableHead, // statement
  TableRow, // statement
  TableCell, // statement
  TableCaption, // statement
} // statement

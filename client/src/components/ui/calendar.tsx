import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <div className="calendar-container relative bg-white rounded-md overflow-visible">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3 relative bg-white", className)}
        classNames={{
          root: "w-full relative",
          months: "flex flex-col space-y-4",
          month: "space-y-2",
          caption: "flex justify-center relative items-center h-9",
          caption_label: "text-sm font-medium w-full text-center",
          nav: "flex items-center absolute inset-0 justify-between",
          nav_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-7 w-7 bg-transparent p-0 hover:opacity-100 focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "flex w-full",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-xs text-center",
          row: "flex w-full mt-1",
          cell: "relative p-0 text-center focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground"
          ),
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          day_today: "bg-accent/30 text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-30",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4 text-gray-600" />,
          IconRight: () => <ChevronRight className="h-4 w-4 text-gray-600" />,
        }}
        {...props}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

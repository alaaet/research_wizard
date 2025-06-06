import * as React from "react"
import { addDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
  align?: "start" | "center" | "end"
  placeholderText?: string
  presets?: Array<{ label: string; days: number }>
}

export function DatePickerWithRange({
  date,
  setDate,
  className,
  align = "start",
  placeholderText,
  presets
}: DatePickerWithRangeProps) {
  const { t } = useTranslation();
  
  const defaultPlaceholderText = t('datePicker.selectDates');
  const defaultPresets = [
    { label: t('datePicker.presets.7days'), days: 7 },
    { label: t('datePicker.presets.30days'), days: 30 },
    { label: t('datePicker.presets.90days'), days: 90 }
  ];
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                  {format(date.to, "dd/MM/yyyy", { locale: fr })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: fr })
              )
            ) : (
              <span>{placeholderText || defaultPlaceholderText}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={fr}
          />
          <div className="flex justify-end gap-2 p-3 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDate(undefined)}
              className="text-xs"
            >
              {t('datePicker.clear')}
            </Button>
            {(presets || defaultPresets).map((preset, i) => (
              <Button 
                key={i}
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date()
                  setDate({
                    from: addDays(today, -preset.days),
                    to: today,
                  })
                }}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

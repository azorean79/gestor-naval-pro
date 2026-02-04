'use client'

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateInputProps {
  value?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  className?: string
}

export function DateInput({
  value,
  onValueChange,
  placeholder = "Selecione DD/MM/AAAA",
  className,
}: DateInputProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDay, setSelectedDay] = React.useState<string>("")
  const [selectedMonth, setSelectedMonth] = React.useState<string>("")
  const [selectedYear, setSelectedYear] = React.useState<string>("")

  // Initialize from value if provided
  React.useEffect(() => {
    if (value && value.match(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/)) {
      const [day, month, year] = value.split('/')
      setSelectedDay(day)
      setSelectedMonth(month)
      setSelectedYear(year)
    }
  }, [value])

  // Generate year options from 1990 to current year + 20
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1990 + 21 }, (_, i) => (1990 + i).toString())

  // Generate month options
  const months = [
    { value: "01", label: "01 - Janeiro" },
    { value: "02", label: "02 - Fevereiro" },
    { value: "03", label: "03 - Março" },
    { value: "04", label: "04 - Abril" },
    { value: "05", label: "05 - Maio" },
    { value: "06", label: "06 - Junho" },
    { value: "07", label: "07 - Julho" },
    { value: "08", label: "08 - Agosto" },
    { value: "09", label: "09 - Setembro" },
    { value: "10", label: "10 - Outubro" },
    { value: "11", label: "11 - Novembro" },
    { value: "12", label: "12 - Dezembro" },
  ]

  // Generate day options based on selected month and year
  const getDaysInMonth = (month: string, year: string) => {
    if (!month || !year) return 31
    const monthNum = parseInt(month)
    const yearNum = parseInt(year)
    return new Date(yearNum, monthNum, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear)
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = (i + 1).toString().padStart(2, '0')
    return { value: day, label: day }
  })

  const handleValueChange = (type: 'day' | 'month' | 'year', newValue: string) => {
    let newDay = selectedDay
    let newMonth = selectedMonth
    let newYear = selectedYear

    if (type === 'day') newDay = newValue
    if (type === 'month') newMonth = newValue
    if (type === 'year') newYear = newValue

    // Adjust day if it's invalid for the new month/year
    const maxDays = getDaysInMonth(newMonth, newYear)
    if (parseInt(newDay) > maxDays) {
      newDay = maxDays.toString().padStart(2, '0')
    }

    setSelectedDay(newDay)
    setSelectedMonth(newMonth)
    setSelectedYear(newYear)

    if (newDay && newMonth && newYear) {
      const formattedValue = `${newDay}/${newMonth}/${newYear}`
      onValueChange?.(formattedValue)
    } else {
      onValueChange?.(undefined)
    }
  }

  const displayValue = selectedDay && selectedMonth && selectedYear
    ? `${selectedDay}/${selectedMonth}/${selectedYear}`
    : ""

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-12",
            !displayValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Day */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Dia</label>
              <Select value={selectedDay} onValueChange={(value) => handleValueChange('day', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Dia" />
                </SelectTrigger>
                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Mês</label>
              <Select value={selectedMonth} onValueChange={(value) => handleValueChange('month', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Ano</label>
              <Select value={selectedYear} onValueChange={(value) => handleValueChange('year', value)}>
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent className="max-h-32">
                  {years.reverse().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
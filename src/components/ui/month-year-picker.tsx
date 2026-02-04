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

interface MonthYearPickerProps {
  value?: string
  onValueChange?: (value: string | undefined) => void
  placeholder?: string
  className?: string
}

export function MonthYearPicker({
  value,
  onValueChange,
  placeholder = "Selecione MM/AAAA",
  className,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedMonth, setSelectedMonth] = React.useState<string>("")
  const [selectedYear, setSelectedYear] = React.useState<string>("")

  // Initialize from value if provided
  React.useEffect(() => {
    if (value && value.match(/^(0[1-9]|1[0-2])\/\d{4}$/)) {
      const [month, year] = value.split('/')
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

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month)
    if (selectedYear) {
      const newValue = `${month}/${selectedYear}`
      onValueChange?.(newValue)
    }
  }

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    if (selectedMonth) {
      const newValue = `${selectedMonth}/${year}`
      onValueChange?.(newValue)
    }
  }

  const handleClear = () => {
    setSelectedMonth("")
    setSelectedYear("")
    onValueChange?.(undefined)
    setIsOpen(false)
  }

  const displayValue = value || (selectedMonth && selectedYear ? `${selectedMonth}/${selectedYear}` : "")

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Mês</label>
            <Select value={selectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Ano</label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="flex-1"
            >
              Limpar
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={!selectedMonth || !selectedYear}
            >
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MonthYearPickerProps {
    date: Date
    setDate: (date: Date) => void
}

export function MonthYearPicker({ date, setDate }: MonthYearPickerProps) {
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i)
    const months = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]

    const handleYearChange = (year: string) => {
        const newDate = new Date(date)
        newDate.setFullYear(parseInt(year))
        setDate(newDate)
    }

    const handleMonthChange = (monthIndex: string) => {
        const newDate = new Date(date)
        newDate.setMonth(parseInt(monthIndex))
        setDate(newDate)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="flex gap-2">
                    <Select
                        value={date.getMonth().toString()}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((month, index) => (
                                <SelectItem key={month} value={index.toString()}>
                                    {month}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={date.getFullYear().toString()}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PopoverContent>
        </Popover>
    )
}

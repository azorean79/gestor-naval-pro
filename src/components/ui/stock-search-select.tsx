"use client";

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Stock } from '@/lib/types';

interface StockSearchSelectProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  items: Stock[];
  disabled?: boolean;
  className?: string;
}

export function StockSearchSelect({
  value,
  onValueChange,
  placeholder = "Buscar item...",
  items,
  disabled = false,
  className,
}: StockSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const selectedItem = items.find(item => item.id === value);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter items based on search
  const filteredItems = items.filter(item => {
    if (!searchValue) return true;

    const search = searchValue.toLowerCase();
    return (
      item.nome?.toLowerCase().includes(search) ||
      item.descricao?.toLowerCase().includes(search) ||
      item.categoria?.toLowerCase().includes(search) ||
      item.fornecedor?.toLowerCase().includes(search)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-12", className)}
          disabled={disabled}
        >
          {selectedItem ? (
            <div className="flex items-center justify-between w-full">
              <span className="truncate">
                {selectedItem.nome}
              </span>
              <Badge variant={selectedItem.quantidade > 0 ? "default" : "destructive"} className="ml-2">
                {selectedItem.quantidade}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-4" align="start">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite nome ou categoria..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {filteredItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                Nenhum item encontrado.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent",
                    value === item.id && "bg-accent border-primary"
                  )}
                  onClick={() => {
                    onValueChange?.(item.id === value ? undefined : item.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === item.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {item.nome}
                      </span>
                      <div className="text-sm text-muted-foreground">
                        {item.categoria && <span>{item.categoria}</span>}
                        {item.fornecedor && <span> • {item.fornecedor}</span>}
                      </div>
                    </div>
                  </div>
                  <Badge variant={item.quantidade > 0 ? "default" : "destructive"}>
                    {item.quantidade} disp.
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
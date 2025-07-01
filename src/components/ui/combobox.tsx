"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    creatable?: boolean;
}

export function Combobox({ options, value, onChange, placeholder, searchPlaceholder, emptyMessage, creatable = false }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('');

  const handleSelect = (selectedValue: string) => {
    const newValue = selectedValue.toLowerCase() === value?.toLowerCase() ? "" : selectedValue;
    onChange(newValue);
    setInputValue("");
    setOpen(false);
  };

  const handleCreate = () => {
    if (inputValue) {
        onChange(inputValue);
        setInputValue("");
        setOpen(false);
    }
  };

  const getDisplayLabel = () => {
    if (!value) return placeholder || "Selecione uma opção...";
    const selectedOption = options.find((option) => option.value.toLowerCase() === value.toLowerCase());
    return selectedOption ? selectedOption.label : value;
  };

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{getDisplayLabel()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" style={{width: 'var(--radix-popover-trigger-width)'}}>
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder || "Buscar opção..."} 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && (
              <CommandEmpty>
                {creatable && inputValue ? (
                    <CommandItem onSelect={handleCreate}>
                        Criar e selecionar "{inputValue}"
                    </CommandItem>
                ) : (
                    emptyMessage || "Nenhuma categoria encontrada."
                )}
              </CommandEmpty>
            )}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

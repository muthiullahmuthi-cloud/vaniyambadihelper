"use client";

import { useRef, useState, useEffect, type KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";

interface Stop {
  id: string;
  name: string;
}

interface StopAutocompleteProps {
  placeholder?: string;
  icon?: React.ReactNode;
  value: string;
  onValueChange: (value: string, stopId?: string) => void;
}

export function StopAutocomplete({
  placeholder,
  icon,
  value,
  onValueChange,
}: StopAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<Stop[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      let { data } = await supabase
        .from("stops")
        .select("id, name")
        .ilike("name", `%${inputValue}%`)
        .limit(6)
        .order("name");

      if (!data || data.length === 0) {
        const { data: fuzzyData } = await supabase.rpc("search_stops_similar", {
          query: inputValue,
        });
        data = fuzzyData;
      }

      const stops = (data as Stop[]) || [];
      setSuggestions(stops);
      setIsOpen(stops.length > 0);
      setActiveIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [inputValue]);

  function select(stop: Stop) {
    setInputValue(stop.name);
    setSelectedId(stop.id);
    onValueChange(stop.name, stop.id);
    setIsOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleBlur() {
    if (!selectedId && suggestions.length > 0) {
      select(suggestions[0]);
    }
    setTimeout(() => setIsOpen(false), 150);
  }

  return (
    <div className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setSelectedId(undefined);
            onValueChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onBlur={handleBlur}
          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          autoComplete="off"
        />
      </div>
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((stop, index) => (
            <li
              key={stop.id}
              onMouseDown={(e) => {
                e.preventDefault();
                select(stop);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={
                "px-4 py-2.5 text-sm cursor-pointer transition-colors" +
                (index === activeIndex
                  ? " bg-primary/10 text-primary font-medium"
                  : " text-gray-700 hover:bg-gray-50")
              }
            >
              {stop.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

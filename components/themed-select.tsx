'use client'

import { Select } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import type { RefObject } from 'react'

type Props<Value extends string> = {
  id: string
  value: Value
  items: Readonly<Record<Value, string>>
  onChange: (value: Value) => void
  container: RefObject<HTMLElement | null>
}

export default function ThemedSelect<Value extends string>({ id, value, items, onChange, container }: Props<Value>) {
  return (
    <Select.Root<Value> value={value} items={items} onValueChange={(next) => {
      if (next !== null) onChange(next)
    }}>
      <Select.Trigger id={id} aria-labelledby={`${id}-label`} className="themed-select-trigger">
        <Select.Value className="themed-select-value" />
        <Select.Icon className="themed-select-chevron"><ChevronDown size={15} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container}>
        <Select.Positioner className="themed-select-positioner" sideOffset={6} align="start" alignItemWithTrigger={false}>
          <Select.Popup className="themed-select-popup">
            <Select.List className="themed-select-list">
              {(Object.keys(items) as Value[]).map((key) => (
                <Select.Item key={key} value={key} className="themed-select-item">
                  <Select.ItemText>{items[key]}</Select.ItemText>
                  <Select.ItemIndicator><Check size={15} aria-hidden="true" /></Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}

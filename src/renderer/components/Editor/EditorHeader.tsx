import { useState, useRef, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface EditorHeaderProps {
  readonly title: string
  readonly onTitleChange: (newTitle: string) => void
  readonly onEnter: () => void
}

export function EditorHeader({ title, onTitleChange, onEnter }: EditorHeaderProps) {
  const [value, setValue] = useState(title)
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(title)
  }, [title])

  const commitChange = useCallback(() => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed)
    } else {
      setValue(title)
    }
    setIsEditing(false)
  }, [value, title, onTitleChange])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitChange()
      onEnter()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setValue(title)
      setIsEditing(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div className="px-12 pt-8 pb-0">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setIsEditing(true)
        }}
        onBlur={commitChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsEditing(true)}
        className={cn(
          'h-auto w-full text-3xl font-semibold bg-transparent',
          'leading-tight',
          'border-0 border-b-2 rounded-none px-0 pb-2',
          'ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0',
          'transition-colors',
          isEditing ? 'border-b-primary/40' : 'border-b-transparent'
        )}
        spellCheck={false}
      />
    </div>
  )
}

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ShortcutHint } from '../shared/ShortcutHint'
import { cn } from '@/lib/utils'

interface NoteListSearchProps {
  readonly query: string
  readonly onChange: (query: string) => void
  readonly isSearching: boolean
}

export function NoteListSearch({ query, onChange, isSearching }: NoteListSearchProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
      <Input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Filter notes..."
        className={cn(
          'h-auto w-full pl-8 pr-3 py-1.5 text-sm rounded-lg no-drag',
          'bg-secondary/50 border-transparent',
          'focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0',
          isSearching && 'opacity-70'
        )}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <ShortcutHint shortcut="Mod+P" />
      </div>
    </div>
  )
}

import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult } from '@shared/types/search'

interface ResultsListProps {
  readonly results: readonly SearchResult[]
  readonly selectedIndex: number
  readonly onSelect: (id: string) => void
}

export function ResultsList({ results, selectedIndex, onSelect }: ResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Type to search your notes
      </div>
    )
  }

  return (
    <div className="px-2 pb-2">
      {results.map((result, i) => (
        <button
          key={result.id}
          onClick={() => onSelect(result.id)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md flex items-center gap-3',
            'transition-colors duration-75',
            i === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
          )}
        >
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {result.title}
            </p>
            {result.excerpt && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{result.excerpt}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

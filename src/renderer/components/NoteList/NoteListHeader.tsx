import { ArrowUpDown } from 'lucide-react'
import { useUiStore } from '../../stores/ui.store'
import { Button } from '@/components/ui/button'

const SORT_LABELS = {
  modified: 'Modified',
  created: 'Created',
  title: 'Title'
} as const

const SORT_CYCLE: readonly ('modified' | 'created' | 'title')[] = ['modified', 'created', 'title']

export function NoteListHeader() {
  const sortBy = useUiStore((s) => s.sortBy)
  const sortDirection = useUiStore((s) => s.sortDirection)
  const setSortBy = useUiStore((s) => s.setSortBy)
  const toggleSortDirection = useUiStore((s) => s.toggleSortDirection)

  function cycleSortBy() {
    const currentIndex = SORT_CYCLE.indexOf(sortBy)
    const next = SORT_CYCLE[(currentIndex + 1) % SORT_CYCLE.length]
    setSortBy(next)
  }

  return (
    <div className="px-3 pb-2 flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleSortBy}
        className="h-7 px-2 text-xs text-muted-foreground no-drag"
      >
        {SORT_LABELS[sortBy]}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSortDirection}
        className="h-6 w-6 text-muted-foreground no-drag"
        title={sortDirection === 'asc' ? 'Oldest first' : 'Newest first'}
      >
        <ArrowUpDown className="h-3 w-3" />
      </Button>
    </div>
  )
}

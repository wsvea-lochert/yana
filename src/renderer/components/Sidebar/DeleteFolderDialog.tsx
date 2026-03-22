import { useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import type { Folder } from '@shared/types/folder'

const isMac = navigator.platform.includes('Mac')
const modSymbol = isMac ? '\u2318' : 'Ctrl'

interface DeleteFolderDialogProps {
  readonly folder: Folder
  readonly noteCount: number
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onDeleteKeepNotes: () => void
  readonly onDeleteWithNotes: () => void
}

export function DeleteFolderDialog({
  folder,
  noteCount,
  open,
  onOpenChange,
  onDeleteKeepNotes,
  onDeleteWithNotes
}: DeleteFolderDialogProps) {
  const handleKeep = useCallback(() => {
    onDeleteKeepNotes()
    onOpenChange(false)
  }, [onDeleteKeepNotes, onOpenChange])

  const handleAll = useCallback(() => {
    onDeleteWithNotes()
    onOpenChange(false)
  }, [onDeleteWithNotes, onOpenChange])

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'd') {
        e.preventDefault()
        handleKeep()
      } else if (mod && e.key === 'a' && noteCount > 0) {
        e.preventDefault()
        handleAll()
      } else if (mod && e.key === 'n') {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, noteCount, handleKeep, handleAll, handleCancel])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Delete folder</DialogTitle>
          <DialogDescription>
            {noteCount > 0
              ? `Are you sure you want to delete \u201c${folder.name}\u201d? It contains ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}.`
              : `Are you sure you want to delete \u201c${folder.name}\u201d?`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          {noteCount > 0 && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Delete folder only</p>
                <p className="text-xs text-muted-foreground">Notes will be moved to root</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleKeep}>
                Delete
                <Kbd className="ml-1.5 text-[10px] h-auto py-0.5 bg-background/10 text-muted-foreground">
                  {modSymbol} + D
                </Kbd>
              </Button>
            </div>
          )}
          {noteCount > 0 && (
            <div className="flex items-center justify-between rounded-md border border-destructive/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-destructive">Delete everything</p>
                <p className="text-xs text-muted-foreground">Folder and all {noteCount} {noteCount === 1 ? 'note' : 'notes'}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleAll}>
                Delete all
                <Kbd className="ml-1.5 text-[10px] h-auto py-0.5 bg-white/15 text-destructive-foreground">
                  {modSymbol} + A
                </Kbd>
              </Button>
            </div>
          )}
          {noteCount === 0 && (
            <DialogFooter>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
                <Kbd className="ml-2 text-[10px] h-auto py-0.5 bg-background/10 text-muted-foreground">
                  {modSymbol} + N
                </Kbd>
              </Button>
              <Button variant="destructive" onClick={handleKeep}>
                Delete
                <Kbd className="ml-2 text-[10px] h-auto py-0.5 bg-white/15 text-destructive-foreground">
                  {modSymbol} + D
                </Kbd>
              </Button>
            </DialogFooter>
          )}
          {noteCount > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground self-start" onClick={handleCancel}>
              Cancel
              <Kbd className="ml-1.5 text-[10px] h-auto py-0.5">Esc</Kbd>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

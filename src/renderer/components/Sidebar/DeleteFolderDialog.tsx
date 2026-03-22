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
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        handleKeep()
      } else if ((e.key === 'a' || e.key === 'A') && noteCount > 0) {
        e.preventDefault()
        handleAll()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, noteCount, handleKeep, handleAll, handleCancel])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete "{folder.name}"?</DialogTitle>
          <DialogDescription>
            {noteCount > 0
              ? `This folder contains ${noteCount} ${noteCount === 1 ? 'note' : 'notes'}.`
              : 'This folder is empty.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button variant="destructive" className="w-full gap-2" onClick={handleKeep}>
            Delete folder
            <Kbd className="text-[10px] ml-auto">D</Kbd>
          </Button>
          {noteCount > 0 && (
            <Button variant="destructive" className="w-full gap-2" onClick={handleAll}>
              Delete folder and all notes
              <Kbd className="text-[10px] ml-auto">A</Kbd>
            </Button>
          )}
          <Button variant="ghost" className="w-full gap-2" onClick={handleCancel}>
            Cancel
            <Kbd className="text-[10px] ml-auto">Esc</Kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

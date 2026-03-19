import { useEffect } from 'react'
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
import { useNoteStore } from '../../stores/note.store'
import { useUiStore } from '../../stores/ui.store'

const isMac = navigator.platform.includes('Mac')
const modSymbol = isMac ? '\u2318' : 'Ctrl'

export function DeleteNoteDialog() {
  const pendingDeleteNoteId = useUiStore((s) => s.pendingDeleteNoteId)
  const setPendingDeleteNoteId = useUiStore((s) => s.setPendingDeleteNoteId)
  const notes = useNoteStore((s) => s.notes)
  const deleteNote = useNoteStore((s) => s.deleteNote)

  const targetNote = pendingDeleteNoteId
    ? notes.find((n) => n.id === pendingDeleteNoteId)
    : null

  async function handleConfirm() {
    if (pendingDeleteNoteId) {
      await deleteNote(pendingDeleteNoteId)
      setPendingDeleteNoteId(null)
    }
  }

  function handleCancel() {
    setPendingDeleteNoteId(null)
  }

  useEffect(() => {
    if (!pendingDeleteNoteId) return

    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'y') {
        e.preventDefault()
        handleConfirm()
      }
      if (mod && e.key === 'n') {
        e.preventDefault()
        handleCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pendingDeleteNoteId])

  if (!pendingDeleteNoteId) return null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete note</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &ldquo;{targetNote?.title ?? 'this note'}&rdquo;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
            <Kbd className="ml-2 text-[10px] h-auto py-0.5 bg-background/10 text-muted-foreground">{modSymbol} + N</Kbd>
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
            <Kbd className="ml-2 text-[10px] h-auto py-0.5 bg-white/15 text-destructive-foreground">{modSymbol} + Y</Kbd>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

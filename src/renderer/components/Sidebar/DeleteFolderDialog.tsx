import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              onDeleteKeepNotes()
              onOpenChange(false)
            }}
          >
            Delete folder
          </Button>
          {noteCount > 0 && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                onDeleteWithNotes()
                onOpenChange(false)
              }}
            >
              Delete folder and all notes
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

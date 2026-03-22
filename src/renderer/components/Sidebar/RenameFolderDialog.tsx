import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFolderStore } from '../../stores/folder.store'
import type { Folder } from '@shared/types/folder'

interface RenameFolderDialogProps {
  readonly folder: Folder
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function RenameFolderDialog({ folder, open, onOpenChange }: RenameFolderDialogProps) {
  const [name, setName] = useState(folder.name)
  const renameFolder = useFolderStore((s) => s.renameFolder)

  useEffect(() => {
    if (open) setName(folder.name)
  }, [open, folder.name])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed || trimmed === folder.name) return

      await renameFolder(folder.id, trimmed)
      onOpenChange(false)
    },
    [name, folder.id, folder.name, renameFolder, onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Rename folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            className="mb-4"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || name.trim() === folder.name}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

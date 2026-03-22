import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CreateFolderDialog } from './CreateFolderDialog'

export function SidebarHeader() {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <div className="px-3 pt-1 pb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Notes
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground no-drag"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New folder</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <CreateFolderDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  )
}

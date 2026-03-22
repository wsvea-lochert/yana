import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SidebarFooterProps {
  readonly onOpenSettings: () => void
}

export function SidebarFooter({ onOpenSettings }: SidebarFooterProps) {
  return (
    <div className="px-3 pb-3 pt-2">
      <Button
        variant="ghost"
        className="w-full justify-start gap-2 h-8 px-2 text-sm text-muted-foreground hover:text-foreground no-drag"
        onClick={onOpenSettings}
      >
        <Settings className="h-4 w-4" />
        Settings
      </Button>
    </div>
  )
}

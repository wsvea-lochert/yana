import { useState, useEffect, useCallback } from 'react'
import { Sun, Moon, Monitor, FolderOpen, Keyboard } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Kbd } from '@/components/ui/kbd'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useUiStore } from '../../stores/ui.store'
import { cn } from '@/lib/utils'

type ThemeMode = 'light' | 'dark' | 'system'

interface SettingsDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

function resolveSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const isMac = navigator.platform.includes('Mac')

function formatAccelerator(accel: string): string {
  return accel
    .replace('Command', isMac ? '\u2318' : 'Cmd')
    .replace('Control', isMac ? '\u2303' : 'Ctrl')
    .replace('Alt', isMac ? '\u2325' : 'Alt')
    .replace('Shift', isMac ? '\u21E7' : 'Shift')
    .replace(/\+/g, ' ')
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [vaultPath, setVaultPath] = useState('')
  const [overlayHotkey, setOverlayHotkey] = useState('CommandOrControl+=')
  const [isRecording, setIsRecording] = useState(false)
  const [hotkeyError, setHotkeyError] = useState('')

  useEffect(() => {
    if (open) {
      window.api.config
        .getVaultPath()
        .then(setVaultPath)
        .catch(() => {})
      window.api.config
        .get('themeMode')
        .then((stored) => {
          if (stored === 'light' || stored === 'dark' || stored === 'system') {
            setThemeMode(stored as ThemeMode)
          }
        })
        .catch(() => {})
      window.api.config
        .get('overlayHotkey')
        .then((stored) => {
          if (typeof stored === 'string' && stored) {
            setOverlayHotkey(stored)
          }
        })
        .catch(() => {})
      setIsRecording(false)
      setHotkeyError('')
    }
  }, [open])

  // Listen for recorded hotkey from main process
  useEffect(() => {
    const unsubscribe = window.api.on.hotkeyRecorded(async (accel) => {
      setIsRecording(false)

      if (accel === '__invalid__') {
        setHotkeyError('That key is not supported. Use ASCII keys only (letters, numbers, F-keys).')
        return
      }

      setHotkeyError('')

      try {
        const result = await window.api.hotkey.updateOverlay(accel)
        if (result.success) {
          setOverlayHotkey(accel)
          await window.api.config.set('overlayHotkey', accel)
        } else {
          setHotkeyError(
            result.error ?? 'Could not register this shortcut. It may be in use by the system.'
          )
        }
      } catch {
        setHotkeyError('Failed to update shortcut.')
      }
    })
    return unsubscribe
  }, [])

  const handleThemeModeChange = useCallback(
    (value: string) => {
      if (!value) return
      const mode = value as ThemeMode
      setThemeMode(mode)

      const resolved = mode === 'system' ? resolveSystemTheme() : mode
      setTheme(resolved)
      window.api.config.set('themeMode', mode).catch(() => {})
    },
    [setTheme]
  )

  function startRecording() {
    setIsRecording(true)
    setHotkeyError('')
    window.api.hotkey.startRecording()
  }

  // Cancel recording on Escape
  useEffect(() => {
    if (!isRecording) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsRecording(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isRecording])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Appearance */}
          <div>
            <h3 className="text-sm font-medium mb-3">Appearance</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === 'light' ? (
                  <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm">Theme</p>
                  <p className="text-xs text-muted-foreground">
                    {themeMode === 'system'
                      ? 'Following system preference'
                      : themeMode === 'light'
                        ? 'Light mode'
                        : 'Dark mode'}
                  </p>
                </div>
              </div>
              <ToggleGroup
                type="single"
                value={themeMode}
                onValueChange={handleThemeModeChange}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="light" aria-label="Light theme">
                  <Sun className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="dark" aria-label="Dark theme">
                  <Moon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="system" aria-label="System theme">
                  <Monitor className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Separator />

          {/* Shortcuts */}
          <div>
            <h3 className="text-sm font-medium mb-3">Shortcuts</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm">Quick capture overlay</p>
                  <p className="text-xs text-muted-foreground">Global shortcut</p>
                </div>
              </div>
              <button
                onClick={startRecording}
                className={cn(
                  'px-3 py-1.5 rounded-md border text-sm transition-colors outline-none',
                  isRecording
                    ? 'border-primary bg-primary/10 text-primary animate-pulse'
                    : 'border-input bg-background hover:bg-accent'
                )}
              >
                {isRecording ? 'Press shortcut...' : <Kbd>{formatAccelerator(overlayHotkey)}</Kbd>}
              </button>
            </div>
            {hotkeyError && <p className="text-xs text-destructive mt-2">{hotkeyError}</p>}
          </div>

          <Separator />

          {/* Storage */}
          {vaultPath && (
            <div>
              <h3 className="text-sm font-medium mb-3">Storage</h3>
              <div className="flex items-start gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm">Vault location</p>
                  <p className="text-xs text-muted-foreground font-[family-name:var(--font-mono)] break-all mt-0.5">
                    {vaultPath}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

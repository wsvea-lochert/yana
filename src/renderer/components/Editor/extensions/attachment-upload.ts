import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { uploadBlob } from '@renderer/services/attachment-client'
import type { EditorView } from '@tiptap/pm/view'

/**
 * Wires paste + drop handlers so that dropping or pasting a file inserts an
 * attachment node at the cursor position once the upload completes.
 *
 * Image types become `image` nodes; everything else becomes a `fileLink`
 * node. On upload failure an `onError` callback is fired so the host UI can
 * surface a toast.
 */

export interface AttachmentUploadOptions {
  onError: (message: string, error: unknown) => void
}

function extractFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return []
  const files: File[] = []
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      const file = dataTransfer.files.item(i)
      if (file) files.push(file)
    }
  }
  // Fallback for clipboard screenshots where `.files` is empty but items
  // contain the blob.
  if (files.length === 0 && dataTransfer.items) {
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i]
      if (item.kind === 'file') {
        const asFile = item.getAsFile()
        if (asFile) files.push(asFile)
      }
    }
  }
  return files
}

function isViewDestroyed(view: EditorView): boolean {
  // ProseMirror sets `docView` to null on destroy.
  return (view as unknown as { docView: unknown }).docView === null
}

async function insertFile(
  view: EditorView,
  file: File,
  pos: number,
  onError: AttachmentUploadOptions['onError']
): Promise<void> {
  try {
    const ref = await uploadBlob(file, file.name)
    if (isViewDestroyed(view)) return
    const isImage = file.type.startsWith('image/')
    const { schema } = view.state
    const node = isImage
      ? schema.nodes.image?.create({ src: ref.url, alt: file.name })
      : schema.nodes.fileLink?.create({
          href: ref.url,
          name: file.name,
          size: ref.size,
          mime: file.type || 'application/octet-stream'
        })
    if (!node) return
    const tr = view.state.tr.insert(Math.min(pos, view.state.doc.content.size), node)
    view.dispatch(tr)
  } catch (error) {
    onError('Attachment upload failed', error)
  }
}

export const AttachmentUpload = Extension.create<AttachmentUploadOptions>({
  name: 'attachmentUpload',

  addOptions() {
    return {
      onError: () => {}
    }
  },

  addProseMirrorPlugins() {
    const { onError } = this.options
    return [
      new Plugin({
        key: new PluginKey('attachmentUpload'),
        props: {
          handleDrop(view, event) {
            const files = extractFiles((event as DragEvent).dataTransfer)
            if (files.length === 0) return false
            event.preventDefault()
            const coords = { left: (event as DragEvent).clientX, top: (event as DragEvent).clientY }
            const dropPos = view.posAtCoords(coords)?.pos ?? view.state.selection.from
            files.forEach((file) => {
              void insertFile(view, file, dropPos, onError)
            })
            return true
          },
          handlePaste(view, event) {
            const clipboardEvent = event as ClipboardEvent
            const files = extractFiles(clipboardEvent.clipboardData)
            if (files.length === 0) return false
            event.preventDefault()
            const pastePos = view.state.selection.from
            files.forEach((file) => {
              void insertFile(view, file, pastePos, onError)
            })
            return true
          }
        }
      })
    ]
  }
})

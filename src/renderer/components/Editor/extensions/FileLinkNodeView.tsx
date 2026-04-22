import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { FileIcon, FileText, FileImage, FileVideo, FileAudio, FileArchive } from 'lucide-react'

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

function iconForMime(mime: string) {
  if (mime.startsWith('image/')) return FileImage
  if (mime.startsWith('video/')) return FileVideo
  if (mime.startsWith('audio/')) return FileAudio
  if (/zip|tar|rar|7z/.test(mime)) return FileArchive
  if (/pdf|text|markdown|json|xml/.test(mime)) return FileText
  return FileIcon
}

export function FileLinkNodeView({ node }: NodeViewProps) {
  const href = (node.attrs.href as string) ?? ''
  const name = (node.attrs.name as string) ?? 'attachment'
  const size = Number(node.attrs.size ?? 0)
  const mime = (node.attrs.mime as string) ?? 'application/octet-stream'
  const Icon = iconForMime(mime)
  const sizeLabel = formatSize(size)

  return (
    <NodeViewWrapper
      as="a"
      href={href}
      target="_blank"
      rel="noreferrer"
      className="yana-attachment-chip"
      data-attachment-chip=""
      contentEditable={false}
    >
      <Icon className="yana-attachment-chip__icon" aria-hidden="true" />
      <span className="yana-attachment-chip__meta">
        <span className="yana-attachment-chip__name">{name}</span>
        {sizeLabel ? <span className="yana-attachment-chip__size">{sizeLabel}</span> : null}
      </span>
    </NodeViewWrapper>
  )
}

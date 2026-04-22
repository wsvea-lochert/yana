import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { FileLinkNodeView } from './FileLinkNodeView'
import { isAttachmentUrl } from '@renderer/services/attachment-client'

/**
 * A `fileLink` node for non-image attachments (PDFs, zips, etc.) rendered as
 * a card chip. Serializes to HTML as a plain anchor tag carrying the
 * attachment metadata in `data-*` attributes so tiptap-markdown preserves the
 * round-trip as `[name](href)` on disk. On re-open, we reclaim the node by
 * detecting `yana-attachment:` / `attachments/` hrefs in parseHTML.
 */

interface FileLinkAttrs {
  href: string
  name: string
  size: number
  mime: string
}

export const FileLink = Node.create({
  name: 'fileLink',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      href: { default: '' },
      name: { default: 'attachment' },
      size: { default: 0, parseHTML: (el) => Number(el.getAttribute('data-size') ?? 0) },
      mime: {
        default: 'application/octet-stream',
        parseHTML: (el) => el.getAttribute('data-mime') ?? 'application/octet-stream'
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-attachment-chip]',
        getAttrs: (el): FileLinkAttrs | false => {
          const anchor = el as HTMLAnchorElement
          return {
            href: anchor.getAttribute('href') ?? '',
            name: anchor.textContent?.trim() || 'attachment',
            size: Number(anchor.getAttribute('data-size') ?? 0),
            mime: anchor.getAttribute('data-mime') ?? 'application/octet-stream'
          }
        }
      },
      // Reclaim links that point at attachments but lost their data-* marker
      // during a markdown round-trip.
      {
        tag: 'a[href]',
        getAttrs: (el): FileLinkAttrs | false => {
          const href = (el as HTMLAnchorElement).getAttribute('href') ?? ''
          if (!href || !isAttachmentUrl(href)) return false
          // Image attachments stay as inline <img>; this branch catches
          // non-image attachments that serialized as markdown links.
          if (/\.(png|jpe?g|gif|webp|svg|avif|heic)$/i.test(href)) return false
          return {
            href,
            name: (el as HTMLAnchorElement).textContent?.trim() || 'attachment',
            size: 0,
            mime: 'application/octet-stream'
          }
        }
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-attachment-chip': '',
        'data-size': String(HTMLAttributes.size ?? 0),
        'data-mime': String(HTMLAttributes.mime ?? 'application/octet-stream'),
        target: '_blank',
        rel: 'noreferrer',
        class: 'yana-attachment-chip'
      }),
      HTMLAttributes.name ?? 'attachment'
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileLinkNodeView)
  }
})

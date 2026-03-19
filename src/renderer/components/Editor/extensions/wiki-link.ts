import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wikiLink: {
      setWikiLink: (attributes: { target: string; label?: string }) => ReturnType
    }
  }
}

export interface WikiLinkOptions {
  onNavigate: ((target: string) => void) | null
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      onNavigate: null
    }
  },

  addAttributes() {
    return {
      target: { default: '' },
      label: { default: null }
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wiki-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes.label || HTMLAttributes.target
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wiki-link': '',
        class: 'text-sage cursor-pointer hover:underline decoration-sage/40',
        title: `Go to: ${HTMLAttributes.target}`
      }),
      `[[${label}]]`
    ]
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/,
        handler: ({ state, range, match }) => {
          const target = match[1].trim()
          const label = match[2]?.trim() ?? null
          const { tr } = state

          tr.replaceWith(
            range.from,
            range.to,
            this.type.create({ target, label })
          )
        }
      })
    ]
  },

  addCommands() {
    return {
      setWikiLink:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes
          })
        }
    }
  },

  addProseMirrorPlugins() {
    const { onNavigate } = this.options
    return [
      new Plugin({
        key: new PluginKey('wikiLinkClick'),
        props: {
          handleClick: (view, pos) => {
            if (!onNavigate) return false
            const { state } = view
            const resolved = state.doc.resolve(pos)
            const node = resolved.nodeAfter
            if (node?.type.name === 'wikiLink') {
              const target = node.attrs.target as string
              if (target) {
                onNavigate(target)
                return true
              }
            }
            return false
          }
        }
      })
    ]
  }
})

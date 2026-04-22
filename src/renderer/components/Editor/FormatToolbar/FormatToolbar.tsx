import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
  Minus
} from 'lucide-react'
import { ToolbarButton } from './ToolbarButton'
import { ToolbarDivider } from './ToolbarDivider'
import { LinkButton } from './LinkButton'
import { useEditorSelectionState } from './useEditorSelectionState'
import type { ToolbarAction, ToolbarGroup } from './format-toolbar.types'

interface FormatToolbarProps {
  editor: Editor | null
}

const MARK_ACTIONS: ToolbarAction[] = [
  {
    id: 'bold',
    label: 'Bold',
    shortcut: '⌘B',
    icon: Bold,
    isActive: (e) => e.isActive('bold'),
    run: (e) => e.chain().focus().toggleBold().run()
  },
  {
    id: 'italic',
    label: 'Italic',
    shortcut: '⌘I',
    icon: Italic,
    isActive: (e) => e.isActive('italic'),
    run: (e) => e.chain().focus().toggleItalic().run()
  },
  {
    id: 'underline',
    label: 'Underline',
    shortcut: '⌘U',
    icon: Underline,
    isActive: (e) => e.isActive('underline'),
    run: (e) => e.chain().focus().toggleUnderline().run()
  },
  {
    id: 'strike',
    label: 'Strikethrough',
    shortcut: '⌘⇧X',
    icon: Strikethrough,
    isActive: (e) => e.isActive('strike'),
    run: (e) => e.chain().focus().toggleStrike().run()
  },
  {
    id: 'code',
    label: 'Inline code',
    shortcut: '⌘E',
    icon: Code,
    isActive: (e) => e.isActive('code'),
    run: (e) => e.chain().focus().toggleCode().run()
  }
]

const HEADING_ACTIONS: ToolbarAction[] = [
  {
    id: 'h1',
    label: 'Heading 1',
    shortcut: '⌘⌥1',
    icon: Heading1,
    isActive: (e) => e.isActive('heading', { level: 1 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    id: 'h2',
    label: 'Heading 2',
    shortcut: '⌘⌥2',
    icon: Heading2,
    isActive: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    id: 'h3',
    label: 'Heading 3',
    shortcut: '⌘⌥3',
    icon: Heading3,
    isActive: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run()
  }
]

const LIST_ACTIONS: ToolbarAction[] = [
  {
    id: 'bulletList',
    label: 'Bullet list',
    shortcut: '⌘⇧8',
    icon: List,
    isActive: (e) => e.isActive('bulletList'),
    run: (e) => e.chain().focus().toggleBulletList().run()
  },
  {
    id: 'orderedList',
    label: 'Ordered list',
    shortcut: '⌘⇧7',
    icon: ListOrdered,
    isActive: (e) => e.isActive('orderedList'),
    run: (e) => e.chain().focus().toggleOrderedList().run()
  },
  {
    id: 'taskList',
    label: 'Task list',
    shortcut: '⌘⇧9',
    icon: ListChecks,
    isActive: (e) => e.isActive('taskList'),
    run: (e) => e.chain().focus().toggleTaskList().run()
  }
]

const BLOCK_ACTIONS_BEFORE_LINK: ToolbarAction[] = [
  {
    id: 'blockquote',
    label: 'Blockquote',
    shortcut: '⌘⇧B',
    icon: Quote,
    isActive: (e) => e.isActive('blockquote'),
    run: (e) => e.chain().focus().toggleBlockquote().run()
  },
  {
    id: 'codeBlock',
    label: 'Code block',
    shortcut: '⌘⌥C',
    icon: SquareCode,
    isActive: (e) => e.isActive('codeBlock'),
    run: (e) => e.chain().focus().toggleCodeBlock().run()
  }
]

const BLOCK_ACTIONS_AFTER_LINK: ToolbarAction[] = [
  {
    id: 'horizontalRule',
    label: 'Horizontal rule',
    icon: Minus,
    // No active state for node insertion.
    run: (e) => e.chain().focus().setHorizontalRule().run()
  }
]

const SIMPLE_GROUPS: ToolbarGroup[] = [
  { id: 'marks', actions: MARK_ACTIONS },
  { id: 'headings', actions: HEADING_ACTIONS },
  { id: 'lists', actions: LIST_ACTIONS }
]

function renderAction(action: ToolbarAction, editor: Editor) {
  return (
    <ToolbarButton
      key={action.id}
      icon={action.icon}
      label={action.label}
      shortcut={action.shortcut}
      isActive={action.isActive ? action.isActive(editor) : false}
      onActivate={() => action.run(editor)}
      dataAction={action.id}
    />
  )
}

/**
 * Floating pill-style format toolbar anchored at the bottom-center of the
 * main editor. Sticky-positioned inside the editor's scroll container so it
 * tracks the visible viewport without manual sidebar-width math.
 *
 * Renders `null` when the editor is not yet initialised.
 */
export function FormatToolbar({ editor }: FormatToolbarProps) {
  useEditorSelectionState(editor)

  if (!editor) return null

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className={[
        'sticky bottom-6 z-20 mx-auto w-fit',
        'flex items-center gap-0.5 px-1.5 py-1',
        'rounded-full border border-border',
        'bg-background/95 backdrop-blur-sm',
        'shadow-lg shadow-black/5 text-foreground'
      ].join(' ')}
    >
      {SIMPLE_GROUPS.map((group, groupIndex) => (
        <div key={group.id} className="flex items-center gap-0.5">
          {groupIndex > 0 && <ToolbarDivider />}
          {group.actions.map((action) => renderAction(action, editor))}
        </div>
      ))}
      <div key="blocks" className="flex items-center gap-0.5">
        <ToolbarDivider />
        {BLOCK_ACTIONS_BEFORE_LINK.map((action) => renderAction(action, editor))}
        <LinkButton editor={editor} isActive={editor.isActive('link')} />
        {BLOCK_ACTIONS_AFTER_LINK.map((action) => renderAction(action, editor))}
      </div>
    </div>
  )
}

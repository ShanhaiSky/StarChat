/**
 * Hugeicons 图标导出（精简版）
 * @author ShanhaiSky
 *
 * 使用方式：<IconHome :size="20" />
 */

import { h } from 'vue'
import { HugeiconsIcon } from '@hugeicons/vue'
import {
  Notification01Icon,
  Add01Icon,
  Delete01Icon,
  ArrowDown01Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
  Cancel01Icon,
  Search01Icon,
  Settings01Icon,
  CodeIcon,
  Analytics01Icon,
  Edit01Icon,
  LanguageSkillIcon,
  BulbIcon,
  BookOpen01Icon,
} from '@hugeicons/core-free-icons'

/**
 * 创建一个图标组件，包装 HugeiconsIcon
 */
function makeIcon(iconData) {
  return {
    name: 'HugeIcon',
    props: {
      size: { type: [Number, String], default: 24 },
      color: { type: String, default: 'currentColor' },
      strokeWidth: { type: Number, default: undefined },
    },
    setup(props) {
      return () =>
        h(HugeiconsIcon, {
          icon: iconData,
          size: props.size,
          color: props.color,
          strokeWidth: props.strokeWidth,
        })
    },
  }
}

// 导航
export const IconChat = makeIcon(Notification01Icon)
export const IconSettings = makeIcon(Settings01Icon)

// 操作
export const IconAdd = makeIcon(Add01Icon)
export const IconDelete = makeIcon(Delete01Icon)
export const IconSearch = makeIcon(Search01Icon)
export const IconClose = makeIcon(Cancel01Icon)

// UI 元素
export const IconArrowDown = makeIcon(ArrowDown01Icon)
export const IconSidebarLeft = makeIcon(SidebarLeftIcon)
export const IconSidebarRight = makeIcon(SidebarRightIcon)

// 行星图标
export const IconCode = makeIcon(CodeIcon)
export const IconAnalytics = makeIcon(Analytics01Icon)
export const IconEdit = makeIcon(Edit01Icon)
export const IconTranslate = makeIcon(LanguageSkillIcon)
export const IconIdea = makeIcon(BulbIcon)
export const IconBook = makeIcon(BookOpen01Icon)

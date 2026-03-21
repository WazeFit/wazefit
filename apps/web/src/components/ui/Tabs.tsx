import { useState, type ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface Props {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: Props) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '')

  const currentTab = tabs.find((t) => t.id === active)

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{currentTab?.content}</div>
    </div>
  )
}

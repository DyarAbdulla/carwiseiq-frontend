"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Lightbulb, Download } from 'lucide-react'

export function SmartTips() {
  return (
    <Card className="border-[#2a2d3a] bg-[#1a1d29]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💡 Smart Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* General Buying Tip */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#2a2d3a] rounded hover:bg-[#2a2d3a]/80 transition-colors">
            <span className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              💡 General Buying Tip
            </span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 bg-[#2a2d3a]/50 rounded mt-2">
              <p className="font-bold text-sm mb-2">
                Smart buying tip: Always get a pre-purchase inspection from an independent mechanic before finalizing any car purchase.
              </p>
              
              <p className="mt-2 text-xs text-[#94a3b8]">Why does this matter?</p>
              <p className="text-xs text-[#94a3b8]">Even with AI price predictions, a professional inspection can reveal:</p>
              <ul className="list-disc list-inside text-xs mt-2 space-y-1 text-[#94a3b8]">
                <li>Hidden mechanical issues</li>
                <li>Previous accident damage</li>
                <li>Maintenance needs</li>
                <li>Safety concerns</li>
              </ul>
              <p className="text-xs mt-2 text-[#94a3b8]">A $100-200 inspection can save you thousands in unexpected repairs.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Export & Share Results */}
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-[#2a2d3a] rounded hover:bg-[#2a2d3a]/80 transition-colors">
            <span className="flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" />
              📥 Export & Share Results
            </span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 bg-[#2a2d3a]/50 rounded mt-2">
              <p className="text-xs text-[#94a3b8]">
                Export and share features are planned for a future release. For now, you can copy prediction results manually.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}




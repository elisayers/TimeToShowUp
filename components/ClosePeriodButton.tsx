'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { closePeriod } from '@/app/dashboard/actions'

export function ClosePeriodButton({ periodId }: { periodId: string }) {
  const [isClosing, setIsClosing] = useState(false)
  const [confirm, setConfirm] = useState(false)

  const handleClose = async () => {
    if (!confirm) {
      setConfirm(true)
      return
    }

    setIsClosing(true)
    await closePeriod({ period_id: periodId })
    setIsClosing(false)
    setConfirm(false)
  }

  return (
    <div className="flex items-center gap-2">
      {confirm && (
        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
          Close & save to History?
        </span>
      )}
      <Button
        variant={confirm ? 'destructive' : 'outline'}
        size="sm"
        onClick={handleClose}
        disabled={isClosing}
        className="text-xs"
      >
        {isClosing ? 'Closing...' : confirm ? 'Yes, Close Period' : 'Close & Archive Period'}
      </Button>
      {confirm && (
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Cancel
        </button>
      )}
    </div>
  )
}

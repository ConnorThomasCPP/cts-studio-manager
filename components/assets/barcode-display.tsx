/**
 * Barcode Display Component
 *
 * Displays Code 128 barcode and provides print functionality for NIIMBOT D110
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import bwipjs from 'bwip-js'
// @ts-ignore - niimbluelib types may not be available
import { NiimbotBluetoothClient, ImageEncoder } from '@mmote/niimbluelib'

interface BarcodeDisplayProps {
  assetCode: string
  assetName: string
}

export function BarcodeDisplay({ assetCode, assetName }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [printing, setPrinting] = useState(false)

  // Generate barcode on mount
  useEffect(() => {
    if (!canvasRef.current) return

    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: 'code128',
        text: assetCode,
        scale: 2,        // Good scale for label
        height: 12,      // Slightly taller
        includetext: true,
        textxalign: 'center',
        textsize: 9,     // Good text size
      })
    } catch (error) {
      console.error('Barcode generation error:', error)
      toast.error('Failed to generate barcode')
    }
  }, [assetCode])

  // Print barcode via Bluetooth to NIIMBOT D110
  async function handlePrint() {
    setPrinting(true)

    try {
      // Check if Web Bluetooth is supported
      if (!navigator.bluetooth) {
        toast.error('Bluetooth is not supported in this browser. Please use Chrome or Edge.')
        return
      }

      if (!canvasRef.current) {
        toast.error('Barcode not ready. Please try again.')
        return
      }

      toast.info('Connecting to NIIMBOT D110...')

      // Create NIIMBOT Bluetooth client
      const client = new NiimbotBluetoothClient()

      // Connect to the printer
      await client.connect()
      toast.success('Connected to printer!')

      // Fetch printer info to see what we're working with
      const printerInfo = await client.fetchPrinterInfo()
      console.log('Printer info:', printerInfo)

      const labelType = await client.abstraction.getLabelType()
      console.log('Label type:', labelType)

      // Encode the canvas image for printing
      toast.info('Preparing barcode image...')

      // Prepare barcode canvas with dimensions that are multiples of 8
      const originalCanvas = canvasRef.current
      const paddedCanvas = document.createElement('canvas')
      const ctx = paddedCanvas.getContext('2d')

      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Match label dimensions: 14mm x 40mm = ~96 x 320 pixels at 203 DPI
      // For "left" rotation, we need width=320, height=96 before rotation
      // After rotation it becomes: width=96 (printhead), height=320 (label length)
      const labelWidth = 320   // Will become height after rotation (label length)
      const labelHeight = 96   // Will become width after rotation (printhead width)

      // Set canvas to label dimensions (both multiples of 8)
      paddedCanvas.width = labelWidth
      paddedCanvas.height = labelHeight

      // Fill with white background
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, labelWidth, labelHeight)

      // Center the barcode on the label-sized canvas
      const originalWidth = originalCanvas.width
      const originalHeight = originalCanvas.height
      const offsetX = Math.floor((labelWidth - originalWidth) / 2)
      const offsetY = Math.floor((labelHeight - originalHeight) / 2)
      ctx.drawImage(originalCanvas, offsetX, offsetY)

      console.log('Barcode dimensions:', labelWidth, 'x', labelHeight)

      // Encode the padded canvas with "left" to rotate 90° for horizontal printing
      const encoded = ImageEncoder.encodeCanvas(paddedCanvas, "left")
      console.log('Encoded barcode:', {
        cols: encoded.cols,
        rows: encoded.rows,
        rowsData: encoded.rowsData.length
      })

      // Get the correct print task type for this printer
      const taskType = client.getPrintTaskType()
      console.log('Auto-detected print task type:', taskType)

      if (!taskType) {
        throw new Error('Could not determine print task type for this printer')
      }

      // Create print task with explicit label type
      const quantity = 1
      const printTask = client.abstraction.newPrintTask(taskType, {
        totalPages: quantity,
        density: 3,      // Default density (was 5, trying default)
        labelType: 1     // Gap label (from printer info)
      })

      toast.info('Printing...')

      try {
        // Initialize print job
        await printTask.printInit()

        // Print the barcode
        await printTask.printPage(encoded, quantity)

        // Wait for print to complete
        await printTask.waitForFinished()

        toast.success('Barcode printed successfully!')
      } finally {
        // Always call printEnd to clean up (on abstraction, not print task)
        await client.abstraction.printEnd()
      }

      // Disconnect from printer
      await client.disconnect()
    } catch (error: any) {
      console.error('=== NIIMBOT PRINT ERROR ===')
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Full error:', error)

      if (error.name === 'NotFoundError') {
        toast.error('No printer selected. Please try again and select your NIIMBOT D110.')
      } else if (error.name === 'NotSupportedError') {
        toast.error('Bluetooth not supported. Please use Chrome or Edge browser.')
      } else if (error.name === 'NetworkError') {
        toast.error('Lost connection to printer. Make sure printer is on and in range.')
      } else if (error.name === 'SecurityError') {
        toast.error('Bluetooth access denied. Please allow Bluetooth permissions.')
      } else {
        toast.error(`Print failed: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-8 rounded-lg border inline-block">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>

      <div className="flex gap-2">
        <Button onClick={handlePrint} disabled={printing}>
          {printing ? 'Printing...' : 'Print Barcode'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const canvas = canvasRef.current
            if (!canvas) return

            // Download barcode as PNG
            canvas.toBlob((blob) => {
              if (!blob) return
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${assetCode}-barcode.png`
              a.click()
              URL.revokeObjectURL(url)
              toast.success('Barcode downloaded!')
            })
          }}
        >
          Download PNG
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Supports NIIMBOT D110 and compatible Bluetooth thermal printers
      </p>
    </div>
  )
}

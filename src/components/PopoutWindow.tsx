import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AvatarViewer } from './AvatarViewer'
import type { AudioSettings } from '../lib/models'

interface PopoutWindowProps {
  modelUrl: string
  audioData: number
  settings: AudioSettings
  onModelLoad?: (success: boolean) => void
}

export function usePopoutWindow() {
  const popoutWindowRef = useRef<Window | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<ReturnType<typeof createRoot> | null>(null)
  const propsRef = useRef<PopoutWindowProps | null>(null)

  const openPopout = (props: PopoutWindowProps) => {
    if (popoutWindowRef.current && !popoutWindowRef.current.closed) {
      popoutWindowRef.current.focus()
      return
    }

    const width = 500
    const height = 600
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    const newWindow = window.open(
      '',
      '3D Avatar Floating Window',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,status=no,location=no,toolbar=no,menubar=no`
    )

    if (!newWindow) {
      alert('Popup blocked! Please allow popups for this site.')
      return
    }

    popoutWindowRef.current = newWindow
    propsRef.current = props
    setIsOpen(true)

    const doc = newWindow.document
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>3D Avatar - Floating View</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: oklch(0.12 0.01 250);
            overflow: hidden;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
          }
          #root {
            width: 100vw;
            height: 100vh;
          }
          .controls {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            gap: 8px;
          }
          .control-btn {
            background: oklch(0.25 0.05 250);
            border: 1px solid oklch(0.75 0.15 195);
            color: oklch(0.95 0 0);
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
          }
          .control-btn:hover {
            background: oklch(0.35 0.05 250);
            box-shadow: 0 0 8px oklch(0.75 0.15 195 / 0.3);
          }
          .info {
            position: absolute;
            bottom: 10px;
            left: 10px;
            color: oklch(0.60 0.02 250);
            font-size: 11px;
            font-family: 'JetBrains Mono', monospace;
            background: oklch(0.15 0.01 250 / 0.8);
            padding: 6px 10px;
            border-radius: 4px;
            backdrop-filter: blur(4px);
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="control-btn" onclick="window.close()">✕ Close</button>
        </div>
        <div id="root"></div>
        <div class="info">3D Avatar Lip Sync • Drag this window anywhere</div>
      </body>
      </html>
    `)
    doc.close()

    const container = doc.getElementById('root')
    if (container) {
      rootRef.current = createRoot(container)
      rootRef.current.render(
        <AvatarViewer
          modelUrl={props.modelUrl}
          audioData={props.audioData}
          settings={props.settings}
          onModelLoad={props.onModelLoad}
          className="w-full h-full"
        />
      )
    }

    const checkWindowClosed = setInterval(() => {
      if (popoutWindowRef.current?.closed) {
        clearInterval(checkWindowClosed)
        setIsOpen(false)
        popoutWindowRef.current = null
        rootRef.current = null
      }
    }, 500)

    newWindow.addEventListener('beforeunload', () => {
      setIsOpen(false)
      rootRef.current = null
    })
  }

  const updatePopout = (props: PopoutWindowProps) => {
    if (rootRef.current && popoutWindowRef.current && !popoutWindowRef.current.closed) {
      propsRef.current = props
      rootRef.current.render(
        <AvatarViewer
          modelUrl={props.modelUrl}
          audioData={props.audioData}
          settings={props.settings}
          onModelLoad={props.onModelLoad}
          className="w-full h-full"
        />
      )
    }
  }

  const closePopout = () => {
    if (popoutWindowRef.current && !popoutWindowRef.current.closed) {
      popoutWindowRef.current.close()
    }
    setIsOpen(false)
    popoutWindowRef.current = null
    rootRef.current = null
  }

  useEffect(() => {
    return () => {
      closePopout()
    }
  }, [])

  return {
    isOpen,
    openPopout,
    updatePopout,
    closePopout
  }
}

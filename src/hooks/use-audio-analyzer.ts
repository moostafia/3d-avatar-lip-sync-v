import { useEffect, useRef, useState } from 'react'

export function useAudioAnalyzer() {
  const [audioLevel, setAudioLevel] = useState(0)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const streamRef = useRef<MediaStream | null>(null)

  const startCapture = async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      analyserRef.current = analyser
      const bufferLength = analyser.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)

      source.connect(analyser)

      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return

        // @ts-ignore - Web Audio API type mismatch
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)

        const lowFreqEnd = Math.floor(dataArrayRef.current.length * 0.2)
        let sum = 0
        for (let i = 0; i < lowFreqEnd; i++) {
          sum += dataArrayRef.current[i]
        }
        const average = sum / lowFreqEnd / 255

        setAudioLevel(average)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }

      updateAudioLevel()
      setIsCapturing(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone'
      setError(errorMessage)
      console.error('Audio capture error:', err)
    }
  }

  const stopCapture = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    dataArrayRef.current = null
    setIsCapturing(false)
    setAudioLevel(0)
  }

  useEffect(() => {
    return () => {
      stopCapture()
    }
  }, [])

  return {
    audioLevel,
    isCapturing,
    error,
    startCapture,
    stopCapture
  }
}

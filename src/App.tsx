import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { AvatarViewer } from './components/AvatarViewer'
import { AudioVisualizer } from './components/AudioVisualizer'
import { FloatingWindow } from './components/FloatingWindow'
import { useAudioAnalyzer } from './hooks/use-audio-analyzer'
import { MODEL_PRESETS, DEFAULT_SETTINGS, type AudioSettings } from './lib/models'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Label } from './components/ui/label'
import { Slider } from './components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select'
import { Input } from './components/ui/input'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion'
import { Toaster, toast } from 'sonner'
import {
  Microphone,
  MicrophoneSlash,
  Cube,
  SlidersHorizontal,
  WarningCircle,
  ArrowsOutSimple
} from '@phosphor-icons/react'

function App() {
  const [settings, setSettings] = useKV<AudioSettings>('audio-settings', DEFAULT_SETTINGS)
  const [selectedModelId, setSelectedModelId] = useKV('selected-model', MODEL_PRESETS[0].id)
  const [customModelUrl, setCustomModelUrl] = useKV('custom-model-url', '')
  const [useCustomModel, setUseCustomModel] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)

  const { audioLevel, isCapturing, error, startCapture, stopCapture } = useAudioAnalyzer()

  const currentModel = useCustomModel && customModelUrl
    ? { url: customModelUrl, name: 'Custom Model' }
    : MODEL_PRESETS.find(m => m.id === selectedModelId) || MODEL_PRESETS[0]

  const handleStartCapture = async () => {
    await startCapture()
    if (!error) {
      toast.success('Audio capture started', {
        description: 'The avatar will now lip-sync to your audio'
      })
    }
  }

  const handleStopCapture = () => {
    stopCapture()
    toast.info('Audio capture stopped')
  }

  const handleModelLoad = (success: boolean) => {
    setModelLoading(false)
    if (success) {
      toast.success('Model loaded successfully')
    } else {
      toast.error('Failed to load model', {
        description: 'Please check the URL or try another model'
      })
    }
  }

  const handleModelChange = (modelId: string) => {
    setModelLoading(true)
    setSelectedModelId(modelId)
    setUseCustomModel(false)
  }

  const handleCustomModelLoad = () => {
    const url = customModelUrl || ''
    if (!url.trim()) {
      toast.error('Please enter a model URL')
      return
    }
    if (!url.toLowerCase().endsWith('.gltf') && !url.toLowerCase().endsWith('.glb')) {
      toast.error('Invalid model URL', {
        description: 'URL must end with .gltf or .glb'
      })
      return
    }
    setModelLoading(true)
    setUseCustomModel(true)
  }

  const handleOpenFloatingWindow = () => {
    setIsFloatingOpen(true)
    toast.success('Floating window opened', {
      description: 'You can now drag the avatar anywhere on your screen'
    })
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" />
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-accent mb-2">
                3D Avatar Lip Sync
              </h1>
              <p className="text-muted-foreground">
                Real-time audio-driven facial animation for your digital characters
              </p>
            </div>

            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Cube className="text-accent" size={24} />
                    Model Selection
                  </CardTitle>
                  {modelLoading && (
                    <Badge variant="secondary" className="animate-shimmer">
                      Loading...
                    </Badge>
                  )}
                </div>
                <CardDescription>Choose a preset model or load your own GLTF/GLB file</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="model-select">Preset Models</Label>
                  <Select value={selectedModelId} onValueChange={handleModelChange}>
                    <SelectTrigger id="model-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODEL_PRESETS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} - {model.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="custom-url" className="font-mono text-xs">
                    Custom Model URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-url"
                      type="url"
                      placeholder="https://example.com/model.gltf"
                      value={customModelUrl || ''}
                      onChange={(e) => setCustomModelUrl(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button onClick={handleCustomModelLoad} variant="secondary">
                      Load
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isCapturing ? (
                    <Microphone className="text-accent animate-glow-pulse" size={24} />
                  ) : (
                    <MicrophoneSlash className="text-muted-foreground" size={24} />
                  )}
                  Audio Capture
                </CardTitle>
                <CardDescription>
                  Enable microphone access to drive the avatar's lip movements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <WarningCircle className="text-destructive mt-0.5" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">Audio Error</p>
                      <p className="text-xs text-destructive/80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Button
                    onClick={isCapturing ? handleStopCapture : handleStartCapture}
                    className="flex-1"
                    variant={isCapturing ? 'destructive' : 'default'}
                  >
                    {isCapturing ? (
                      <>
                        <MicrophoneSlash size={20} />
                        Stop Capture
                      </>
                    ) : (
                      <>
                        <Microphone size={20} />
                        Start Capture
                      </>
                    )}
                  </Button>
                  <Badge variant={isCapturing ? 'default' : 'secondary'} className="px-3 py-2">
                    {isCapturing ? 'Recording' : 'Idle'}
                  </Badge>
                </div>

                {isCapturing && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs">Audio Level</Label>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-75"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Audio Visualizer</Label>
                      <AudioVisualizer audioLevel={audioLevel} isCapturing={isCapturing} />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-accent/20 hover:border-accent/40 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="text-accent" size={24} />
                  Lip Sync Settings
                </CardTitle>
                <CardDescription>Fine-tune the mouth animation parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="settings">
                    <AccordionTrigger>Advanced Controls</AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="sensitivity">Sensitivity</Label>
                          <span className="text-sm font-mono text-accent">
                            {(settings?.sensitivity ?? DEFAULT_SETTINGS.sensitivity).toFixed(1)}x
                          </span>
                        </div>
                        <Slider
                          id="sensitivity"
                          min={0.5}
                          max={5}
                          step={0.1}
                          value={[settings?.sensitivity ?? DEFAULT_SETTINGS.sensitivity]}
                          onValueChange={([value]) => setSettings((prev = DEFAULT_SETTINGS) => ({ ...prev, sensitivity: value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Controls how much the audio affects mouth movement
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="smoothing">Smoothing</Label>
                          <span className="text-sm font-mono text-accent">
                            {((settings?.smoothing ?? DEFAULT_SETTINGS.smoothing) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Slider
                          id="smoothing"
                          min={0}
                          max={0.95}
                          step={0.05}
                          value={[settings?.smoothing ?? DEFAULT_SETTINGS.smoothing]}
                          onValueChange={([value]) => setSettings((prev = DEFAULT_SETTINGS) => ({ ...prev, smoothing: value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Reduces jitter for smoother animations
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="minOpen">Minimum Open</Label>
                          <span className="text-sm font-mono text-accent">
                            {((settings?.minOpen ?? DEFAULT_SETTINGS.minOpen) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Slider
                          id="minOpen"
                          min={0}
                          max={0.5}
                          step={0.05}
                          value={[settings?.minOpen ?? DEFAULT_SETTINGS.minOpen]}
                          onValueChange={([value]) => setSettings((prev = DEFAULT_SETTINGS) => ({ ...prev, minOpen: value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Minimum mouth opening (idle state)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="maxOpen">Maximum Open</Label>
                          <span className="text-sm font-mono text-accent">
                            {((settings?.maxOpen ?? DEFAULT_SETTINGS.maxOpen) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Slider
                          id="maxOpen"
                          min={0.5}
                          max={1}
                          step={0.05}
                          value={[settings?.maxOpen ?? DEFAULT_SETTINGS.maxOpen]}
                          onValueChange={([value]) => setSettings((prev = DEFAULT_SETTINGS) => ({ ...prev, maxOpen: value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum mouth opening at peak volume
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSettings(DEFAULT_SETTINGS)}
                      >
                        Reset to Defaults
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-6 h-[600px] lg:h-[calc(100vh-3rem)]">
            <Card className="h-full border-accent/20 overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <Button
                  onClick={handleOpenFloatingWindow}
                  variant="secondary"
                  size="sm"
                  className="gap-2 shadow-lg"
                >
                  <ArrowsOutSimple size={16} />
                  Pop Out
                </Button>
              </div>
              <AvatarViewer
                modelUrl={currentModel.url}
                audioData={audioLevel}
                settings={settings || DEFAULT_SETTINGS}
                onModelLoad={handleModelLoad}
                className="w-full h-full"
              />
            </Card>
          </div>
        </div>

        <FloatingWindow
          isOpen={isFloatingOpen}
          onClose={() => setIsFloatingOpen(false)}
          title="3D Avatar - Floating View"
          initialWidth={500}
          initialHeight={600}
        >
          <AvatarViewer
            modelUrl={currentModel.url}
            audioData={audioLevel}
            settings={settings || DEFAULT_SETTINGS}
            onModelLoad={handleModelLoad}
            className="w-full h-full"
          />
        </FloatingWindow>
      </div>
    </>
  )
}

export default App

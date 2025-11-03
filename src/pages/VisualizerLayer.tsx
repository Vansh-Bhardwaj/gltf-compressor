import { ArrowLeft, Layers, Play, Pause, SkipBack, SkipForward, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleDropzone } from "@/components/SimpleDropzone";
import { useModelStore } from "@/stores/useModelStore";
import ModelView from "@/components/ModelView";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface VisualizerLayerProps {
  onBack: () => void;
}

export function VisualizerLayer({ onBack }: VisualizerLayerProps) {
  const originalDocument = useModelStore((state) => state.originalDocument);
  const fileName = useModelStore((state) => state.fileName);
  const resetModel = useModelStore((state) => state.resetModel);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Mock steps - will be replaced with actual GLB layer extraction
  const mockSteps = [
    { id: 0, name: "Foundation", meshCount: 5, visible: true, color: "#3b82f6" },
    { id: 1, name: "Structure", meshCount: 12, visible: false, color: "#8b5cf6" },
    { id: 2, name: "Details", meshCount: 8, visible: false, color: "#ec4899" },
    { id: 3, name: "Finishing", meshCount: 6, visible: false, color: "#f59e0b" },
    { id: 4, name: "Complete Model", meshCount: 31, visible: false, color: "#10b981" },
  ];

  const totalSteps = mockSteps.length;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // Keyboard shortcuts
  const shortcuts = [
    { key: "Space", description: "Play/Pause animation" },
    { key: "←", description: "Previous step" },
    { key: "→", description: "Next step" },
    { key: "R", description: "Toggle auto-rotate" },
    { key: "G", description: "Toggle grid" },
    { key: "Esc", description: "Go back to home" },
  ];

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "r":
        case "R":
          setAutoRotate(!autoRotate);
          break;
        case "g":
        case "G":
          setShowGrid(!showGrid);
          break;
        case "Escape":
          resetModel();
          onBack();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentStep, isPlaying, autoRotate, showGrid, resetModel, onBack]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, totalSteps, playbackSpeed]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement step animation
  };

  const handleStepChange = (value: number[]) => {
    setCurrentStep(value[0]);
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setIsPlaying(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => {
              resetModel();
              onBack();
            }}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Layer Visualizer
              </h1>
            </div>
          </div>
          {originalDocument && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{fileName}</Badge>
              <KeyboardShortcuts shortcuts={shortcuts} title="Layer Visualizer Shortcuts" />
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <ThemeToggle />
            </div>
          )}
          {!originalDocument && (
            <div className="flex items-center space-x-2">
              <KeyboardShortcuts shortcuts={shortcuts} title="Layer Visualizer Shortcuts" />
              <ThemeToggle />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      {!originalDocument ? (
        <div className="flex-1 flex items-center justify-center bg-muted/30">
          <div className="max-w-2xl w-full px-4">
            <SimpleDropzone />
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Upload a 3D Model</h2>
              <p className="text-muted-foreground">
                Upload a GLB or GLTF file to visualize it layer by layer
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* 3D Viewport */}
          <div className="flex-1 relative bg-muted/20">
            <ModelView />
            
            {/* Step Indicator Overlay */}
            <div className="absolute top-4 left-4 z-10">
              <Card className="p-4 bg-card/95 backdrop-blur-sm min-w-[200px]">
                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: mockSteps[currentStep].color }}
                  />
                  <span className="font-semibold text-sm">
                    Step {currentStep + 1} of {totalSteps}
                  </span>
                </div>
                <p className="text-sm font-medium mb-2">
                  {mockSteps[currentStep].name}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {mockSteps[currentStep].meshCount} meshes
                </p>
                <Progress value={progressPercentage} className="h-1.5" />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Right Control Panel */}
          <div className="w-80 border-l bg-card overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Timeline Controls */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  Timeline Controls
                </h3>
                
                {/* Step Slider */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">
                      Current Step
                    </label>
                    <span className="text-sm font-medium">
                      {currentStep + 1} / {totalSteps}
                    </span>
                  </div>
                  <Slider
                    value={[currentStep]}
                    min={0}
                    max={totalSteps - 1}
                    step={1}
                    onValueChange={handleStepChange}
                    className="w-full"
                  />
                </div>

                {/* Playback Speed */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">
                      Playback Speed
                    </label>
                    <span className="text-sm font-medium">{playbackSpeed}x</span>
                  </div>
                  <Slider
                    value={[playbackSpeed]}
                    min={0.5}
                    max={2}
                    step={0.5}
                    onValueChange={(value) => setPlaybackSpeed(value[0])}
                    className="w-full"
                  />
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePlayPause}
                    className="w-24"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentStep === totalSteps - 1}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Steps List */}
              <div>
                <h3 className="font-semibold mb-3">Build Steps</h3>
                <div className="space-y-2">
                  {mockSteps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStep(index);
                        setIsPlaying(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        currentStep === index
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card hover:bg-accent border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: step.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-sm">Step {index + 1}</p>
                              {currentStep === index && isPlaying && (
                                <div className="flex space-x-0.5">
                                  <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse" />
                                  <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse delay-75" />
                                  <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse delay-150" />
                                </div>
                              )}
                            </div>
                            <p className={`text-xs truncate ${
                              currentStep === index ? "text-primary-foreground/80" : "text-muted-foreground"
                            }`}>
                              {step.name}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={currentStep === index ? "secondary" : "outline"} 
                          className="text-xs ml-2 flex-shrink-0"
                        >
                          {step.meshCount}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Settings */}
              <div>
                <h3 className="font-semibold mb-3">View Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-rotate" className="text-sm text-muted-foreground cursor-pointer">
                      Auto Rotate
                    </Label>
                    <Switch
                      id="auto-rotate"
                      checked={autoRotate}
                      onCheckedChange={setAutoRotate}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-grid" className="text-sm text-muted-foreground cursor-pointer">
                      Show Grid
                    </Label>
                    <Switch
                      id="show-grid"
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <Card className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Use the timeline to step through your model's
                  construction. Click on individual steps or use playback controls.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import ModelView from "@/components/ModelView";
import { SimpleDropzone } from "@/components/SimpleDropzone";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { ArrowLeft, Download, Layers, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STEP_COLOR_PALETTE = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
];

const FULL_MODEL_PREVIEW_DELAY = 2400;
const HOLOGRAM_REVERSE_DURATION = 1000;
const HOLOGRAM_REVERSE_BUFFER = 150;

interface VisualizerLayerProps {
  onBack: () => void;
}

export function VisualizerLayer({ onBack }: VisualizerLayerProps) {
  const originalDocument = useModelStore((state) => state.originalDocument);
  const fileName = useModelStore((state) => state.fileName);
  const resetModel = useModelStore((state) => state.resetModel);
  const visualizerSteps = useModelStore((state) => state.visualizerSteps);
  const stepMetadata = useModelStore((state) => state.visualizerStepMetadata);
  const activeStepIndex = useModelStore((state) => state.activeVisualizerStepIndex);
  const setActiveStepIndex = useModelStore((state) => state.setActiveVisualizerStepIndex);
  const autoRotate = useViewportStore((state) => state.autoRotateCamera);
  const setAutoRotateCamera = useViewportStore((state) => state.setAutoRotateCamera);
  const showGrid = useViewportStore((state) => state.showGrid);
  const setShowGrid = useViewportStore((state) => state.setShowGrid);
  const triggerReverseReveal = useViewportStore((state) => state.triggerReverseReveal);
  const reverseRevealActive = useViewportStore((state) => state.reverseRevealActive);
  const setReverseRevealActive = useViewportStore((state) => state.setReverseRevealActive);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const previewTimerRef = useRef<number | null>(null);
  const collapseTimerRef = useRef<number | null>(null);
  const initialSequenceStartedRef = useRef(false);

  const clearInitialTimers = useCallback(() => {
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    if (collapseTimerRef.current !== null) {
      window.clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setReverseRevealActive(false);
  }, [setReverseRevealActive]);

  useEffect(() => {
    return () => {
      clearInitialTimers();
    };
  }, [clearInitialTimers]);

  useEffect(() => {
    clearInitialTimers();
    initialSequenceStartedRef.current = false;
    setIsPlaying(false);
  }, [visualizerSteps, clearInitialTimers, setIsPlaying]);

  const hasSteps = visualizerSteps.length > 0;
  const isPreviewingFullModel = hasSteps && ((activeStepIndex === -1) || reverseRevealActive);
  const currentStepIndex = hasSteps && activeStepIndex >= 0 ? activeStepIndex : 0;
  const currentStep = hasSteps ? visualizerSteps[currentStepIndex] : undefined;
  const currentStepMetadata =
    hasSteps && activeStepIndex >= 0 && currentStep
      ? stepMetadata.get(currentStep.id)
      : undefined;
  const totalSteps = visualizerSteps.length;
  const totalMeshCount = useMemo(
    () =>
      visualizerSteps.reduce((total, step) => {
        const meta = stepMetadata.get(step.id);
        if (meta) {
          return total + meta.meshCount;
        }
        return total + step.meshIds.length;
      }, 0),
    [visualizerSteps, stepMetadata]
  );
  const stepColors = useMemo(
    () =>
      visualizerSteps.map(
        (_, index) => STEP_COLOR_PALETTE[index % STEP_COLOR_PALETTE.length]
      ),
    [visualizerSteps]
  );
  const totalVisibleSteps = Math.max(totalSteps - 1, 0);
  const progressPercentage =
    hasSteps && !isPreviewingFullModel && totalVisibleSteps > 0
      ? (Math.min(currentStepIndex, totalVisibleSteps) / totalVisibleSteps) * 100
      : 0;
  const currentColor = stepColors[currentStepIndex] ?? STEP_COLOR_PALETTE[0];
  const currentStepTitle = isPreviewingFullModel
    ? "Full Model Preview"
    : currentStep
    ? currentStep.title ?? (currentStepIndex === 0 ? "Start" : `Layer ${currentStepIndex}`)
    : "";
  const currentMeshCount = isPreviewingFullModel
    ? totalMeshCount
    : currentStepMetadata?.meshCount ?? currentStep?.meshIds.length ?? 0;
  const isAtBeginning = !hasSteps || activeStepIndex <= 0 || reverseRevealActive;
  const isAtEnd = !hasSteps || activeStepIndex >= totalSteps - 1 || isPreviewingFullModel;

  // Keyboard shortcuts
  const shortcuts = [
    { key: "Space", description: "Play/Pause animation" },
    { key: "←", description: "Previous step" },
    { key: "→", description: "Next step" },
    { key: "R", description: "Toggle auto-rotate" },
    { key: "G", description: "Toggle grid" },
    { key: "Esc", description: "Go back to home" },
  ];

  useEffect(() => {
    if (!hasSteps) {
      clearInitialTimers();
      initialSequenceStartedRef.current = false;
      if (activeStepIndex !== -1) {
        setActiveStepIndex(-1);
      }
      return;
    }

    if (activeStepIndex >= totalSteps) {
      setActiveStepIndex(totalSteps - 1);
      return;
    }

    if (activeStepIndex === -1 && !initialSequenceStartedRef.current) {
      clearInitialTimers();
      previewTimerRef.current = window.setTimeout(() => {
        setReverseRevealActive(true);
        triggerReverseReveal();
        collapseTimerRef.current = window.setTimeout(() => {
          setActiveStepIndex(0);
          setIsPlaying(false);
          setReverseRevealActive(false);
        }, HOLOGRAM_REVERSE_DURATION + HOLOGRAM_REVERSE_BUFFER);
      }, FULL_MODEL_PREVIEW_DELAY);

      initialSequenceStartedRef.current = true;
    } else if (activeStepIndex !== -1) {
      clearInitialTimers();
    }
  }, [
    hasSteps,
    activeStepIndex,
    totalSteps,
    clearInitialTimers,
    setActiveStepIndex,
    setIsPlaying,
    triggerReverseReveal,
    setReverseRevealActive,
  ]);

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const {
        activeVisualizerStepIndex: latestIndex,
        visualizerSteps: latestSteps,
        setActiveVisualizerStepIndex,
      } = useModelStore.getState();

      if (latestSteps.length === 0 || latestIndex >= latestSteps.length - 1) {
        clearInterval(interval);
        setIsPlaying(false);
        return;
      }

      setActiveVisualizerStepIndex(latestIndex + 1);
    }, 2000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const handlePlayPause = useCallback(() => {
    if (!hasSteps) {
      return;
    }

    if (!isPlaying && activeStepIndex >= totalSteps - 1) {
      setActiveStepIndex(0);
    }

    setIsPlaying((prev) => !prev);
  }, [
    activeStepIndex,
    hasSteps,
    isPlaying,
    setActiveStepIndex,
    setIsPlaying,
    totalSteps,
  ]);

  const handleStepChange = useCallback(
    (value: number[]) => {
      if (!hasSteps) {
        return;
      }

      const nextIndex = Math.min(
        Math.max(Math.round(value[0]), 0),
        totalSteps - 1
      );

      setActiveStepIndex(nextIndex);
      setIsPlaying(false);
    },
    [hasSteps, setActiveStepIndex, setIsPlaying, totalSteps]
  );

  const handlePrevious = useCallback(() => {
    if (!hasSteps || activeStepIndex <= 0) {
      return;
    }

    setActiveStepIndex(activeStepIndex - 1);
    setIsPlaying(false);
  }, [
    activeStepIndex,
    hasSteps,
    setActiveStepIndex,
    setIsPlaying,
  ]);

  const handleNext = useCallback(() => {
    if (!hasSteps || activeStepIndex >= totalSteps - 1) {
      return;
    }

    setActiveStepIndex(activeStepIndex + 1);
    setIsPlaying(false);
  }, [
    activeStepIndex,
    hasSteps,
    setActiveStepIndex,
    setIsPlaying,
    totalSteps,
  ]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
          setAutoRotateCamera(!autoRotate);
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
  }, [
    autoRotate,
    showGrid,
    handleNext,
    handlePlayPause,
    handlePrevious,
    onBack,
    resetModel,
    setAutoRotateCamera,
    setShowGrid,
  ]);

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
                {hasSteps ? (
                  isPreviewingFullModel ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: currentColor }}
                        />
                        <span className="font-semibold text-sm">Full Model Preview</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Showing all {totalMeshCount} {totalMeshCount === 1 ? "mesh" : "meshes"} before layer breakdown.
                      </p>
                      <Progress value={0} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Preparing layers</span>
                        <span>0%</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center space-x-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: currentColor }}
                        />
                        <span className="font-semibold text-sm">
                          Step {Math.max(currentStepIndex, 0)} of {Math.max(totalSteps - 1, 0)}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-2 truncate" title={currentStepTitle}>
                        {currentStepTitle}
                      </p>
                      <p className="text-xs text-muted-foreground mb-3">
                        {currentMeshCount} {currentMeshCount === 1 ? "mesh" : "meshes"}
                      </p>
                      <Progress value={progressPercentage} className="h-1.5" />
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">No mesh layers detected</p>
                    <p>
                      Load a model with mesh nodes to enable step-by-step visualization.
                    </p>
                  </div>
                )}
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
                      {hasSteps
                        ? isPreviewingFullModel
                          ? "Preview"
                          : `${Math.max(currentStepIndex, 0)} / ${Math.max(totalSteps - 1, 0)}`
                        : "—"}
                    </span>
                  </div>
                  <Slider
                    value={[currentStepIndex]}
                    min={0}
                    max={Math.max(totalSteps - 1, 0)}
                    step={1}
                    onValueChange={handleStepChange}
                    className="w-full"
                    disabled={!hasSteps || isPreviewingFullModel}
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
                    disabled={isAtBeginning}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handlePlayPause}
                    className="w-24"
                    disabled={!hasSteps || isPreviewingFullModel}
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
                    disabled={isAtEnd}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Steps List */}
              <div>
                <h3 className="font-semibold mb-3">Build Steps</h3>
                <div className="space-y-2">
                  {hasSteps ? (
                    visualizerSteps.map((step, index) => {
                      const metadata = stepMetadata.get(step.id);
                      const meshCount = metadata?.meshCount ?? step.meshIds.length;
                      const stepTitle = step.title ?? (index === 0 ? "Start" : `Layer ${index}`);
                      const isActive = currentStepIndex === index;

                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            setActiveStepIndex(index);
                            setIsPlaying(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground border-primary shadow-md"
                              : "bg-card hover:bg-accent border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: stepColors[index] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-sm">Step {index}</p>
                                  {isActive && isPlaying && (
                                    <div className="flex space-x-0.5">
                                      <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse" />
                                      <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse delay-75" />
                                      <div className="w-1 h-3 bg-primary-foreground rounded-full animate-pulse delay-150" />
                                    </div>
                                  )}
                                </div>
                                <p
                                  className={`text-xs truncate ${
                                    isActive
                                      ? "text-primary-foreground/80"
                                      : "text-muted-foreground"
                                  }`}
                                  title={stepTitle}
                                >
                                  {stepTitle}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={isActive ? "secondary" : "outline"}
                              className="text-xs ml-2 flex-shrink-0"
                            >
                              {meshCount}
                            </Badge>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <Card className="p-3 bg-muted/50 text-xs text-muted-foreground">
                      Upload a model to generate step data.
                    </Card>
                  )}
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
                      onCheckedChange={setAutoRotateCamera}
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
                  <strong>Tip:</strong> Use the timeline to step through your model&apos;s
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

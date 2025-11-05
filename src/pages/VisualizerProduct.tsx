import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import ModelView from "@/components/ModelView";
import { SimpleDropzone } from "@/components/SimpleDropzone";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";
import { ArrowLeft, Box, Download, Eye, EyeOff, Info, MapPin, Maximize2, Minimize2, RotateCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";

interface VisualizerProductProps {
  onBack: () => void;
}

export function VisualizerProduct({ onBack }: VisualizerProductProps) {
  const originalDocument = useModelStore((state) => state.originalDocument);
  const fileName = useModelStore((state) => state.fileName);
  const resetModel = useModelStore((state) => state.resetModel);
  const explodeAmount = useViewportStore((state) => state.explodeAmount);
  const setExplodeAmount = useViewportStore((state) => state.setExplodeAmount);
  const showWireframe = useViewportStore((state) => state.showWireframe);
  const setShowWireframe = useViewportStore((state) => state.setShowWireframe);
  const autoRotate = useViewportStore((state) => state.autoRotateCamera);
  const setAutoRotate = useViewportStore((state) => state.setAutoRotateCamera);
  const showHotspots = useViewportStore((state) => state.showHotspots);
  const setShowHotspots = useViewportStore((state) => state.setShowHotspots);
  const selectedHotspot = useViewportStore((state) => state.selectedHotspot);
  const setSelectedHotspot = useViewportStore((state) => state.setSelectedHotspot);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const isExploded = explodeAmount > 0;

  // Mock hotspots - will be replaced with actual data from model
  const mockHotspots = [
    {
      id: "1",
      name: "Main Body",
      position: { x: 0, y: 0, z: 0 },
      description: "The primary structure of the product",
      info: "Material: Aluminum alloy\nWeight: 2.5kg\nDimensions: 300x200x150mm",
      category: "Structure",
    },
    {
      id: "2",
      name: "Component A",
      position: { x: 1, y: 0.5, z: 0 },
      description: "Critical functional component",
      info: "Material: Carbon fiber\nWeight: 0.3kg\nPart #: CF-2024-A",
      category: "Components",
    },
    {
      id: "3",
      name: "Assembly Point",
      position: { x: -1, y: 0.5, z: 0 },
      description: "Key assembly junction",
      info: "Torque spec: 25 Nm\nFasteners: M8 x 20mm\nQuantity: 4",
      category: "Assembly",
    },
    {
      id: "4",
      name: "Power Unit",
      position: { x: 0, y: -0.5, z: 0 },
      description: "Electronic power module",
      info: "Voltage: 12V DC\nMax Current: 5A\nEfficiency: 92%",
      category: "Electronics",
    },
  ];

  // Keyboard shortcuts
  const shortcuts = [
    { key: "E", description: "Toggle explode view" },
    { key: "H", description: "Toggle hotspots" },
    { key: "R", description: "Toggle auto-rotate" },
    { key: "W", description: "Toggle wireframe" },
    { key: "Space", description: "Reset view" },
    { key: "1-4", description: "Select hotspot" },
    { key: "Esc", description: "Close hotspot/Go back" },
  ];

  // Keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case "e":
        case "E":
          handleExplodeToggle();
          break;
        case "h":
        case "H":
          setShowHotspots(!showHotspots);
          break;
        case "r":
        case "R":
          setAutoRotate(!autoRotate);
          break;
        case "w":
        case "W":
          setShowWireframe(!showWireframe);
          break;
        case " ":
          e.preventDefault();
          handleResetView();
          break;
        case "1":
        case "2":
        case "3":
        case "4":
          const hotspotIndex = parseInt(e.key) - 1;
          if (hotspotIndex < mockHotspots.length) {
            setSelectedHotspot(mockHotspots[hotspotIndex].id);
          }
          break;
        case "Escape":
          if (selectedHotspot) {
            setSelectedHotspot(null);
          } else {
            resetModel();
            onBack();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showHotspots, autoRotate, showWireframe, selectedHotspot, resetModel, onBack]);

  const handleExplodeToggle = () => {
    setIsAnimating(true);
    if (isExploded) {
      setExplodeAmount(0);
    } else {
      setExplodeAmount(100);
    }
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleExplodeChange = (value: number[]) => {
    setExplodeAmount(value[0]);
  };

  const handleResetView = () => {
    setIsAnimating(true);
    setExplodeAmount(0);
    setSelectedHotspot(null);
    setShowWireframe(false);
    setTimeout(() => setIsAnimating(false), 500);
    // TODO: Reset camera position
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetModel();
                onBack();
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Box className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">
                Product Visualizer
              </h1>
            </div>
          </div>
          {originalDocument && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{fileName}</Badge>
              <KeyboardShortcuts shortcuts={shortcuts} title="Product Visualizer Shortcuts" />
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <ThemeToggle />
            </div>
          )}
          {!originalDocument && (
            <div className="flex items-center space-x-2">
              <KeyboardShortcuts shortcuts={shortcuts} title="Product Visualizer Shortcuts" />
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
              <h2 className="text-2xl font-bold mb-2">Upload a Product Model</h2>
              <p className="text-muted-foreground">
                Upload a GLB or GLTF file to create an interactive product visualization
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* 3D Viewport */}
          <div className="flex-1 relative bg-muted/20">
            <ModelView />

            {/* Top Controls Overlay */}
            <div className="absolute top-4 left-4 z-10 flex items-center space-x-2">
              <Button
                variant={isExploded ? "default" : "outline"}
                size="sm"
                onClick={handleExplodeToggle}
                className={`shadow-md ${!isExploded ? "bg-card/95 backdrop-blur-sm hover:bg-accent" : ""}`}
                disabled={isAnimating}
              >
                {isExploded ? (
                  <>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Collapse
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Explode
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="bg-card/95 backdrop-blur-sm shadow-md hover:bg-accent"
                disabled={isAnimating}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant={showHotspots ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHotspots(!showHotspots)}
                className={`shadow-md ${!showHotspots ? "bg-card/95 backdrop-blur-sm hover:bg-accent" : ""}`}
              >
                {showHotspots ? (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Hotspots
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hotspots
                  </>
                )}
              </Button>
            </div>



            {/* Selected Hotspot Info */}
            {selectedHotspot && (
              <Card className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-10 p-4 bg-card/95 backdrop-blur-sm shadow-xl border-2 border-primary/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">
                        {mockHotspots.find(h => h.id === selectedHotspot)?.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {mockHotspots.find(h => h.id === selectedHotspot)?.category}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedHotspot(null)}
                    className="flex-shrink-0"
                  >
                    ✕
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {mockHotspots.find(h => h.id === selectedHotspot)?.description}
                </p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Technical Details</span>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-pre-line font-mono">
                    {mockHotspots.find(h => h.id === selectedHotspot)?.info}
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">Esc</kbd> to close
                </div>
              </Card>
            )}
          </div>

          {/* Right Control Panel */}
          <div className="w-80 border-l bg-card overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Explode View Controls */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Explode View
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Separation Distance
                      </label>
                      <span className="text-sm font-medium">{explodeAmount}%</span>
                    </div>
                    <Slider
                      value={[explodeAmount]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={handleExplodeChange}
                      className="w-full"
                      disabled={isAnimating}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExplodeChange([0])}
                      className="w-full"
                      disabled={explodeAmount === 0 || isAnimating}
                    >
                      <Minimize2 className="w-3 h-3 mr-1" />
                      Reset
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleExplodeChange([100])}
                      className="w-full"
                      disabled={explodeAmount === 100 || isAnimating}
                    >
                      <Maximize2 className="w-3 h-3 mr-1" />
                      Full
                    </Button>
                  </div>

                  {isExploded && (
                    <Card className="p-2 bg-blue-500/10 border-blue-500/20">
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                        <Zap className="w-3 h-3 mr-1" />
                        Exploded view active
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Hotspots */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Hotspots ({mockHotspots.length})
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-hotspots"
                      checked={showHotspots}
                      onCheckedChange={setShowHotspots}
                    />
                    <Label htmlFor="show-hotspots" className="text-sm cursor-pointer">
                      Show
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  {mockHotspots.map((hotspot, index) => (
                    <button
                      key={hotspot.id}
                      onClick={() => setSelectedHotspot(
                        selectedHotspot === hotspot.id ? null : hotspot.id
                      )}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedHotspot === hotspot.id
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : "bg-card hover:bg-accent border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selectedHotspot === hotspot.id
                              ? "bg-primary-foreground text-primary"
                              : "bg-blue-600 text-white"
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <p className="font-medium text-sm truncate">{hotspot.name}</p>
                            </div>
                            <Badge
                              variant={selectedHotspot === hotspot.id ? "secondary" : "outline"}
                              className="text-xs mb-1"
                            >
                              {hotspot.category}
                            </Badge>
                            <p className={`text-xs truncate ${
                              selectedHotspot === hotspot.id
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}>
                              {hotspot.description}
                            </p>
                          </div>
                        </div>
                        <Info className="w-4 h-4 ml-2 flex-shrink-0" />
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
                    <Label htmlFor="wireframe" className="text-sm text-muted-foreground cursor-pointer">
                      Wireframe Mode
                    </Label>
                    <Switch
                      id="wireframe"
                      checked={showWireframe}
                      onCheckedChange={setShowWireframe}
                    />
                  </div>
                </div>
              </div>

              {/* Model Info */}
              <div>
                <h3 className="font-semibold mb-3">Model Information</h3>
                <Card className="p-3 bg-muted/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">File</span>
                    <span className="font-medium truncate ml-2" title={fileName}>{fileName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Hotspots</span>
                    <Badge variant="secondary" className="text-xs">{mockHotspots.length}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Explode</span>
                    <span className={`font-medium ${isExploded ? "text-blue-600 dark:text-blue-400" : ""}`}>
                      {isExploded ? `${explodeAmount}%` : "Collapsed"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Selected</span>
                    <span className="font-medium">
                      {selectedHotspot ? mockHotspots.find(h => h.id === selectedHotspot)?.name : "None"}
                    </span>
                  </div>
                </Card>
              </div>

              {/* Info */}
              <Card className="p-3 bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Tip:</strong> Click on hotspot markers to view detailed
                  information. Use the explode slider to see internal components.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

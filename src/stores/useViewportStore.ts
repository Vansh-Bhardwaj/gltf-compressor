import { PresetsType } from "@react-three/drei/helpers/environment-assets";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface ViewportStore {
  loadingFiles: boolean;
  revealScene: boolean;
  lightingPreset: "soft" | "upfront" | "portrait" | "rembrandt";
  environmentPreset: PresetsType;
  lightIntensity: number;
  showContactShadows: boolean;
  showGrid: boolean;
  autoRotateCamera: boolean;
  modelDimensions: [number, number, number] | null;
  modelViewPanelSize: number;
  showModifiedDocument: boolean;
  confettiCounter: number;
  triggerConfetti: () => void;
  reverseRevealCounter: number;
  triggerReverseReveal: () => void;
  reverseRevealActive: boolean;
  setReverseRevealActive: (value: boolean) => void;
  initialRevealComplete: boolean;
  setInitialRevealComplete: (value: boolean) => void;
  explodeAmount: number;
  setExplodeAmount: (value: number) => void;
  showWireframe: boolean;
  setShowWireframe: (value: boolean) => void;
  showHotspots: boolean;
  setShowHotspots: (value: boolean) => void;
  selectedHotspot: string | null;
  setSelectedHotspot: (value: string | null) => void;
  setShowGrid: (value: boolean) => void;
  setAutoRotateCamera: (value: boolean) => void;
}

export const useViewportStore = create<ViewportStore>()(
  subscribeWithSelector((set) => {
    return {
      loadingFiles: false,
      revealScene: false,
      lightingPreset: "rembrandt",
      environmentPreset: "city",
      lightIntensity: 1,
      showContactShadows: true,
      showGrid: true,
      autoRotateCamera: false,
      modelDimensions: null,
      modelViewPanelSize: 66,
      showModifiedDocument: true,
      confettiCounter: 0,
      triggerConfetti: () =>
        set((state) => ({ confettiCounter: state.confettiCounter + 1 })),
      reverseRevealCounter: 0,
      triggerReverseReveal: () =>
        set((state) => ({
          reverseRevealCounter: state.reverseRevealCounter + 1,
        })),
      reverseRevealActive: false,
      setReverseRevealActive: (value: boolean) => set({ reverseRevealActive: value }),
      initialRevealComplete: false,
      setInitialRevealComplete: (value: boolean) => set({ initialRevealComplete: value }),
      explodeAmount: 0,
      setExplodeAmount: (value: number) => set({ explodeAmount: value }),
      showWireframe: false,
      setShowWireframe: (value: boolean) => set({ showWireframe: value }),
      showHotspots: true,
      setShowHotspots: (value: boolean) => set({ showHotspots: value }),
      selectedHotspot: null,
      setSelectedHotspot: (value: string | null) => set({ selectedHotspot: value }),
      setShowGrid: (value: boolean) => set({ showGrid: value }),
      setAutoRotateCamera: (value: boolean) => set({ autoRotateCamera: value }),
    };
  })
);

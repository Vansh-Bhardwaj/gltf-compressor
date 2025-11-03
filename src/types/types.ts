import { Texture } from "@gltf-transform/core";

export interface TextureCompressionSettings {
  compressedTexture: Texture | null;
  compressionEnabled: boolean;
  mimeType: string;
  maxResolution: number;
  quality: number;
  isBeingCompressed: boolean;
}

export interface ModelStats {
  numMeshes: number;
  numVertices: number;
  numTextures: number;
  numAnimationClips: number;
  sizeOfMeshes: number;
  sizeOfTextures: number;
  sizeOfAnimations: number;
  totalSize: number;
  percentOfSizeTakenByMeshes: number;
  percentOfSizeTakenByTextures: number;
  percentOfSizeTakenByAnimations: number;
  initialSizeOfTextures: number;
  percentChangeInTextures: number;
  texturesInModifiedDocument: Texture[];
  initialTotalSize: number;
  percentChangeInTotalSize: number;
}

export interface TextureBounds {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
  statusShouldBeAboveBottomEdge: boolean;
}

// Theme Engine Types
export interface ThemeColors {
  primary: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemeTypography {
  fontFamily: string;
  baseFontSize: number;
  headingFontFamily?: string;
}

export interface ThemeLogo {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ThemeComponents {
  button?: {
    borderRadius?: string;
  };
  card?: {
    borderRadius?: string;
  };
}

export interface AppTheme {
  id: string;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  logo?: ThemeLogo;
  components?: ThemeComponents;
  published?: boolean;
}

// Visualizer Types
export interface VisualizerStep {
  id: string;
  title?: string;
  description?: string;
  meshIds: string[];
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  animationParams?: {
    duration: number;
    easing?: string;
  };
}

export interface VisualizerHotspot {
  id: string;
  label: string;
  description?: string;
  worldPosition: [number, number, number];
  relatedMeshIds: string[];
}

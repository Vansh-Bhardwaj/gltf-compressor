import { Document, Material, Mesh, Node, Texture } from "@gltf-transform/core";
import { inspect } from "@gltf-transform/functions";
import { DocumentView } from "@gltf-transform/view";
import { produce } from "immer";
import { Group } from "three";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import {
  ModelStats,
  TextureBounds,
  TextureCompressionSettings,
  VisualizerStep,
  VisualizerStepMetadata,
} from "@/types/types";
import { useViewportStore } from "./useViewportStore";

interface ModelStore {
  fileName: string;
  originalDocument: Document | null;
  modifiedDocument: Document | null;
  originalDocumentView: DocumentView | null;
  modifiedDocumentView: DocumentView | null;
  originalScene: Group | null;
  modifiedScene: Group | null;
  textureCompressionSettingsMap: Map<Texture, TextureCompressionSettings>;
  selectedMaterial: Material | null;
  selectedTextureSlot: string;
  selectedTexture: Texture | null;
  textureBounds: TextureBounds | null;
  modelStats: ModelStats;
  visualizerSteps: VisualizerStep[];
  visualizerStepMetadata: Map<string, VisualizerStepMetadata>;
  nodeStepMap: Map<Node, string>;
  meshStepMap: Map<Mesh, string>;
  activeVisualizerStepIndex: number;

  updateTextureCompressionSettings: (
    texture: Texture,
    settings: Partial<TextureCompressionSettings>
  ) => void;
  setInitialModelStats: () => void;
  updateModelStats: () => void;
  resetModel: () => void;
  setLayerVisualizerData: (params: {
    steps: VisualizerStep[];
    metadataByStep: Map<string, VisualizerStepMetadata>;
    nodeStepMap: Map<Node, string>;
    meshStepMap: Map<Mesh, string>;
  }) => void;
  setActiveVisualizerStepIndex: (index: number) => void;
}

export const useModelStore = create<ModelStore>()(
  subscribeWithSelector((set, get) => {
    return {
      fileName: "",
      originalDocument: null,
      modifiedDocument: null,
      originalDocumentView: null,
      modifiedDocumentView: null,
      originalScene: null,
      modifiedScene: null,
      textureCompressionSettingsMap: new Map<
        Texture,
        TextureCompressionSettings
      >(),
      selectedMaterial: null,
      selectedTextureSlot: "",
      selectedTexture: null,
      textureBounds: null,
      modelStats: {
        numMeshes: 0,
        numVertices: 0,
        numTextures: 0,
        numAnimationClips: 0,
        sizeOfMeshes: 0,
        sizeOfTextures: 0,
        sizeOfAnimations: 0,
        totalSize: 0,
        percentOfSizeTakenByMeshes: 0,
        percentOfSizeTakenByTextures: 0,
        percentOfSizeTakenByAnimations: 0,
        initialSizeOfTextures: 0,
        percentChangeInTextures: 0,
        texturesInModifiedDocument: [],
        initialTotalSize: 0,
        percentChangeInTotalSize: 0,
      },
      visualizerSteps: [],
      visualizerStepMetadata: new Map<string, VisualizerStepMetadata>(),
      nodeStepMap: new Map<Node, string>(),
      meshStepMap: new Map<Mesh, string>(),
      activeVisualizerStepIndex: -1,

      updateTextureCompressionSettings: (
        texture: Texture,
        settings: Partial<TextureCompressionSettings>
      ) => {
        const { textureCompressionSettingsMap } = get();
        const existingSettings = textureCompressionSettingsMap.get(texture);
        if (!existingSettings) return;

        set(
          produce((state: ModelStore) => {
            state.textureCompressionSettingsMap.set(texture, {
              ...existingSettings,
              ...settings,
            } as TextureCompressionSettings);
          })
        );
      },
      setInitialModelStats: () => {
        const { originalDocument, modifiedDocument } = get();

        if (!originalDocument || !modifiedDocument) return;

        const report = inspect(originalDocument);

        const numRenderVertices = report.scenes.properties.reduce(
          (total, scene) => total + scene.renderVertexCount,
          0
        );

        const sizeOfMeshes = report.meshes.properties.reduce(
          (total, mesh) => total + mesh.size / 1000,
          0
        );

        const sizeOfTextures = report.textures.properties.reduce(
          (total, texture) => total + texture.size / 1000,
          0
        );

        const sizeOfAnimations = report.animations.properties.reduce(
          (total, animation) => total + animation.size / 1000,
          0
        );

        const totalSize = sizeOfMeshes + sizeOfTextures + sizeOfAnimations;
        const percentOfSizeTakenByMeshes = (sizeOfMeshes / totalSize) * 100;
        const percentOfSizeTakenByTextures = (sizeOfTextures / totalSize) * 100;
        const percentOfSizeTakenByAnimations =
          (sizeOfAnimations / totalSize) * 100;

        const texturesInModifiedDocument = modifiedDocument
          .getRoot()
          .listTextures();

        set({
          modelStats: {
            numMeshes: report.meshes.properties.length,
            numVertices: numRenderVertices,
            numTextures: report.textures.properties.length,
            numAnimationClips: report.animations.properties.length,
            sizeOfMeshes,
            sizeOfTextures,
            sizeOfAnimations,
            totalSize,
            percentOfSizeTakenByMeshes,
            percentOfSizeTakenByTextures,
            percentOfSizeTakenByAnimations,
            initialSizeOfTextures: sizeOfTextures,
            percentChangeInTextures: 0,
            texturesInModifiedDocument,
            initialTotalSize: totalSize,
            percentChangeInTotalSize: 0,
          },
        });
      },
      updateModelStats: () => {
        const { modelStats } = get();

        let sizeOfTextures = 0;
        modelStats.texturesInModifiedDocument.forEach((texture: Texture) => {
          const imageData = texture.getImage();
          if (imageData?.byteLength) {
            sizeOfTextures += imageData.byteLength / 1000;
          }
        });

        const totalSize =
          modelStats.sizeOfMeshes +
          sizeOfTextures +
          modelStats.sizeOfAnimations;

        const percentChangeInTextures =
          modelStats.initialSizeOfTextures > 0
            ? ((modelStats.initialSizeOfTextures - sizeOfTextures) /
                modelStats.initialSizeOfTextures) *
              100
            : 0;

        const percentChangeInTotalSize =
          modelStats.initialTotalSize > 0
            ? ((modelStats.initialTotalSize - totalSize) /
                modelStats.initialTotalSize) *
              100
            : 0;

        set({
          modelStats: {
            ...modelStats,
            sizeOfTextures,
            totalSize,
            percentOfSizeTakenByMeshes:
              (modelStats.sizeOfMeshes / totalSize) * 100,
            percentOfSizeTakenByTextures: (sizeOfTextures / totalSize) * 100,
            percentOfSizeTakenByAnimations:
              (modelStats.sizeOfAnimations / totalSize) * 100,
            percentChangeInTextures,
            percentChangeInTotalSize,
          },
        });
      },
      resetModel: () => {
        const state = get();

        // Clean up Three.js objects to prevent memory leaks
        if (state.originalScene) {
          state.originalScene.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        if (state.modifiedScene) {
          state.modifiedScene.traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat: any) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
        }

        // Reset viewport states (loading, reveal, etc.)
        useViewportStore.setState({
          loadingFiles: false,
          revealScene: false,
          reverseRevealCounter: 0,
          reverseRevealActive: false,
          initialRevealComplete: false,
        });

        set({
          fileName: "",
          originalDocument: null,
          modifiedDocument: null,
          originalDocumentView: null,
          modifiedDocumentView: null,
          originalScene: null,
          modifiedScene: null,
          textureCompressionSettingsMap: new Map<Texture, TextureCompressionSettings>(),
          selectedMaterial: null,
          selectedTextureSlot: "",
          selectedTexture: null,
          textureBounds: null,
          modelStats: {
            numMeshes: 0,
            numVertices: 0,
            numTextures: 0,
            numAnimationClips: 0,
            texturesInModifiedDocument: [],
            initialSizeOfTextures: 0,
            initialTotalSize: 0,
            sizeOfMeshes: 0,
            sizeOfTextures: 0,
            sizeOfAnimations: 0,
            totalSize: 0,
            percentOfSizeTakenByMeshes: 0,
            percentOfSizeTakenByTextures: 0,
            percentOfSizeTakenByAnimations: 0,
            percentChangeInTextures: 0,
            percentChangeInTotalSize: 0,
          },
          visualizerSteps: [],
          visualizerStepMetadata: new Map<string, VisualizerStepMetadata>(),
          nodeStepMap: new Map<Node, string>(),
          meshStepMap: new Map<Mesh, string>(),
          activeVisualizerStepIndex: -1,
        });
      },
      setLayerVisualizerData: ({
        steps,
        metadataByStep,
        nodeStepMap,
        meshStepMap,
      }) => {
        set({
          visualizerSteps: steps,
          visualizerStepMetadata: new Map(metadataByStep),
          nodeStepMap: new Map(nodeStepMap),
          meshStepMap: new Map(meshStepMap),
          activeVisualizerStepIndex: -1,
        });
      },
      setActiveVisualizerStepIndex: (index: number) => {
        const { visualizerSteps } = get();
        if (visualizerSteps.length === 0) {
          set({ activeVisualizerStepIndex: -1 });
          return;
        }

          if (index < 0) {
            set({ activeVisualizerStepIndex: -1 });
            return;
          }

        const clampedIndex = Math.min(
          Math.max(index, 0),
          visualizerSteps.length - 1
        );
        set({ activeVisualizerStepIndex: clampedIndex });
      },
    };
  })
);

import { GizmoHelper, GizmoViewport } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Mesh as MeshDef, Node as NodeDef } from "@gltf-transform/core";
import { Suspense, useCallback, useEffect, useMemo, useRef } from "react";
import { Group, Material, Mesh, Object3D, Plane, Vector3 } from "three";
import { useShallow } from "zustand/react/shallow";

import { useModelStore } from "@/stores/useModelStore";
import { useViewportStore } from "@/stores/useViewportStore";

import { easings, useSpring } from "@react-spring/web";
import { Preload } from "@react-three/drei";
import CameraControls from "./CameraControls";
import Confetti from "./Confetti";
import { Grid } from "./drei/Grid";
import { Stage } from "./drei/Stage";
import { Hologram } from "./Hologram";
import MaterialHighlighter from "./MaterialHighlighter";

const isMeshObject = (object: Object3D): object is Mesh => {
  return (object as Mesh).isMesh === true;
};

export default function ModelView() {
  const [
    originalScene,
    modifiedScene,
    modifiedDocumentView,
    visualizerSteps,
    nodeStepMap,
    meshStepMap,
    activeStepIndex,
  ] = useModelStore(
    useShallow((state) => [
      state.originalScene,
      state.modifiedScene,
      state.modifiedDocumentView,
      state.visualizerSteps,
      state.nodeStepMap,
      state.meshStepMap,
      state.activeVisualizerStepIndex,
    ])
  );

  const { reverseRevealCounter, reverseRevealActive } = useViewportStore(
    useShallow((state) => ({
      reverseRevealCounter: state.reverseRevealCounter,
      reverseRevealActive: state.reverseRevealActive,
    }))
  );

  const originalSceneRef = useRef<Group | null>(null);
  const modifiedSceneRef = useRef<Group | null>(null);

  // Toggle the visibility of the original scene and the modified scene when the C key is pressed/released
  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.showModifiedDocument,
      (showModifiedDocument) => {
        if (originalSceneRef.current) {
          originalSceneRef.current.visible = !showModifiedDocument;
        }
        if (modifiedSceneRef.current) {
          modifiedSceneRef.current.visible = showModifiedDocument;
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const hologramRef = useRef<{
    playAnimation: () => void;
    playReverseAnimation: () => void;
  } | null>(null);
  const gridRef = useRef<{ playAnimation: () => void } | null>(null);

  const originalSceneMaterialsRef = useRef<Material[]>([]);
  const modifiedSceneMaterialsRef = useRef<Material[]>([]);
  const modelHeightRef = useRef<number>(0);

  const clippingPlane: Plane[] = useMemo(() => {
    return [new Plane(new Vector3(0, -1, 0), 0.0)];
  }, []);

  const stepIndexById = useMemo(() => {
    const map = new Map<string, number>();
    visualizerSteps.forEach((step, index) => {
      map.set(step.id, index);
    });
    return map;
  }, [visualizerSteps]);

  const prepareSceneMaterials = useCallback((): boolean => {
    if (!originalScene || !modifiedScene) {
      return false;
    }

    originalSceneMaterialsRef.current = [];
    modifiedSceneMaterialsRef.current = [];

    const collectMaterials = (scene: Group, target: Material[]): void => {
      scene.traverse((object) => {
        if (!isMeshObject(object)) {
          return;
        }

        const mesh = object;
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        if (
          mesh.geometry &&
          materials.some(
            (material) => material?.name === "__DefaultMaterial"
          ) &&
          !mesh.geometry.getAttribute("normal")
        ) {
          mesh.geometry.computeVertexNormals();
        }

        materials.forEach((material) => {
          if (material) {
            target.push(material);
          }
        });
      });
    };

    collectMaterials(originalScene, originalSceneMaterialsRef.current);
    collectMaterials(modifiedScene, modifiedSceneMaterialsRef.current);

    modelHeightRef.current =
      useViewportStore.getState().modelDimensions?.[1] ?? 0;

    return true;
  }, [modifiedScene, originalScene]);

  const [revealSpring, revealSpringAPI] = useSpring(
    () => ({
      from: { progress: 0.0 },
      config: {
        easing: easings.easeOutCubic,
        duration: 1000,
      },
      onStart: () => {
        if (modifiedSceneRef.current) {
          modifiedSceneRef.current.visible = true;
        }
      },
      onChange: () => {
        if (!originalScene || !modifiedScene) {
          return;
        }

        const modelHeight = modelHeightRef.current;
        clippingPlane[0].constant =
          -modelHeight * 0.5 + revealSpring.progress.get() * modelHeight;

        originalSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = clippingPlane;
        });
        modifiedSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = clippingPlane;
        });
      },
      onRest: () => {
        if (!originalScene || !modifiedScene) {
          return;
        }

        if (useViewportStore.getState().reverseRevealActive) {
          return;
        }

        originalSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = [];
        });
        modifiedSceneMaterialsRef.current.forEach((material) => {
          material.clippingPlanes = [];
        });
      },
    }),
    [originalScene, modifiedScene, clippingPlane]
  );

  useEffect(() => {
    const unsubscribe = useViewportStore.subscribe(
      (state) => state.revealScene,
      (revealScene) => {
        if (!revealScene) {
          return;
        }

        if (!prepareSceneMaterials()) {
          return;
        }

        if (hologramRef.current) {
          hologramRef.current.playAnimation();
        }
        if (gridRef.current) {
          gridRef.current.playAnimation();
        }

        // Start clipping after 1 second (when hologram fade-in completes)
        revealSpringAPI.start({
          to: { progress: 1.0 },
          delay: 1000,
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [prepareSceneMaterials, revealSpringAPI]);

  useEffect(() => {
    if (reverseRevealCounter === 0) {
      return;
    }

    if (!prepareSceneMaterials()) {
      return;
    }

    if (hologramRef.current) {
      hologramRef.current.playReverseAnimation();
    }
    if (gridRef.current) {
      gridRef.current.playAnimation();
    }

    // Start clipping immediately - hologram descends for 1s, then fades for 1s
    // Clipping should hide the model during the first 1s (descent phase)
    revealSpringAPI.start({
      to: { progress: 0.0 },
      delay: 0,
      config: {
        easing: easings.easeInCubic,
        duration: 1000,
      },
    });
  }, [reverseRevealCounter, prepareSceneMaterials, revealSpringAPI]);

  const wasReverseRevealActiveRef = useRef(reverseRevealActive);

  useEffect(() => {
    if (
      wasReverseRevealActiveRef.current &&
      !reverseRevealActive &&
      originalScene &&
      modifiedScene
    ) {
      originalSceneMaterialsRef.current.forEach((material) => {
        material.clippingPlanes = [];
      });
      modifiedSceneMaterialsRef.current.forEach((material) => {
        material.clippingPlanes = [];
      });
    }

    wasReverseRevealActiveRef.current = reverseRevealActive;
  }, [reverseRevealActive, originalScene, modifiedScene]);

  useEffect(() => {
    if (!modifiedScene || !modifiedDocumentView) {
      return;
    }

    if (stepIndexById.size === 0 || activeStepIndex === -1) {
      modifiedScene.traverse((object) => {
        object.visible = true;
      });
      return;
    }

    modifiedScene.traverse((object) => {
      const property = modifiedDocumentView.getProperty(object);
      if (!property) {
        object.visible = true;
        return;
      }

      let stepId: string | undefined;

      if (property instanceof MeshDef) {
        stepId = meshStepMap.get(property);
      } else if (property instanceof NodeDef) {
        stepId = nodeStepMap.get(property);
      }

      if (!stepId) {
        object.visible = true;
        return;
      }

      const stepIndex = stepIndexById.get(stepId);
      if (stepIndex === undefined) {
        object.visible = true;
        return;
      }

      object.visible = stepIndex <= activeStepIndex;
    });
  }, [
    modifiedScene,
    modifiedDocumentView,
    stepIndexById,
    nodeStepMap,
    meshStepMap,
    activeStepIndex,
  ]);

  if (!originalScene || !modifiedScene) return null;

  return (
    <div id="model-view">
      <Canvas
        camera={{ position: [0, 0, 150], fov: 50, near: 0.1, far: 1000 }}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          localClippingEnabled: true,
        }}
      >
        <color attach="background" args={["#444444"]} />
        <Suspense fallback={null}>
          <Stage>
            <primitive
              ref={originalSceneRef}
              object={originalScene}
              visible={false}
            />
            <primitive
              ref={modifiedSceneRef}
              object={modifiedScene}
              visible={false}
            />
          </Stage>
          <Hologram ref={hologramRef} />
          <Grid ref={gridRef} />
          <CameraControls />
          <MaterialHighlighter />
          <Confetti />
          <Preload all />
        </Suspense>
        <GizmoHelper alignment="bottom-right" margin={[63.5, 63.5]}>
          <GizmoViewport
            axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  );
}

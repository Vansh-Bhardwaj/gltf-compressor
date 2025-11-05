import { useViewportStore } from "@/stores/useViewportStore";
import { useSpring } from "@react-spring/web";
import { useEffect, useRef } from "react";
import { Box3, Group, Mesh, Object3D, Vector3 } from "three";
import { useShallow } from "zustand/react/shallow";

interface ExplodedViewProps {
  scene: Group | null;
}

interface MeshInfo {
  mesh: Mesh;
  originalPosition: Vector3;
  centerOffset: Vector3;
  explosionDirection: Vector3;
}

export function ExplodedView({ scene }: ExplodedViewProps) {
  const { explodeAmount, showWireframe } = useViewportStore(
    useShallow((state) => ({
      explodeAmount: state.explodeAmount,
      showWireframe: state.showWireframe,
    }))
  );

  const meshInfoRef = useRef<MeshInfo[]>([]);
  const sceneCenter = useRef(new Vector3());
  const initialized = useRef(false);

  // Initialize mesh information once when scene changes
  useEffect(() => {
    if (!scene || initialized.current) return;

    const meshes: MeshInfo[] = [];
    const boundingBox = new Box3();
    
    // Calculate scene bounding box and collect all meshes
    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh && object.geometry) {
        // Store original position
        const originalPosition = object.position.clone();
        
        // Calculate bounding box for this mesh
        object.geometry.computeBoundingBox();
        if (object.geometry.boundingBox) {
          const meshBox = object.geometry.boundingBox.clone();
          meshBox.applyMatrix4(object.matrixWorld);
          boundingBox.union(meshBox);
          
          // Calculate center offset from scene center
          const meshCenter = new Vector3();
          meshBox.getCenter(meshCenter);
          
          meshes.push({
            mesh: object,
            originalPosition,
            centerOffset: meshCenter.clone(),
            explosionDirection: new Vector3(),
          });
        }
      }
    });

    // Calculate scene center
    boundingBox.getCenter(sceneCenter.current);

    // Calculate explosion directions for each mesh
    meshes.forEach((meshInfo) => {
      // Direction from scene center to mesh center
      meshInfo.explosionDirection
        .copy(meshInfo.centerOffset)
        .sub(sceneCenter.current)
        .normalize();
      
      // If mesh is at center, give it a random direction
      if (meshInfo.explosionDirection.length() === 0) {
        meshInfo.explosionDirection.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize();
      }
      
      // Update center offset to be relative to scene center
      meshInfo.centerOffset.sub(sceneCenter.current);
    });

    meshInfoRef.current = meshes;
    initialized.current = true;
  }, [scene]);

  // Reset initialization when scene changes
  useEffect(() => {
    initialized.current = false;
  }, [scene]);

  // Animate explosion using spring
  const [explosionSpring] = useSpring(() => ({
    progress: explodeAmount / 100,
    config: {
      tension: 200,
      friction: 25,
    },
    onChange: ({ value }) => {
      const progress = value.progress;
      
      meshInfoRef.current.forEach((meshInfo) => {
        const { mesh, originalPosition, explosionDirection } = meshInfo;
        
        // Calculate explosion distance based on scene size
        const sceneSize = new Vector3();
        if (scene) {
          const box = new Box3().setFromObject(scene);
          box.getSize(sceneSize);
        }
        const maxDistance = Math.max(sceneSize.x, sceneSize.y, sceneSize.z) * 0.5;
        
        // Apply explosion offset
        const explosionOffset = explosionDirection
          .clone()
          .multiplyScalar(maxDistance * progress);
        
        mesh.position
          .copy(originalPosition)
          .add(explosionOffset);
      });
    },
  }), [explodeAmount]);

  // Update wireframe mode
  useEffect(() => {
    if (!scene) return;

    scene.traverse((object: Object3D) => {
      if (object instanceof Mesh && object.material) {
        const materials = Array.isArray(object.material) 
          ? object.material 
          : [object.material];
        
        materials.forEach((material) => {
          if (material && 'wireframe' in material) {
            material.wireframe = showWireframe;
          }
        });
      }
    });
  }, [scene, showWireframe]);

  return null; // This component only manages the animation, doesn't render anything
}
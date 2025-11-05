import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Group, Mesh, Vector3 } from "three";
import { useViewportStore } from "../stores/useViewportStore";

export interface Hotspot {
  id: string;
  name: string;
  position: Vector3;
  description: string;
  info: string;
  category: string;
}

interface ProductHotspotsProps {
  scene: Group | null;
}

interface HotspotMarkerProps {
  hotspot: Hotspot;
  index: number;
  isSelected: boolean;
  isVisible: boolean;
  onSelect: () => void;
}

function HotspotMarker({ hotspot, index, isSelected, isVisible, onSelect }: HotspotMarkerProps) {
  const { camera } = useThree();
  const markerRef = useRef<Group>(null);
  const [screenPosition, setScreenPosition] = useState({ x: 0, y: 0, visible: true });
  
  // Update screen position on each frame
  useFrame(() => {
    if (!markerRef.current || !isVisible) return;
    
    const position = hotspot.position.clone();
    const distance = camera.position.distanceTo(position);
    
    // Check if hotspot is behind camera
    const cameraDirection = new Vector3();
    camera.getWorldDirection(cameraDirection);
    const toHotspot = position.clone().sub(camera.position).normalize();
    const dotProduct = cameraDirection.dot(toHotspot);
    
    // Only show if hotspot is in front of camera
    const isInFront = dotProduct > 0;
    
    if (!isInFront || distance > 1000) {
      setScreenPosition(prev => ({ ...prev, visible: false }));
      return;
    }
    
    setScreenPosition(prev => ({ ...prev, visible: true }));
  });
  
  if (!isVisible || !screenPosition.visible) {
    return null;
  }
  
  return (
    <group ref={markerRef} position={hotspot.position}>
      <Html
        center
        distanceFactor={10}
        zIndexRange={[100, 0]}
        className="pointer-events-auto"
      >
        <button
          onClick={onSelect}
          className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSelected
              ? "scale-110 bg-blue-600 text-white ring-4 ring-blue-600/30"
              : "scale-100 hover:scale-105 bg-white/95 text-gray-700 shadow-lg hover:shadow-xl"
          }`}
          title={`${hotspot.name} - Press ${index + 1}`}
        >
          {/* Pin Icon */}
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          
          {/* Number badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
            {index + 1}
          </div>
          
          {/* Pulse animation when selected */}
          {isSelected && (
            <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20" />
          )}
        </button>
      </Html>
    </group>
  );
}

export const ProductHotspots = forwardRef<any, ProductHotspotsProps>(
  ({ scene }, ref) => {
    const { showHotspots, selectedHotspot, setSelectedHotspot } = useViewportStore();
    const generatedHotspots = useRef<Hotspot[]>([]);
    const [isGenerated, setIsGenerated] = useState(false);
    
    // Generate hotspots from scene geometry
    useEffect(() => {
      if (!scene || isGenerated) return;
      
      const tempHotspots: Hotspot[] = [];
      let hotspotId = 1;
      
      scene.traverse((object) => {
        if (object instanceof Mesh && object.geometry) {
          // Sample a few points on the mesh surface
          const geometry = object.geometry;
          if (geometry.attributes.position) {
            const positions = geometry.attributes.position;
            const sampleCount = Math.min(3, Math.floor(positions.count / 100));
            
            for (let i = 0; i < sampleCount; i++) {
              const index = Math.floor(Math.random() * positions.count);
              const x = positions.getX(index);
              const y = positions.getY(index);
              const z = positions.getZ(index);
              
              const worldPosition = new Vector3(x, y, z);
              object.localToWorld(worldPosition);
              
              // Add some offset to place hotspot slightly away from surface
              const normal = new Vector3();
              if (geometry.attributes.normal) {
                normal.set(
                  geometry.attributes.normal.getX(index),
                  geometry.attributes.normal.getY(index),
                  geometry.attributes.normal.getZ(index)
                );
                object.localToWorld(normal);
                normal.sub(object.position).normalize();
                worldPosition.add(normal.multiplyScalar(0.1));
              }
              
              tempHotspots.push({
                id: (hotspotId++).toString(),
                name: object.name || `Component ${hotspotId}`,
                position: worldPosition,
                description: `Interactive point on ${object.name || 'component'}`,
                info: `Material: Standard\nVertices: ${positions.count}\nType: ${object.type}`,
                category: "Auto-generated",
              });
            }
          }
        }
      });
      
      // If no hotspots were generated, create some default ones
      if (tempHotspots.length === 0) {
        tempHotspots.push(
          {
            id: "1",
            name: "Center Point",
            position: new Vector3(0, 0, 0),
            description: "Central reference point",
            info: "Position: Origin\nType: Reference",
            category: "Default",
          },
          {
            id: "2",
            name: "Top View",
            position: new Vector3(0, 2, 0),
            description: "Upper viewing point",
            info: "Position: Top\nType: ViewPoint",
            category: "Default",
          }
        );
      }
      
      generatedHotspots.current = tempHotspots;
      setIsGenerated(true);
    }, [scene, isGenerated]);
    
    const activeHotspots = generatedHotspots.current;
    
    useImperativeHandle(ref, () => ({
      getHotspots: () => activeHotspots,
      regenerateHotspots: () => {
        setIsGenerated(false);
        generatedHotspots.current = [];
      },
    }));
    
    if (!showHotspots || activeHotspots.length === 0) {
      return null;
    }
    
    return (
      <group>
        {activeHotspots.map((hotspot: Hotspot, index: number) => (
          <HotspotMarker
            key={hotspot.id}
            hotspot={hotspot}
            index={index}
            isSelected={selectedHotspot === hotspot.id}
            isVisible={showHotspots}
            onSelect={() => 
              setSelectedHotspot(selectedHotspot === hotspot.id ? null : hotspot.id)
            }
          />
        ))}
      </group>
    );
  }
);

ProductHotspots.displayName = "ProductHotspots";
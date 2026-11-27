import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { assetUrl } from '@/utils/assetUrl';

export interface CustomGlbPropProps {
  /** Relative path under public/, e.g. "models/desk-lamp/desk_lamp_arm_01_1k.gltf" */
  readonly url: string;
  readonly position?: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly scale?: number | readonly [number, number, number];
  /** Optional node-name allowlist (exact or prefix match) to extract a subset of meshes from a kit model. */
  readonly onlyNodes?: readonly string[];
  /** Shifts bounding-box bottom to y = 0 in local space so the prop sits flush on surfaces. */
  readonly groundToZero?: boolean;
  /** Centers bounding-box X and Z around local (0, *, 0). */
  readonly centerXZ?: boolean;
  readonly envMapIntensity?: number;
  readonly fallback?: ReactNode;
}

class GlbErrorBoundary extends Component<
  { readonly fallback?: ReactNode; readonly children: ReactNode },
  { readonly hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

function GlbModelMesh({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onlyNodes,
  groundToZero = true,
  centerXZ = false,
  envMapIntensity = 0.85,
}: Omit<CustomGlbPropProps, 'fallback'>) {
  const resolvedUrl = assetUrl(url);
  const { scene } = useGLTF(resolvedUrl);

  const prepared = useMemo(() => {
    const root = new THREE.Group();

    if (onlyNodes && onlyNodes.length > 0) {
      scene.updateMatrixWorld(true);
      scene.traverse((obj) => {
        if (!obj.name) return;
        const matches = onlyNodes.some(
          (pattern) => obj.name === pattern || obj.name.startsWith(pattern),
        );
        if (matches && (obj as THREE.Mesh).isMesh) {
          const clone = obj.clone(true);
          // Preserve world transform relative to scene root
          clone.position.set(0, 0, 0);
          clone.quaternion.identity();
          clone.scale.set(1, 1, 1);
          clone.applyMatrix4(obj.matrixWorld);
          root.add(clone);
        }
      });
    } else {
      root.add(scene.clone(true));
    }

    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (mat && 'envMapIntensity' in mat) {
            (mat as THREE.MeshStandardMaterial).envMapIntensity = envMapIntensity;
          }
        });
      }
    });

    if (groundToZero || centerXZ) {
      const box = new THREE.Box3().setFromObject(root);
      if (!box.isEmpty()) {
        const center = new THREE.Vector3();
        box.getCenter(center);
        const offsetX = centerXZ ? -center.x : 0;
        const offsetY = groundToZero ? -box.min.y : 0;
        const offsetZ = centerXZ ? -center.z : 0;
        root.children.forEach((child) => {
          child.position.x += offsetX;
          child.position.y += offsetY;
          child.position.z += offsetZ;
        });
      }
    }

    return root;
  }, [scene, onlyNodes, groundToZero, centerXZ, envMapIntensity]);

  return (
    <primitive
      object={prepared}
      position={[position[0], position[1], position[2]]}
      rotation={[rotation[0], rotation[1], rotation[2]]}
      scale={typeof scale === 'number' ? [scale, scale, scale] : [scale[0], scale[1], scale[2]]}
    />
  );
}

/**
 * Drop-in loader for sculpted Blender or Poly Haven CC0 .gltf / .glb 3D models.
 * Automatically normalizes grounding, configures shadows, and handles fallbacks.
 */
export function CustomGlbProp({ fallback = null, ...props }: CustomGlbPropProps) {
  return (
    <GlbErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GlbModelMesh {...props} />
      </Suspense>
    </GlbErrorBoundary>
  );
}

export function preloadDeskModels(): void {
  useGLTF.preload(assetUrl('models/desk-lamp/desk_lamp_arm_01_1k.gltf'));
  useGLTF.preload(assetUrl('models/tea-set/tea_set_01_1k.gltf'));
  useGLTF.preload(assetUrl('models/books/book_encyclopedia_set_01_1k.gltf'));
  useGLTF.preload(assetUrl('models/plant/potted_plant_01_1k.gltf'));
}

import { useEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '@/constants/tokens';
import { assetUrl } from '@/utils/assetUrl';
import { CustomGlbProp } from './CustomGlbProp';

function createCitrusLeafClusterTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 512);

    let seed = 9921;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const leafShades = ['#2F5E2B', '#3E7236', '#4E8640', '#639C4D', '#356630'];
    for (let i = 0; i < 34; i += 1) {
      const angle = (i / 34) * Math.PI * 2 + (rand() - 0.5) * 0.45;
      const dist = 24 + rand() * 128;
      const cx = 256 + Math.cos(angle) * dist;
      const cy = 256 + Math.sin(angle) * dist;
      const len = 52 + rand() * 36;
      const wid = 20 + rand() * 13;
      const rot = angle + (rand() - 0.5) * 0.85;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      const shade = leafShades[Math.floor(rand() * leafShades.length)] ?? '#3E7236';
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(-len * 0.5, 0);
      ctx.quadraticCurveTo(0, -wid, len * 0.5, 0);
      ctx.quadraticCurveTo(0, wid, -len * 0.5, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(218, 240, 178, 0.36)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-len * 0.42, 0);
      ctx.lineTo(len * 0.42, 0);
      ctx.stroke();
      ctx.restore();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStonewareTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#EAE4D8';
    ctx.fillRect(0, 0, 256, 256);

    let seed = 2026;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 650; i += 1) {
      ctx.fillStyle = rand() > 0.3 ? 'rgba(92, 74, 56, 0.25)' : 'rgba(176, 152, 122, 0.22)';
      ctx.beginPath();
      ctx.arc(rand() * 256, rand() * 256, 0.7 + rand() * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTangerinePeelTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const w = 256;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  const b = document.createElement('canvas');
  b.width = w;
  b.height = h;
  const bCtx = b.getContext('2d');

  if (ctx && bCtx) {
    ctx.fillStyle = '#EB7024';
    ctx.fillRect(0, 0, w, h);
    bCtx.fillStyle = '#909090';
    bCtx.fillRect(0, 0, w, h);

    let seed = 60826;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 1600; i += 1) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 1 + rand() * 2;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 160, 68, 0.22)' : 'rgba(182, 68, 12, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = 'rgba(40, 40, 40, 0.45)';
      bCtx.beginPath();
      bCtx.arc(x, y, r, 0, Math.PI * 2);
      bCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.CanvasTexture(b);
  return { map, bumpMap };
}

/**
 * Seamless curved 3D Tangerine Branches anchored deep behind the left exterior wall (x = -5.65).
 */
function SeamlessTangerineBranches({
  leafTexture,
  peelMap,
  peelBump,
}: {
  readonly leafTexture: THREE.CanvasTexture;
  readonly peelMap: THREE.CanvasTexture;
  readonly peelBump: THREE.CanvasTexture;
}) {
  const branchGroupRef = useRef<THREE.Group>(null);
  const twigClusterRefs = useRef<Array<THREE.Group | null>>([]);

  const { mainGeom, subAGeom, subBGeom, tipPoints } = useMemo(() => {
    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.4, 0.95, 0.08),
      new THREE.Vector3(2.85, 1.65, 0.18),
      new THREE.Vector3(3.85, 1.98, 0.26),
      new THREE.Vector3(4.55, 2.05, 0.3),
    ]);

    const forkA = mainCurve.getPoint(0.62);
    const subACurve = new THREE.CatmullRomCurve3([
      forkA,
      forkA.clone().add(new THREE.Vector3(0.45, 0.46, 0.08)),
      forkA.clone().add(new THREE.Vector3(0.95, 0.72, 0.14)),
    ]);

    const forkB = mainCurve.getPoint(0.76);
    const subBCurve = new THREE.CatmullRomCurve3([
      forkB,
      forkB.clone().add(new THREE.Vector3(0.45, -0.28, 0.1)),
      forkB.clone().add(new THREE.Vector3(0.92, -0.45, 0.16)),
    ]);

    return {
      mainGeom: new THREE.TubeGeometry(mainCurve, 28, 0.072, 10, false),
      subAGeom: new THREE.TubeGeometry(subACurve, 14, 0.042, 8, false),
      subBGeom: new THREE.TubeGeometry(subBCurve, 14, 0.036, 8, false),
      tipPoints: [
        {
          pos: mainCurve.getPoint(0.97),
          scale: 1.5,
          fruits: [
            [0.08, -0.18, 0.18],
            [-0.22, 0.12, 0.16],
          ] as const,
        },
        { pos: subACurve.getPoint(0.95), scale: 1.4, fruits: [[0.14, -0.14, 0.15]] as const },
        {
          pos: subBCurve.getPoint(0.92),
          scale: 1.35,
          fruits: [
            [-0.08, -0.18, 0.16],
            [0.22, 0.04, 0.14],
          ] as const,
        },
        { pos: mainCurve.getPoint(0.68), scale: 1.3, fruits: [[0.05, -0.2, 0.18]] as const },
      ],
    };
  }, []);

  useEffect(() => {
    return () => {
      mainGeom.dispose();
      subAGeom.dispose();
      subBGeom.dispose();
    };
  }, [mainGeom, subAGeom, subBGeom]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (branchGroupRef.current) {
      branchGroupRef.current.rotation.z = Math.sin(t * 0.85) * 0.018 + Math.sin(t * 1.75) * 0.005;
      branchGroupRef.current.rotation.y = Math.cos(t * 0.6) * 0.012;
    }
    twigClusterRefs.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.z = Math.sin(t * (1.35 + i * 0.15) + i * 1.2) * 0.05;
      g.rotation.x = Math.cos(t * 1.1 + i) * 0.032;
    });
  });

  return (
    <group position={[-5.65, 1.85, -5.45]}>
      <mesh position={[-0.05, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 5.2, 12]} />
        <meshStandardMaterial color="#59402B" roughness={0.95} />
      </mesh>

      <group ref={branchGroupRef}>
        <mesh geometry={mainGeom} castShadow>
          <meshStandardMaterial color="#59402B" roughness={0.94} />
        </mesh>
        <mesh geometry={subAGeom} castShadow>
          <meshStandardMaterial color="#59402B" roughness={0.94} />
        </mesh>
        <mesh geometry={subBGeom} castShadow>
          <meshStandardMaterial color="#59402B" roughness={0.94} />
        </mesh>

        {tipPoints.map((tip, idx) => (
          <group
            key={idx}
            position={[tip.pos.x, tip.pos.y, tip.pos.z]}
            ref={(el) => {
              twigClusterRefs.current[idx] = el;
            }}
          >
            <mesh>
              <planeGeometry args={[tip.scale, tip.scale]} />
              <meshStandardMaterial
                map={leafTexture}
                alphaTest={0.35}
                side={THREE.DoubleSide}
                roughness={0.72}
              />
            </mesh>
            <mesh rotation={[0.2, 0.55, 0.25]} position={[0, 0.05, -0.14]}>
              <planeGeometry args={[tip.scale * 0.9, tip.scale * 0.9]} />
              <meshStandardMaterial
                map={leafTexture}
                alphaTest={0.35}
                side={THREE.DoubleSide}
                roughness={0.76}
                color="#E0EFCB"
              />
            </mesh>
            {tip.fruits.map((fPos, fIdx) => (
              <group key={fIdx} position={[fPos[0], fPos[1], fPos[2]]}>
                <mesh scale={[1, 0.88, 1]}>
                  <sphereGeometry args={[0.125, 14, 14]} />
                  <meshPhysicalMaterial
                    map={peelMap}
                    bumpMap={peelBump}
                    bumpScale={0.015}
                    roughness={0.42}
                    clearcoat={0.28}
                    clearcoatRoughness={0.38}
                  />
                </mesh>
                <mesh position={[0, 0.11, 0]}>
                  <cylinderGeometry args={[0.012, 0.022, 0.025, 6]} />
                  <meshStandardMaterial color="#436A34" roughness={0.85} />
                </mesh>
              </group>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

function PhotorealisticWindowVista() {
  const vistaTex = useTexture(assetUrl('assets/window-vista.jpg'));
  vistaTex.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position={[0, 3.05, -8.8]}>
      <planeGeometry args={[17.5, 9.85]} />
      <meshBasicMaterial map={vistaTex} />
    </mesh>
  );
}

function FramedWallMemory({
  walnutProps,
}: {
  readonly walnutProps: {
    readonly map: THREE.Texture;
    readonly normalMap: THREE.Texture;
    readonly roughnessMap: THREE.Texture;
  };
}) {
  const photoTex = useTexture(assetUrl('assets/antigua-photo.jpg'));
  photoTex.colorSpace = THREE.SRGBColorSpace;

  return (
    <group position={[4.75, 2.95, -3.86]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.38, 1.72, 0.07]} />
        <meshStandardMaterial {...walnutProps} roughness={0.65} />
      </mesh>
      <mesh position={[0, 0, 0.038]}>
        <planeGeometry args={[1.22, 1.56]} />
        <meshStandardMaterial color="#F3EFE5" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.042]}>
        <planeGeometry args={[0.96, 1.28]} />
        <meshPhysicalMaterial map={photoTex} roughness={0.35} clearcoat={0.45} />
      </mesh>
    </group>
  );
}

function DeskProps({
  stonewareMap,
  peelMap,
  peelBump,
}: {
  readonly stonewareMap: THREE.CanvasTexture;
  readonly peelMap: THREE.CanvasTexture;
  readonly peelBump: THREE.CanvasTexture;
}) {
  const steamRef = useRef<THREE.Group>(null);

  const bowlGeom = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.42, 0.0),
      new THREE.Vector2(0.62, 0.09),
      new THREE.Vector2(0.7, 0.2),
      new THREE.Vector2(0.66, 0.21),
      new THREE.Vector2(0.56, 0.11),
      new THREE.Vector2(0.38, 0.045),
      new THREE.Vector2(0.0, 0.045),
    ];
    return new THREE.LatheGeometry(pts, 28);
  }, []);

  useEffect(() => {
    return () => {
      bowlGeom.dispose();
    };
  }, [bowlGeom]);

  useFrame(({ clock }) => {
    const g = steamRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.children.forEach((child, i) => {
      const cycle = (t * 0.34 + i * 0.33) % 1;
      child.position.y = 0.42 + cycle * 0.48;
      child.position.x = Math.sin(t * 1.2 + i * 2) * 0.04;
      const scale = 0.5 + cycle * 0.8;
      child.scale.set(scale, scale, scale);
    });
  });

  return (
    <group>
      {/* Matte Charcoal-Leather Desk Blotter Pad centering the Passport */}
      <mesh position={[0, 0.004, 0.25]} receiveShadow>
        <boxGeometry args={[5.4, 0.008, 3.85]} />
        <meshStandardMaterial color="#272C35" roughness={0.88} metalness={0.04} />
      </mesh>

      {/* 1. Real Poly Haven Porcelain Teacup & Saucer on Cork Coaster (Upper-Left) */}
      <group position={[-3.38, 0, -1.15]}>
        <mesh position={[0, 0.018, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.56, 0.58, 0.036, 32]} />
          <meshStandardMaterial color="#9E7850" roughness={0.94} />
        </mesh>
        <CustomGlbProp
          url="models/tea-set/tea_set_01_1k.gltf"
          onlyNodes={['tea_set_01_saucer_circular_04']}
          position={[0, 0.036, 0]}
          scale={5.2}
          centerXZ
          groundToZero
        />
        <CustomGlbProp
          url="models/tea-set/tea_set_01_1k.gltf"
          onlyNodes={['tea_set_01_cup_small_01']}
          position={[0, 0.09, 0]}
          rotation={[0, -0.6, 0]}
          scale={5.2}
          centerXZ
          groundToZero
        />
        {/* Warm tea surface inside cup + gentle rising steam */}
        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.19, 20]} />
          <meshPhysicalMaterial color="#4A2C16" roughness={0.18} clearcoat={0.7} />
        </mesh>
        <group ref={steamRef}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.48 + i * 0.14, 0]}>
              <sphereGeometry args={[0.065, 10, 10]} />
              <meshStandardMaterial color="#FFFFFF" transparent opacity={0.12} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 2. Real Poly Haven Articulated Desk Lamp (Back-Left Corner) + Warm Pool Light */}
      <group position={[-4.55, 0, -2.05]}>
        <CustomGlbProp
          url="models/desk-lamp/desk_lamp_arm_01_1k.gltf"
          position={[0, 0, 0]}
          rotation={[0, 0.65, 0]}
          scale={3.1}
          groundToZero
        />
        <pointLight position={[0.75, 1.55, 0.58]} intensity={0.85} distance={7} color="#FFDFA8" />
      </group>

      {/* 3. Real Poly Haven Ceramic Potted Plant (Back-Right Desk Corner catching sunlight) */}
      <CustomGlbProp
        url="models/plant/potted_plant_01_1k.gltf"
        position={[4.65, 0, -2.1]}
        rotation={[0, -0.5, 0]}
        scale={1.45}
        groundToZero
      />

      {/* 4. Lacquered Navy & Gold Fountain Pen */}
      <group position={[3.05, 0.055, 0.42]} rotation={[0, -0.22, Math.PI / 2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.046, 0.052, 1.32, 20]} />
          <meshPhysicalMaterial
            color={COLORS.leatherNavy}
            roughness={0.16}
            metalness={0.12}
            clearcoat={0.95}
            clearcoatRoughness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.054, 0.054, 0.08, 20]} />
          <meshStandardMaterial color="#E9C65A" roughness={0.2} metalness={0.88} />
        </mesh>
        <mesh position={[0, 0.67, 0]}>
          <sphereGeometry args={[0.046, 14, 14]} />
          <meshStandardMaterial color="#E9C65A" roughness={0.2} metalness={0.88} />
        </mesh>
        <mesh position={[0.056, 0.38, 0]}>
          <boxGeometry args={[0.015, 0.42, 0.024]} />
          <meshStandardMaterial color="#E9C65A" roughness={0.2} metalness={0.88} />
        </mesh>
        <mesh position={[0, -0.77, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[0.044, 0.24, 16]} />
          <meshStandardMaterial color="#E9C65A" roughness={0.18} metalness={0.92} />
        </mesh>
      </group>

      {/* 5. Artisanal Curved Stoneware Dish with 3 Dimpled Fresh Tangerines */}
      <group position={[3.45, 0, -1.15]}>
        <mesh geometry={bowlGeom} castShadow receiveShadow>
          <meshPhysicalMaterial
            map={stonewareMap}
            roughness={0.42}
            clearcoat={0.35}
            clearcoatRoughness={0.3}
          />
        </mesh>
        {[
          { pos: [-0.2, 0.24, 0.11] as const, r: 0.23 },
          { pos: [0.22, 0.23, 0.07] as const, r: 0.21 },
          { pos: [0.02, 0.25, -0.21] as const, r: 0.22 },
        ].map((fruit, idx) => (
          <group key={idx} position={[fruit.pos[0], fruit.pos[1], fruit.pos[2]]}>
            <mesh scale={[1, 0.86, 1]} castShadow receiveShadow>
              <sphereGeometry args={[fruit.r, 20, 20]} />
              <meshPhysicalMaterial
                map={peelMap}
                bumpMap={peelBump}
                bumpScale={0.018}
                roughness={0.44}
                clearcoat={0.28}
                clearcoatRoughness={0.38}
              />
            </mesh>
            <mesh position={[0, fruit.r * 0.85, 0]}>
              <cylinderGeometry args={[0.015, 0.028, 0.028, 6]} />
              <meshStandardMaterial color="#436A34" roughness={0.85} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.08, 0.44, 0.14]} rotation={[0.32, 0.45, -0.42]}>
          <planeGeometry args={[0.24, 0.11]} />
          <meshStandardMaterial color="#487C3D" roughness={0.68} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function DeskEnvironment() {
  // Real photographed Poly Haven 1K PBR Texture Sets (Walnut Wood + Grey Plaster)
  const { walnutDiff, walnutNor, walnutRough, plasterDiff, plasterNor, plasterRough } = useTexture({
    walnutDiff: assetUrl('textures/walnut/diff.jpg'),
    walnutNor: assetUrl('textures/walnut/nor.jpg'),
    walnutRough: assetUrl('textures/walnut/rough.jpg'),
    plasterDiff: assetUrl('textures/plaster/diff.jpg'),
    plasterNor: assetUrl('textures/plaster/nor.jpg'),
    plasterRough: assetUrl('textures/plaster/rough.jpg'),
  });

  const walnutProps = useMemo(() => {
    walnutDiff.colorSpace = THREE.SRGBColorSpace;
    [walnutDiff, walnutNor, walnutRough].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 2);
      t.anisotropy = 8;
    });
    return {
      map: walnutDiff,
      normalMap: walnutNor,
      roughnessMap: walnutRough,
    };
  }, [walnutDiff, walnutNor, walnutRough]);

  const plasterProps = useMemo(() => {
    plasterDiff.colorSpace = THREE.SRGBColorSpace;
    [plasterDiff, plasterNor, plasterRough].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(4, 2.5);
    });
    return {
      map: plasterDiff,
      normalMap: plasterNor,
      roughnessMap: plasterRough,
      color: '#D2D0CA',
    };
  }, [plasterDiff, plasterNor, plasterRough]);

  const leafTexture = useMemo(() => createCitrusLeafClusterTexture(), []);
  const stonewareMap = useMemo(() => createStonewareTexture(), []);
  const peelTextures = useMemo(() => createTangerinePeelTextures(), []);

  useEffect(() => {
    return () => {
      leafTexture.dispose();
      stonewareMap.dispose();
      peelTextures.map.dispose();
      peelTextures.bumpMap.dispose();
    };
  }, [leafTexture, stonewareMap, peelTextures]);

  const trimColor = '#ECE9E1';

  return (
    <group>
      {/* Photographed Walnut Veneer Wooden Desk (top surface is exact y = 0.000) */}
      <mesh position={[0, -0.16, 0.2]} receiveShadow>
        <boxGeometry args={[16, 0.32, 9.2]} />
        <meshStandardMaterial {...walnutProps} roughness={0.74} metalness={0.04} />
      </mesh>
      <mesh position={[0, -0.06, 4.82]} receiveShadow>
        <boxGeometry args={[16, 0.12, 0.08]} />
        <meshStandardMaterial {...walnutProps} roughness={0.68} />
      </mesh>

      {/* Real Poly Haven .gltf Props + Tangerines Dish & Fountain Pen */}
      <DeskProps
        stonewareMap={stonewareMap}
        peelMap={peelTextures.map}
        peelBump={peelTextures.bumpMap}
      />

      {/* Deep Architectural Photographed Matte-Plaster Room Walls with Recessed Open Window */}
      <group position={[0, 0, -4.2]}>
        <mesh position={[0, -0.675, 0]} receiveShadow>
          <boxGeometry args={[18, 2.65, 0.62]} />
          <meshStandardMaterial {...plasterProps} roughness={0.96} />
        </mesh>
        <mesh position={[0, 6.525, 0]} receiveShadow>
          <boxGeometry args={[18, 2.95, 0.62]} />
          <meshStandardMaterial {...plasterProps} roughness={0.96} />
        </mesh>
        <mesh position={[-5.95, 2.85, 0]} receiveShadow>
          <boxGeometry args={[6.1, 4.4, 0.62]} />
          <meshStandardMaterial {...plasterProps} roughness={0.96} />
        </mesh>
        <mesh position={[5.95, 2.85, 0]} receiveShadow>
          <boxGeometry args={[6.1, 4.4, 0.62]} />
          <meshStandardMaterial {...plasterProps} roughness={0.96} />
        </mesh>

        {/* Architectural Wainscoting / Baseboard Trim along desk-wall junction */}
        <mesh position={[0, 0.12, 0.34]} receiveShadow>
          <boxGeometry args={[18, 0.24, 0.08]} />
          <meshStandardMaterial color="#DFDCD4" roughness={0.78} />
        </mesh>

        {/* Deep Window Sill & Casing */}
        <mesh position={[0, 0.68, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[6.24, 0.14, 0.86]} />
          <meshStandardMaterial color={trimColor} roughness={0.64} />
        </mesh>
        <mesh position={[0, 5.02, 0.06]}>
          <boxGeometry args={[6.08, 0.14, 0.68]} />
          <meshStandardMaterial color={trimColor} roughness={0.64} />
        </mesh>
        <mesh position={[-2.95, 2.85, 0.06]}>
          <boxGeometry args={[0.16, 4.4, 0.68]} />
          <meshStandardMaterial color={trimColor} roughness={0.64} />
        </mesh>
        <mesh position={[2.95, 2.85, 0.06]}>
          <boxGeometry args={[0.16, 4.4, 0.68]} />
          <meshStandardMaterial color={trimColor} roughness={0.64} />
        </mesh>

        {/* Open Casement Window Sashes */}
        <group position={[-2.86, 2.85, -0.22]} rotation={[0, -0.95, 0]}>
          <mesh position={[0.72, 0, 0]}>
            <boxGeometry args={[1.44, 4.2, 0.05]} />
            <meshPhysicalMaterial color="#E6F2FA" transparent opacity={0.18} roughness={0.1} />
          </mesh>
          <mesh position={[0.72, 2.08, 0]}>
            <boxGeometry args={[1.48, 0.09, 0.09]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} />
          </mesh>
          <mesh position={[0.72, -2.08, 0]}>
            <boxGeometry args={[1.48, 0.09, 0.09]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} />
          </mesh>
          <mesh position={[1.44, 0, 0]}>
            <boxGeometry args={[0.09, 4.24, 0.09]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} />
          </mesh>
        </group>

        <group position={[2.86, 2.85, -0.22]} rotation={[0, 0.95, 0]}>
          <mesh position={[-0.72, 0, 0]}>
            <boxGeometry args={[1.44, 4.2, 0.05]} />
            <meshPhysicalMaterial color="#E6F2FA" transparent opacity={0.18} roughness={0.1} />
          </mesh>
          <mesh position={[-0.72, 2.08, 0]}>
            <boxGeometry args={[1.48, 0.09, 0.09]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} />
          </mesh>
          <mesh position={[-0.72, -2.08, 0]}>
            <boxGeometry args={[1.48, 0.09, 0.09]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} />
          </mesh>
          <mesh position={[-1.44, 0, 0]}>
            <boxGeometry args={[0.09, 4.24, 0.09]} />
            <meshStandardMaterial color={trimColor} roughness={0.65} />
          </mesh>
        </group>

        {/* Soft Golden Afternoon Sunbeam Shaft */}
        <mesh position={[-0.4, 1.9, 1.7]} rotation={[0.45, 0, 0.14]}>
          <planeGeometry args={[3.4, 5.2]} />
          <meshBasicMaterial
            color="#FFF2CC"
            transparent
            opacity={0.045}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Left Wall Floating Walnut Shelf + Real Poly Haven Hardcover Encyclopedia Books */}
      <group position={[-4.85, 2.45, -3.62]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.1, 0.62]} />
          <meshStandardMaterial {...walnutProps} roughness={0.68} />
        </mesh>
        <CustomGlbProp
          url="models/books/book_encyclopedia_set_01_1k.gltf"
          position={[-0.85, 0.05, 0.05]}
          rotation={[0, 0.04, 0]}
          scale={3.1}
          groundToZero
        />
      </group>

      {/* Right Wall Framed Antigua Travel Memory */}
      <FramedWallMemory walnutProps={walnutProps} />

      {/* Enclosing Side Photographed Matte-Plaster Walls */}
      <mesh position={[-8.4, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial {...plasterProps} roughness={0.96} />
      </mesh>
      <mesh position={[8.4, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial {...plasterProps} roughness={0.96} />
      </mesh>

      {/* Photorealistic Golden-Afternoon Sky & Sunlit Garden Vista */}
      <PhotorealisticWindowVista />

      {/* Seamless Curved 3D Tangerine Branches anchored deep behind left exterior wall */}
      <SeamlessTangerineBranches
        leafTexture={leafTexture}
        peelMap={peelTextures.map}
        peelBump={peelTextures.bumpMap}
      />
    </group>
  );
}

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, BoxGeometry, MeshBasicMaterial, DoubleSide } from 'three';
import * as THREE from 'three';

// Define billboard positions and rotations
interface Billboard {
  position: [number, number, number];
  rotationSpeed: number;
  initialRotation: number;
  adType: 'barnum' | 'cf' | 'sts';
}

function AdBillboards() {
  // Load textures for billboards
  const barnumTexture = useLoader(TextureLoader, '/models/ad-barnum.png');
  const cfTexture = useLoader(TextureLoader, '/models/ad-cf.png');
  const stsTexture = useLoader(TextureLoader, '/models/ad-sts.png');
  
  // Fix texture settings - flip Y to correct upside-down logos
  [barnumTexture, cfTexture, stsTexture].forEach(texture => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    texture.flipY = true; // Change to true to flip the logos right-side up
  });
  
  // Create an array of refs for the billboards
  const billboardRefs = useRef<THREE.Mesh[]>([]);
  
  // Generate positions for billboards - one per ad type
  const billboards = useMemo(() => {
    const billboardsArray: Billboard[] = [];
    
    // Define fixed positions for each ad billboard
    const positions = [
      // Left side position
      { 
        position: [-12, 5, 30], 
        adType: 'barnum',
        rotationSpeed: 0.04, // Slowed down rotation speed
        initialRotation: Math.PI * 0.2
      },
      // Right side position
      { 
        position: [12, 5, 45], 
        adType: 'cf',
        rotationSpeed: 0.03, // Slowed down rotation speed
        initialRotation: Math.PI * -0.2
      },
      // Left side further position
      { 
        position: [-10, 4, 60], 
        adType: 'sts',
        rotationSpeed: 0.05, // Slowed down rotation speed
        initialRotation: Math.PI * 0.15
      }
    ];
    
    positions.forEach(pos => {
      billboardsArray.push({
        position: pos.position as [number, number, number],
        rotationSpeed: pos.rotationSpeed,
        initialRotation: pos.initialRotation,
        adType: pos.adType as 'barnum' | 'cf' | 'sts'
      });
    });
    
    return billboardsArray;
  }, []);
  
  // Create materials with fixed transparency handling
  const materials = useMemo(() => {
    const sideMaterial = new THREE.MeshBasicMaterial({ 
      color: '#000000', // Black sides
    });
    
    // Create materials that show logos correctly
    const barnumMaterial = new THREE.MeshBasicMaterial({ 
      map: barnumTexture, 
      side: THREE.FrontSide, // Change to FrontSide to prevent overlap
      transparent: true,
      alphaTest: 0.1,
      color: 0xFFFFFF,
      depthWrite: true
    });
    
    const cfMaterial = new THREE.MeshBasicMaterial({ 
      map: cfTexture, 
      side: THREE.FrontSide, // Change to FrontSide to prevent overlap
      transparent: true,
      alphaTest: 0.1,
      color: 0xFFFFFF,
      depthWrite: true
    });
    
    const stsMaterial = new THREE.MeshBasicMaterial({ 
      map: stsTexture, 
      side: THREE.FrontSide, // Change to FrontSide to prevent overlap
      transparent: true,
      alphaTest: 0.1,
      color: 0xFFFFFF,
      depthWrite: true
    });
    
    // Create separate back materials with same settings
    const barnumBackMaterial = barnumMaterial.clone();
    const cfBackMaterial = cfMaterial.clone();
    const stsBackMaterial = stsMaterial.clone();
    
    return {
      side: sideMaterial,
      barnum: barnumMaterial,
      cf: cfMaterial,
      sts: stsMaterial,
      barnumBack: barnumBackMaterial,
      cfBack: cfBackMaterial,
      stsBack: stsBackMaterial
    };
  }, [barnumTexture, cfTexture, stsTexture]);
  
  // Create billboards with increased depth
  const billboardsWithMaterials = useMemo(() => {
    return billboards.map(billboard => {
      const width = 4;
      const height = 3;
      const depth = 0.5; // Increased depth to prevent overlap
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      
      const adMaterial = materials[billboard.adType];
      const backMaterial = materials[`${billboard.adType}Back`];
      
      // Apply different materials to front and back for better rendering
      const faceMaterials = [
        materials.side,  // right
        materials.side,  // left
        materials.side,  // top
        materials.side,  // bottom
        adMaterial,      // front
        backMaterial     // back - using separate material instance
      ];
      
      const mesh = new THREE.Mesh(geometry, faceMaterials);
      mesh.position.set(...billboard.position);
      mesh.rotation.y = billboard.initialRotation;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.renderOrder = 1;
      
      return {
        mesh,
        rotationSpeed: billboard.rotationSpeed
      };
    });
  }, [billboards, materials]);
  
  useEffect(() => {
    billboardRefs.current = billboardsWithMaterials.map(({ mesh }) => mesh);
  }, [billboardsWithMaterials]);
  
  // Only use one useFrame hook
  useFrame((state, delta) => {
    billboardsWithMaterials.forEach(({ mesh, rotationSpeed }) => {
      mesh.rotation.y += delta * rotationSpeed;
    });
  });
  
  return (
    <group>
      {billboardsWithMaterials.map((billboard, index) => (
        <group key={index}>
          <primitive object={billboard.mesh} />
          <spotLight 
            position={[
              billboard.mesh.position.x, 
              billboard.mesh.position.y + 3, 
              billboard.mesh.position.z - 3
            ]} 
            angle={0.5}
            penumbra={0.5}
            distance={20} 
            intensity={4} 
            color="#ffffff"
            castShadow
          />
        </group>
      ))}
    </group>
  );
}

export default AdBillboards; 
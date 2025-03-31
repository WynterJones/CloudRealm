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
  
  // Enhanced texture settings for better color reproduction
  [barnumTexture, cfTexture, stsTexture].forEach(texture => {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = 16; // Increased from 6 for better quality
    texture.needsUpdate = true;
    texture.flipY = true;
    
    // Force linear color space to prevent gamma correction issues
    texture.colorSpace = THREE.SRGBColorSpace;
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
        position: [-19, -1, 30], 
        adType: 'barnum',
        rotationSpeed: 0.54,
        initialRotation: Math.PI * 0.2
      },
      // Right side position
      { 
        position: [28, 5, 35], 
        adType: 'cf',
        rotationSpeed: 0.23,
        initialRotation: Math.PI * -0.2
      },
      // Left side further position
      { 
        position: [-10, 4, 60], 
        adType: 'sts',
        rotationSpeed: 0.45,
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
  
  // Create enhanced materials for better color reproduction
  const materials = useMemo(() => {
    const sideMaterial = new THREE.MeshBasicMaterial({ 
      color: '#444444', // Darkened from pure black for better contrast
    });
    
    // Completely redesigned material settings for vibrant colors
    const createAdMaterial = (texture: THREE.Texture) => {
      return new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
        transparent: false, // Changed to false for better color saturation
        color: 0xFFFFFF, // Pure white base to preserve texture colors
        depthWrite: true,
        toneMapped: false, // Prevent tone mapping from desaturating colors
      });
    };
    
    return {
      side: sideMaterial,
      barnum: createAdMaterial(barnumTexture),
      cf: createAdMaterial(cfTexture),
      sts: createAdMaterial(stsTexture),
      barnumBack: createAdMaterial(barnumTexture),
      cfBack: createAdMaterial(cfTexture),
      stsBack: createAdMaterial(stsTexture)
    };
  }, [barnumTexture, cfTexture, stsTexture]);
  
  // Create billboards with optimized geometry
  const billboardsWithMaterials = useMemo(() => {
    return billboards.map(billboard => {
      const width = 4;
      const height = 3;
      const depth = 0.2;
      
      const geometry = new THREE.BoxGeometry(width, height, depth);
      
      const adMaterial = materials[billboard.adType];
      const backMaterial = materials[`${billboard.adType}Back`];
      
      // Apply separate materials to each face
      const faceMaterials = [
        materials.side,  // right
        materials.side,  // left
        materials.side,  // top
        materials.side,  // bottom
        adMaterial,      // front
        backMaterial     // back - using texture material instead of side material
      ];
      
      const mesh = new THREE.Mesh(geometry, faceMaterials);
      mesh.position.set(...billboard.position);
      mesh.rotation.y = billboard.initialRotation;
      mesh.renderOrder = 1000; // Ensure billboards render on top of other elements
      
      return {
        mesh,
        rotationSpeed: billboard.rotationSpeed
      };
    });
  }, [billboards, materials]);
  
  useEffect(() => {
    billboardRefs.current = billboardsWithMaterials.map(({ mesh }) => mesh);
  }, [billboardsWithMaterials]);
  
  // Animation frame update
  useFrame((state, delta) => {
    billboardsWithMaterials.forEach(({ mesh, rotationSpeed }) => {
      mesh.rotation.y += delta * rotationSpeed;
    });
  });
  
  return (
    <group>
      {/* Properly configured ambient light */}
      <ambientLight intensity={0.5} color="#ffffff" />
      
      {billboardsWithMaterials.map((billboard, index) => (
        <group key={index}>
          <primitive object={billboard.mesh} />
          
          {/* Removed spotlights since MeshBasicMaterial ignores lights */}
        </group>
      ))}
    </group>
  );
}

export default AdBillboards; 
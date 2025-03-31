import React, { useRef, useState, useEffect } from 'react';
import { Mesh, Vector3, DoubleSide, Shape, ExtrudeGeometry, RepeatWrapping, TextureLoader, MeshStandardMaterial, Texture, Scene } from 'three';
import { Text, useTexture, Html } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { GameState } from '../types/game';
import { PortalManager } from './PortalManager';

interface BridgeProps {
  gameState: GameState;
}

interface CardData {
  position: [number, number, number];
  label: string;
  color: string;
  texture: string;
}

interface StageData {
  title: string;
  cards: CardData[];
}

interface TitleBackgroundProps {
  children: React.ReactNode;
  width: number;
  height: number;
  position: [number, number, number];
}

function TitleBackground({ children, width, height, position }: TitleBackgroundProps) {
  // Create rounded rectangle shape
  const shape = new Shape();
  const radius = 0.1;
  
  shape.moveTo(-width/2 + radius, -height/2);
  shape.lineTo(width/2 - radius, -height/2);
  shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
  shape.lineTo(width/2, height/2 - radius);
  shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
  shape.lineTo(-width/2 + radius, height/2);
  shape.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - radius);
  shape.lineTo(-width/2, -height/2 + radius);
  shape.quadraticCurveTo(-width/2, -height/2, -width/2 + radius, -height/2);

  const extrudeSettings = {
    steps: 1,
    depth: 0.05,
    bevelEnabled: false
  };

  return (
    <group position={position}>
      <mesh position={[0, 0, -0.05]}>
        <extrudeGeometry args={[shape, extrudeSettings]} />
        <meshStandardMaterial color="black" />
      </mesh>
      {children}
    </group>
  );
}

function FloatingCard({ position, texture }: { position: [number, number, number], texture: string }) {
  const meshRef = useRef<Mesh>(null);
  // Load texture for the card
  const cardTexture = useTexture(texture);
  
  // Rotate the card slowly
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {/* Card with 2:3 aspect ratio and thickness */}
      <boxGeometry args={[1, 1.5, 0.05]} />
      <meshStandardMaterial 
        attach="material-0" 
        map={cardTexture}
        emissive="#ffffff"
        emissiveMap={cardTexture}
        emissiveIntensity={0.5}
      />
      <meshStandardMaterial 
        attach="material-1" 
        map={cardTexture}
        emissive="#ffffff"
        emissiveMap={cardTexture}
        emissiveIntensity={0.5}
      />
      <meshStandardMaterial attach="material-2" color="#222222" />
      <meshStandardMaterial attach="material-3" color="#222222" />
      <meshStandardMaterial 
        attach="material-4" 
        map={cardTexture}
        emissive="#ffffff"
        emissiveMap={cardTexture}
        emissiveIntensity={0.5}
      />
      <meshStandardMaterial 
        attach="material-5" 
        map={cardTexture}
        emissive="#ffffff"
        emissiveMap={cardTexture}
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

interface RailingMeshProps {
  position: [number, number, number];
  texture: Texture;
}

function RailingMesh({ position, texture }: RailingMeshProps) {
  const railingRef = useRef<Mesh>(null);
  
  // Use a single shared material for all faces
  const material = new MeshStandardMaterial({ 
    map: texture,
    color: "#888888"
  });
  
  return (
    <mesh ref={railingRef} position={position}>
      <boxGeometry args={[0.2, 0.3, 500]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function Bridge({ gameState }: BridgeProps) {
  const bridgeRef = useRef<Mesh>(null);
  const { scene, camera } = useThree();
  const [portalManager, setPortalManager] = useState<PortalManager | null>(null);
  
  // Load and configure textures
  const groundTexture = useLoader(TextureLoader, '/models/ground.png');
  const railingTexture = useLoader(TextureLoader, '/models/railing.png');
  
  // Set texture repeats
  groundTexture.wrapS = groundTexture.wrapT = RepeatWrapping;
  railingTexture.wrapS = railingTexture.wrapT = RepeatWrapping;
  
  // Reduced repeat for ground to make texture bigger
  groundTexture.repeat.set(0.5, 50);
  railingTexture.repeat.set(0.5, 250);
  
  // Improve texture quality
  groundTexture.anisotropy = 16;

  // Initialize portals on mount
  useEffect(() => {
    // Create portal manager - using an empty object for socket since it's optional
    const manager = new PortalManager(scene, camera, {});
    
    // Get ref URL from query parameters if it exists
    const urlParams = new URLSearchParams(window.location.search);
    const comingFromPortal = urlParams.get('portal') === 'true';
    
    // Create start portal at the beginning of the bridge
    // If coming from a portal, this acts as the return portal
    const startPortalOptions = comingFromPortal 
      ? { labelText: 'Return' } 
      : { labelText: 'Go Back' };
    
    // Position start portal within the new player movement range (-20 to 250)
    // Set to z=-10 so it's clearly behind the player but within movement range
    const startPortal = manager.createStartPortal(0, 0.1, -10, 2.5, startPortalOptions);
    
    // Rotate the portal to face the player
    if (startPortal) {
      startPortal.rotation.y = Math.PI; // Rotate 180 degrees to face toward positive Z
    }
    
    // Create exit portal after the third stage (weapon, armor, magic stages)
    // Stage positions start at z=10 with 15 unit intervals between stages
    // So placing at z=55 puts it past the third stage
    manager.createExitPortal(0, 0.1, 55, 2.5, { labelText: 'To Vibeverse' });
    
    setPortalManager(manager);
    
    return () => {
      // Clean up if needed
    };
  }, [scene, camera]);
  
  // Check for portal collisions each frame
  useFrame(() => {
    if (portalManager && gameState.position) {
      // Convert gameState position to object with y (assuming y is character height)
      const playerPos = {
        position: {
          x: gameState.position.x,
          y: 1, // Assuming character height is around 1 unit
          z: gameState.position.z
        }
      };
      
      portalManager.checkPortalCollisions(playerPos);
    }
  });

  // Card data for each stage - lowered y position to 0.1 from 0.3
  const stageData: StageData[] = [
    {
      title: "WEAPON",
      cards: [
        { position: [-2, 0.42, 0], label: "Sword", color: "#ff0000", texture: "/models/card-sword.png" },
        { position: [0, 0.32, 0], label: "Fist", color: "#00ff00", texture: "/models/card-fists.png" },
        { position: [2, 0.42, 0], label: "Axe", color: "#0000ff", texture: "/models/card-axe.png" }
      ]
    },
    {
      title: "ARMOUR",
      cards: [
        { position: [-2, 0.42, 0], label: "Steel", color: "#ff0000", texture: "/models/card-steel.png" },
        { position: [0, 0.32, 0], label: "Knowledge", color: "#00ff00", texture: "/models/card-knowledge.png" },
        { position: [2, 0.42, 0], label: "Gold", color: "#0000ff", texture: "/models/card-gold.png" }
      ]
    },
    {
      title: "MAGIC",
      cards: [
        { position: [-2, 0.42, 0], label: "Fire", color: "#ff0000", texture: "/models/card-fire.png" },
        { position: [0, 0.32, 0], label: "Water", color: "#00ff00", texture: "/models/card-water.png" },
        { position: [2, 0.42, 0], label: "Love", color: "#0000ff", texture: "/models/card-love.png" }
      ]
    }
  ];

  return (
    <group>
      {/* Main bridge surface */}
      <mesh
        ref={bridgeRef}
        position={[0, -0.5, 20]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[4, 1, 510]} />
        <meshStandardMaterial map={groundTexture} />
      </mesh>
      
      {/* Left curb */}
      <mesh position={[-2.1, 0.01, 20]}>
        <boxGeometry args={[0.2, 0.3, 510]} />
        <meshStandardMaterial map={railingTexture} color="#888888" side={DoubleSide} />
      </mesh>
      
      {/* Right curb */}
      <mesh position={[2.1, 0.01, 20]}>
        <boxGeometry args={[0.2, 0.3, 510]} />
        <meshStandardMaterial map={railingTexture} color="#888888" side={DoubleSide} />
      </mesh>
      
      {/* Distant fog effect */}
      <mesh position={[0, 0, 250]} rotation={[0, 0, 0]}>
        <planeGeometry args={[20, 10]} />
        <meshBasicMaterial color="#AAAAAA" transparent opacity={0.7} />
      </mesh>
      
      {/* Stage markers */}
      {[0, 1, 2].map((stage) => {
        // Check if this stage should be hidden (based on game progression)
        const isStageHidden = (stage === 0 && gameState.weapon !== null) ||
                              (stage === 1 && gameState.armour !== null) ||
                              (stage === 2 && gameState.magic !== null);

        if (isStageHidden) return null;

        return (
          <group key={stage} position={[0, 0, 10 + stage * 15]}>
            {/* Stage title with background */}
            <TitleBackground width={2.5} height={0.8} position={[0, 2.5, 0]}>
              <Html
                position={[0, 0, 0.5]}
                transform
                occlude={false}
                zIndexRange={[100, 0]}
                style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  width: '120px',
                  userSelect: 'none',
                  textShadow: '0 0 10px white',
                  transform: 'scaleX(-1)'
                }}
              >
                {stageData[stage].title}
              </Html>
            </TitleBackground>

            {/* Card blocks for each stage */}
            {stageData[stage].cards.map((card, index) => {
              // Calculate the card's actual x position based on its relative position and the stage
              const cardX = card.position[0];
              const cardZ = 10 + stage * 15 + card.position[2];
              
              // Check if this card has been collected
              const isCollected = gameState.collectedBlocks.some(
                collected => collected.x === cardX && collected.z === cardZ
              );
              
              if (isCollected) return null;
              
              return (
                <group key={index} position={new Vector3(...card.position)}>
                  {/* Floating textured card */}
                  <FloatingCard 
                    position={[0, 0.8, 0]} 
                    texture={card.texture}
                  />
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

export default Bridge;
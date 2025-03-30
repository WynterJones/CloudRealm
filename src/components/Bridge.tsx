import { useRef, useState } from 'react';
import { Mesh, Vector3, DoubleSide } from 'three';
import { Text, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { GameState } from '../types/game';

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
      <meshStandardMaterial map={cardTexture} attachArray="material" />
      <meshStandardMaterial map={cardTexture} attachArray="material" />
      <meshStandardMaterial color="#222222" attachArray="material" />
      <meshStandardMaterial color="#222222" attachArray="material" />
      <meshStandardMaterial map={cardTexture} attachArray="material" />
      <meshStandardMaterial map={cardTexture} attachArray="material" />
    </mesh>
  );
}

function Bridge({ gameState }: BridgeProps) {
  const bridgeRef = useRef<Mesh>(null);

  // Card data for each stage - lowered y position to 0.1 from 0.3
  const stageData: StageData[] = [
    {
      title: "WEAPON",
      cards: [
        { position: [-2, 0.1, 0], label: "Sword", color: "#ff0000", texture: "/models/card-sword.png" },
        { position: [0, 0.1, 0], label: "Fist", color: "#00ff00", texture: "/models/card-fists.png" },
        { position: [2, 0.1, 0], label: "Axe", color: "#0000ff", texture: "/models/card-axe.png" }
      ]
    },
    {
      title: "ARMOUR",
      cards: [
        { position: [-2, 0.1, 0], label: "Steel", color: "#ff0000", texture: "/models/card-sword.png" },
        { position: [0, 0.1, 0], label: "Knowledge", color: "#00ff00", texture: "/models/card-fists.png" },
        { position: [2, 0.1, 0], label: "Gold", color: "#0000ff", texture: "/models/card-axe.png" }
      ]
    },
    {
      title: "MAGIC",
      cards: [
        { position: [-2, 0.1, 0], label: "Fire", color: "#ff0000", texture: "/models/card-sword.png" },
        { position: [0, 0.1, 0], label: "Water", color: "#00ff00", texture: "/models/card-fists.png" },
        { position: [2, 0.1, 0], label: "Love", color: "#0000ff", texture: "/models/card-axe.png" }
      ]
    }
  ];

  return (
    <group>
      <mesh
        ref={bridgeRef}
        position={[0, -0.5, 25]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[4, 1, 60]} />
        <meshStandardMaterial color="#666666" />
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
            {/* Stage title */}
            <Text
              position={[0, 2, 0]}
              fontSize={0.8}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.05}
              outlineColor="#000000"
              rotation={[0, Math.PI, 0]}
            >
              {stageData[stage].title}
            </Text>

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
                  {/* Card body */}
                  <mesh rotation={[0, Math.PI, 0]}>
                    <boxGeometry args={[1.2, 0.1, 1.8]} />
                    <meshStandardMaterial color="#FFFFFF" />
                  </mesh>
                  
                  {/* Card color highlight */}
                  <mesh position={[0, 0.07, 0]} rotation={[0, Math.PI, 0]}>
                    <boxGeometry args={[1, 0.05, 1.6]} />
                    <meshStandardMaterial color={card.color} transparent opacity={0.8} />
                  </mesh>
                  
                  {/* Floating textured card */}
                  <FloatingCard 
                    position={[0, 1.5, 0]} 
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
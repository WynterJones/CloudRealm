export type WeaponType = 'sword' | 'axe' | 'fist';
export type ArmourType = 'steel' | 'knowledge' | 'gold';
export type MagicType = 'fire' | 'water' | 'love';

export interface GameState {
  weapon: WeaponType | null;
  armour: ArmourType | null;
  magic: MagicType | null;
  position: { x: number; z: number };
  stage: number;
  collectedBlocks: Array<{ x: number; z: number }>;
}
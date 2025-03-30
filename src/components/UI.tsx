import { GameState } from '../types/game';

interface UIProps {
  gameState: GameState;
}

// Helper function to capitalize the first letter
const capitalize = (text: string | null): string => {
  if (!text) return 'None';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function UI({ gameState }: UIProps) {
  return (
    <div className="game-ui">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between w-full">
          <div className="ui-label">
            Weapon: {capitalize(gameState.weapon)}
          </div>
          <div className="ui-label">
            Armour: {capitalize(gameState.armour)}
          </div>
        </div>
        <div className="mt-auto flex justify-between w-full">
          <div className="ui-label">
            Magic: {capitalize(gameState.magic)}
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}

export default UI
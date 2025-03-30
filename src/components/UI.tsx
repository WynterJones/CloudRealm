import { GameState } from '../types/game';

interface UIProps {
  gameState: GameState;
}

function UI({ gameState }: UIProps) {
  return (
    <div className="game-ui">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between w-full">
          <div className="ui-label">
            Weapon: {gameState.weapon || 'None'}
          </div>
          <div className="ui-label">
            Armour: {gameState.armour || 'None'}
          </div>
        </div>
        <div className="mt-auto flex justify-between w-full">
          <div className="ui-label">
            Magic: {gameState.magic || 'None'}
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}

export default UI
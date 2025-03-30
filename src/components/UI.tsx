import { GameState } from '../types/game';

interface UIProps {
  gameState: GameState;
}

function UI({ gameState }: UIProps) {
  return (
    <div className="game-ui">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between w-full">
          <div className="ui-label">Weapon</div>
          <div className="ui-label">Armour</div>
        </div>
        <div className="mt-auto flex justify-between w-full">
          <div className="ui-label">Magic</div>
          <div></div>
        </div>
      </div>
    </div>
  );
}

export default UI
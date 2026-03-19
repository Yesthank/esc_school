import type { ItemId } from '../types/game';
import styles from './HUD.module.css';

interface Props {
  timerDisplay: string;
  roomName: string;
  interactPrompt: string;
  inventory: ItemId[];
  getItemName: (id: string) => string;
}

export default function HUD({ timerDisplay, roomName, interactPrompt, inventory, getItemName }: Props) {
  return (
    <>
      <div className={styles.crosshair} />
      <div
        className={styles.interactPrompt}
        style={{ opacity: interactPrompt ? 1 : 0 }}
      >
        {interactPrompt}
      </div>
      <div className={styles.timer}>{timerDisplay}</div>
      <div className={styles.roomName}>{roomName}</div>
      <div className={styles.inventoryBar}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`${styles.invSlot} ${i < inventory.length ? styles.filled : ''}`}
          >
            {i < inventory.length ? getItemName(inventory[i]) : ''}
          </div>
        ))}
      </div>
    </>
  );
}

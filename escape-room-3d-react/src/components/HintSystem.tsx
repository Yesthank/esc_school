import styles from './HintSystem.module.css';

interface Props {
  hintText: string;
  hintVisible: boolean;
  onShowHint: () => void;
}

export default function HintSystem({ hintText, hintVisible, onShowHint }: Props) {
  return (
    <>
      <button className={styles.hintBtn} onClick={onShowHint}>힌트</button>
      {hintVisible && <div className={styles.hintBox}>{hintText}</div>}
    </>
  );
}

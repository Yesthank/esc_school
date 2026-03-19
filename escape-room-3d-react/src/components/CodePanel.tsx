import styles from './CodePanel.module.css';

interface Props {
  open: boolean;
  title: string;
  subtitle: string;
  display: string;
  resultText: string;
  resultColor: string;
  onPress: (key: string) => void;
  onClose: () => void;
}

export default function CodePanel({
  open, title, subtitle, display, resultText, resultColor, onPress, onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h3>{title}</h3>
        <div className={styles.subtitle}>{subtitle}</div>
        <div className={styles.display}>{display}</div>
        <div className={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k) => (
            <button key={k} className={styles.key} onClick={() => onPress(k)}>{k}</button>
          ))}
          <button className={`${styles.key} ${styles.action}`} onClick={() => onPress('clear')}>C</button>
          <button className={styles.key} onClick={() => onPress('0')}>0</button>
          <button className={`${styles.key} ${styles.action}`} onClick={() => onPress('enter')}>OK</button>
        </div>
        <div className={styles.result} style={{ color: resultColor }}>{resultText}</div>
        <button className={styles.closeBtn} onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

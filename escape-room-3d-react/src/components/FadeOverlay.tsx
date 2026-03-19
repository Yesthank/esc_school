import styles from './FadeOverlay.module.css';

interface Props {
  visible: boolean;
  duration: number;
}

export default function FadeOverlay({ visible, duration }: Props) {
  return (
    <div
      className={styles.fade}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${duration}s`,
      }}
    />
  );
}

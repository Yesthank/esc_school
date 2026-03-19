import styles from './Dialog.module.css';

interface Props {
  open: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export default function Dialog({ open, title, content, onClose }: Props) {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.box}>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        <h3>{title}</h3>
        <p className={styles.content}>{content}</p>
      </div>
    </div>
  );
}

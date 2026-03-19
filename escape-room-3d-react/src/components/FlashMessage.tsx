import styles from './FlashMessage.module.css';

interface Props {
  text: string;
}

export default function FlashMessage({ text }: Props) {
  return (
    <div className={styles.flash} style={{ opacity: text ? 1 : 0 }}>
      {text}
    </div>
  );
}

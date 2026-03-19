import styles from './EndingScreen.module.css';

interface Props {
  visible: boolean;
  elapsed: number;
  hintsUsed: number;
  discoveredClues: number;
}

export default function EndingScreen({ visible, elapsed, hintsUsed, discoveredClues }: Props) {
  if (!visible) return null;

  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');

  return (
    <div className={styles.ending}>
      <h1>탈 출 성 공</h1>
      <div className={styles.endingText}>
        문이 열리고, 빛이 쏟아진다.<br /><br />
        기억이 돌아온다. 파편처럼, 그리고 폭포처럼.<br /><br />
        당신은 에코 프로젝트의 수석 연구원이었다.<br />
        지울 수 없는 기억을 스스로 지우기로 선택했다.<br />
        하지만 기억은 완전히 사라지지 않았다.<br /><br />
        반향처럼... 에코처럼... 계속 되돌아왔다.<br /><br />
        <span className={styles.highlight}>
          47번의 루프 끝에, 당신은 마침내<br />기억하기로 선택했다.
        </span>
      </div>
      <div className={styles.stats}>
        클리어 시간: {m}:{s}<br />
        힌트 사용: {hintsUsed}회<br />
        발견한 단서: {discoveredClues}개
      </div>
      <button className={styles.replayBtn} onClick={() => location.reload()}>다시 플레이</button>
    </div>
  );
}

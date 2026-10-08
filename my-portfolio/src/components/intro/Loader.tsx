import styles from "./Loader.module.css";

/** Animated "ST079" wave text used by the intro overlay. */
export default function Loader() {
  return <div className={styles.loader} aria-label="Loading" role="status" />;
}

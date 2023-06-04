import React from "react";
import styles from "./index.module.less";

interface NavBarProps {
    title: string;
}

const NavigationBar: React.FC<NavBarProps> = ({ title }) => (
  <div className={styles.navBar}>
    <div className={styles.title}>{title}</div>
  </div>
);

export default NavigationBar;

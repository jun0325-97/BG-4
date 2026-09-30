// src/components/layout/Header.tsx

import { Link } from "react-router-dom";
import "./Header.scss";

export default function Header() {
  return (
    <header className="global-header">
      <div className="logo">
        <Link to="/">
          <span className="logo-bms">BMS</span>
          <span className="logo-crew"> Club</span>
        </Link>
      </div>
    </header>
  );
}

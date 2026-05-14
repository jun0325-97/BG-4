import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
// 공통 CSS 리셋이나 전역 변수는 여기서 한 번만 임포트하면 돼
import "./styles/global.scss";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import SpinningNjord from "./SpinningNjord";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SpinningNjord />
  </StrictMode>
);

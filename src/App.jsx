import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import SheetViewerMultiPaginated from "./SheetViewerMultiPaginated";

function App() {
  return (
    <BrowserRouter basename="/data-viewer">
      <Routes>
        <Route index element={<LandingPage />} />
  <Route path="/viewer" element={<SheetViewerMultiPaginated />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;

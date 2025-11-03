import { useState } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { Toaster } from "./components/ui/sonner";
import { Home } from "./pages/Home";
import { VisualizerLayer } from "./pages/VisualizerLayer";
import { VisualizerProduct } from "./pages/VisualizerProduct";
import "./App.css";

type Page = "home" | "layer" | "product";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  const handleSelectVisualizer = (type: "layer" | "product") => {
    setCurrentPage(type);
  };

  const handleBack = () => {
    setCurrentPage("home");
  };

  return (
    <ThemeProvider>
      {currentPage === "home" && (
        <Home onSelectVisualizer={handleSelectVisualizer} />
      )}
      {currentPage === "layer" && <VisualizerLayer onBack={handleBack} />}
      {currentPage === "product" && <VisualizerProduct onBack={handleBack} />}
      <Toaster position="top-center" richColors toastOptions={{}} />
    </ThemeProvider>
  );
}

export default App;

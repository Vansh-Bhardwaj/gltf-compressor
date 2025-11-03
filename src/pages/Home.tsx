import { Box, Layers, Package, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HomeProps {
  onSelectVisualizer: (type: "layer" | "product") => void;
}

export function Home({ onSelectVisualizer }: HomeProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Box className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-foreground">
              3D Visualizer Studio
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(
                  "https://github.com/Shopify/gltf-compressor",
                  "_blank"
                );
              }}
            >
              <Github className="w-4 h-4" />
              <span className="sr-only">GitHub</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center flex-1 flex items-center">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight tracking-tight">
            Choose Your{" "}
            <span className="relative whitespace-nowrap text-blue-600">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70 dark:fill-blue-400/50"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative">Visualizer</span>
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explore your 3D models with powerful visualization tools. Layer-by-layer
            breakdowns or interactive product views with exploded diagrams.
          </p>

          {/* Portal Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Layer Visualizer Portal */}
            <Card className="p-8 hover:shadow-xl transition-shadow duration-300 cursor-pointer group border-2 hover:border-blue-500">
              <div
                onClick={() => onSelectVisualizer("layer")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectVisualizer("layer");
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Open Layer Visualizer"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Layer Visualizer
                </h2>
                <p className="text-muted-foreground mb-6">
                  Auto-generate step-by-step breakdowns of your 3D model. Each layer
                  is animated and highlighted with smooth camera transitions.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                  <Layers className="w-4 h-4 mr-2" />
                  Explore Layers
                </Button>
              </div>
            </Card>

            {/* Product Visualizer Portal */}
            <Card className="p-8 hover:shadow-xl transition-shadow duration-300 cursor-pointer group border-2 hover:border-green-500">
              <div
                onClick={() => onSelectVisualizer("product")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectVisualizer("product");
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Open Product Visualizer"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold mb-4 text-foreground">
                  Product Visualizer
                </h2>
                <p className="text-muted-foreground mb-6">
                  Interactive product viewer with hotspots, annotations, and an
                  exploded view to see every component in detail.
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-500 text-white">
                  <Package className="w-4 h-4 mr-2" />
                  View Product
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center border-t">
        <a
          className="text-sm text-muted-foreground hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          href="https://shopify.com"
        >
          Made with{" "}
          <span role="img" aria-label="Green heart">
            💚
          </span>{" "}
          by Shopify
        </a>
      </footer>
    </div>
  );
}

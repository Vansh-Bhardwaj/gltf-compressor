import { Upload, Shield } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { importFiles } from "@/utils/fileIO";
import { useViewportStore } from "@/stores/useViewportStore";

export function SimpleDropzone() {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: importFiles,
    noClick: true,
    noKeyboard: true,
  });

  const { loadingFiles } = useViewportStore();

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 cursor-pointer
        ${
          isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 scale-105"
            : "border-border hover:border-blue-400 dark:hover:border-blue-500 hover:bg-muted/50"
        }
      `}
      {...getRootProps()}
      tabIndex={0}
      role="button"
      aria-label="Upload files"
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.accept = ".glb,.gltf";
        input.onchange = (e) => {
          const files = Array.from((e.target as HTMLInputElement).files || []);
          if (files.length > 0) {
            importFiles(files);
          }
        };
        input.click();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ".glb,.gltf";
          input.onchange = (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (files.length > 0) {
              importFiles(files);
            }
          };
          input.click();
        }
      }}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`
            p-4 rounded-full transition-colors duration-300
            ${
              isDragActive
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground"
            }
          `}
        >
          <Upload className="w-8 h-8" />
        </div>
        {loadingFiles ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-2">
              Loading Model...
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Please wait while your 3D model is being processed
            </p>
            <div className="inline-flex items-center justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-0.3s]"></div>
                <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-0.15s]"></div>
                <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce [animation-duration:0.6s]"></div>
              </div>
            </div>
            <div className="mt-6 h-1.5 w-64 mx-auto bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 dark:bg-blue-400 rounded-full animate-[progress_1.5s_ease-in-out_infinite]"></div>
            </div>
          </div>
        ) : isDragActive ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Drop your files here
            </p>
            <p className="text-muted-foreground mt-2 mb-4">
              Release to load files
            </p>
            <Button className="bg-blue-600 hover:enabled:bg-blue-500 text-white pointer-events-none">
              Let&apos;s go!
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground mb-2">
              Drag & drop your 3D model here
            </p>
            <p className="text-muted-foreground mb-4">
              Upload a .glb or .gltf file with its textures
            </p>
            <Button className="bg-blue-600 hover:enabled:bg-blue-500 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4">
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50"
        >
          <Shield className="w-3 h-3 mr-1" />
          100% Client-side
        </Badge>
      </div>
    </div>
  );
}

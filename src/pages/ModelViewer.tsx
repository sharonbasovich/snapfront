import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Download,
  ArrowLeft,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  PenTool,
  Box,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import ModelViewer3D from "@/components/ModelViewer3D";
import { generate3DModel } from "@/services/api";

const ModelViewer = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [drawingImage, setDrawingImage] = useState<string | null>(null);
  const [originalModelUrl, setOriginalModelUrl] = useState<string | null>(null);
  const [drawingModelUrl, setDrawingModelUrl] = useState<string | null>(null);
  const [isGeneratingDrawingModel, setIsGeneratingDrawingModel] =
    useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingInputRef = useRef<HTMLInputElement>(null);

  // Get the image data from location state
  const imageData = location.state?.imageData;
  const imageFile = location.state?.imageFile;

  useEffect(() => {
    if (!imageData) {
      setError("No image data provided");
      setLoading(false);
      return;
    }

    setSourceImage(imageData);

    // If we have an actual file, generate the 3D model
    if (imageFile) {
      generateOriginalModel(imageFile);
    } else {
      // Fallback to the demo model if no file is provided
      setLoading(false);
      toast({
        title: "Demo 3D Model Loaded",
        description:
          "This is a sample model. Upload an image to generate a custom model.",
      });
    }
  }, [imageData, imageFile, toast]);

  const generateOriginalModel = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const modelBlob = await generate3DModel(file);
      const url = URL.createObjectURL(modelBlob);
      setOriginalModelUrl(url);
      setLoading(false);
      toast({
        title: "3D Model Generated",
        description: "Your 3D model is ready to view and download.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate model");
      setLoading(false);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to generate model",
        variant: "destructive",
      });
    }
  };

  const generateDrawingModel = async (file: File) => {
    setIsGeneratingDrawingModel(true);

    try {
      const modelBlob = await generate3DModel(file);
      const url = URL.createObjectURL(modelBlob);
      setDrawingModelUrl(url);
      toast({
        title: "Drawing-Based Model Generated",
        description: "Your drawing-based 3D model is ready to view.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate drawing-based model",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDrawingModel(false);
    }
  };

  const handleDownload = (modelUrl: string | null, filename: string) => {
    if (modelUrl) {
      const a = document.createElement("a");
      a.href = modelUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your 3D model will download shortly.",
      });
    } else {
      toast({
        title: "No model available",
        description: "Please wait for the model to generate or try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const handleRetry = () => {
    navigate("/");
  };

  const handleGenerateCustomModel = () => {
    // Redirect to custom model viewer page with source and drawing images
    navigate("/custom-model-viewer", {
      state: {
        sourceImage,
        drawingImage,
        modelUrl: drawingModelUrl,
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setSourceImage(event.target.result);
        generateOriginalModel(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setDrawingImage(event.target.result);
        generateDrawingModel(file);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerDrawingUpload = () => {
    drawingInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container max-w-5xl">
          <Button variant="ghost" className="mb-6 -ml-2" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to camera
          </Button>

          {/* Split view: Source Image and 3D Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Source Image Panel */}
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                Source Image
              </h2>

              <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {sourceImage ? (
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <p className="text-muted-foreground">No image available</p>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={triggerFileUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload New Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
              />
            </div>

            {/* 3D Model Panel */}
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Generated 3D Model</h2>

                {/* Drawing Upload Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerDrawingUpload}
                  className="flex items-center gap-1"
                >
                  <PenTool className="h-4 w-4" />
                  <span className="hidden sm:inline">Upload Drawing</span>
                </Button>
                <input
                  type="file"
                  ref={drawingInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg"
                  onChange={handleDrawingUpload}
                />
              </div>

              <div className="aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden flex items-center justify-center relative">
                {loading ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      Generating your 3D model...
                    </p>
                  </div>
                ) : error ? (
                  <div className="text-center text-muted-foreground p-6">
                    <p className="mb-4">{error}</p>
                    <Button variant="outline" onClick={handleRetry}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try again
                    </Button>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    <ModelViewer3D
                      modelPath={originalModelUrl || "/prosthetic-arm.glb"}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={() =>
                  handleDownload(originalModelUrl, "original-model.glb")
                }
                className="w-full"
                disabled={loading || !!error}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Model
              </Button>
            </div>
          </div>

          {/* Drawing Upload Button (shown when no drawing is uploaded) */}
          {!drawingImage && (
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 mb-6">
              <div className="flex flex-col items-center justify-center text-center">
                <PenTool className="h-12 w-12 mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Enhance with Drawing
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a drawing to create a customized version of your 3D
                  model
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={triggerDrawingUpload}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Drawing
                </Button>
                <input
                  type="file"
                  ref={drawingInputRef}
                  className="hidden"
                  accept="image/png,image/jpeg"
                  onChange={handleDrawingUpload}
                />
              </div>
            </div>
          )}

          {/* Drawing-based Model Section (shown after drawing upload) */}
          {drawingImage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Drawing Preview Panel */}
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold flex items-center">
                    <PenTool className="mr-2 h-5 w-5" />
                    Your Drawing
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={triggerDrawingUpload}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Update Drawing
                  </Button>
                </div>

                <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={drawingImage}
                    alt="Drawing"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>

              {/* Drawing-based 3D Model Panel */}
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold">Drawing-Based Model</h2>

                <div className="aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden flex items-center justify-center">
                  {isGeneratingDrawingModel ? (
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">
                        Generating drawing-based model...
                      </p>
                    </div>
                  ) : (
                    <ModelViewer3D
                      modelPath={drawingModelUrl || "/prosthetic-arm.glb"}
                    />
                  )}
                </div>

                <Button
                  onClick={() =>
                    handleDownload(drawingModelUrl, "drawing-model.glb")
                  }
                  className="w-full"
                  disabled={isGeneratingDrawingModel}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Drawing-Based Model
                </Button>
              </div>
            </div>
          )}

          {/* Additional options and information */}
          <div className="bg-black/70 backdrop-blur-sm rounded-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Need to make adjustments? Upload a new image or return to the
                camera.
              </p>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Return to Camera
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModelViewer;

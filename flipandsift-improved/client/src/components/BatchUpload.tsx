import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileImage, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BatchUploadProps {
  onAnalyze: (images: string[]) => void;
  isAnalyzing: boolean;
  maxFiles?: number;
}

export function BatchUpload({ onAnalyze, isAnalyzing, maxFiles = 10 }: BatchUploadProps) {
  const [files, setFiles] = useState<{ file: File; preview: string; status: "pending" | "uploading" | "done" | "error" }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith("image/"));
    
    if (files.length + imageFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const newEntries = imageFiles.map(file => ({
      file,
      preview: "",
      status: "pending" as const
    }));

    // Generate previews
    newEntries.forEach(entry => {
      const reader = new FileReader();
      reader.onloadend = () => {
        entry.preview = reader.result as string;
        setFiles(prev => [...prev]);
      };
      reader.readAsDataURL(entry.file);
    });

    setFiles(prev => [...prev, ...newEntries]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    const previews = files.map(f => f.preview).filter(Boolean);
    if (previews.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }
    onAnalyze(previews);
  };

  const doneCount = files.filter(f => f.status === "done").length;
  const progress = files.length > 0 ? (doneCount / files.length) * 100 : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Batch Upload
          <Badge variant="secondary">Pro Feature</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-gray-400"}
          `}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-700">
            Drop multiple screenshots here
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to select files (max {maxFiles})
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{files.length} file(s) selected</span>
              <button
                onClick={() => setFiles([])}
                className="text-red-500 hover:text-red-600"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {files.map((entry, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                    {entry.preview ? (
                      <img
                        src={entry.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Status indicator */}
                  {entry.status === "done" && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-gray-600">
                  Analyzing {doneCount} of {files.length} images...
                </p>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || files.length === 0}
              className="w-full h-12 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze {files.length} Image{files.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

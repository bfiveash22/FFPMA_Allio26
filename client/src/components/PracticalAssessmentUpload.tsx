import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, CheckCircle2, X, FileVideo, Loader2 } from "lucide-react";

interface PracticalAssessmentUploadProps {
  moduleId: string;
  moduleTitle: string;
  onUploadSuccess?: () => void;
}

export function PracticalAssessmentUpload({ moduleId, moduleTitle, onUploadSuccess }: PracticalAssessmentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadAssessmentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Reusing blood analysis upload endpoint to store assessments on drive.
      const response = await fetch("/api/blood-analysis/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Assessment Submitted!",
        description: "Your practical assessment video has been uploaded for review.",
      });
      if (onUploadSuccess) onUploadSuccess();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast({ title: "Invalid Format", description: "Please upload a video file.", variant: "destructive" });
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Max 200MB allowed.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleUploadClick = () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("analysisType", `assessment-${moduleId}`);
    formData.append("patientId", "assessment-submission"); 
    uploadAssessmentMutation.mutate(formData);
  };

  return (
    <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 mt-8 mb-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Video className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-lg text-emerald-600 dark:text-emerald-500">Practical Assessment</CardTitle>
            <p className="text-sm text-muted-foreground">Upload a video demonstrating your competency for {moduleTitle}.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver ? 'border-emerald-400 bg-emerald-500/10' : selectedFile ? 'border-emerald-400/50 bg-emerald-500/5' : 'border-slate-300 dark:border-white/20 hover:border-emerald-500/50 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div key="file" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="space-y-3">
                <FileVideo className="w-12 h-12 mx-auto text-emerald-500" />
                <p className="font-medium text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">{(selectedFile.size/(1024*1024)).toFixed(1)} MB</p>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                  <X className="w-4 h-4 mr-1"/> Clear
                </Button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="space-y-3">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
                <p className="font-medium text-slate-700 dark:text-slate-300">Drag video here or click to browse</p>
                <Badge variant="outline" className="border-slate-300 dark:border-slate-700">MP4, WebM, MOV (Max 200MB)</Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Button 
          className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
          disabled={!selectedFile || uploadAssessmentMutation.isPending}
          onClick={handleUploadClick}
        >
          {uploadAssessmentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          {uploadAssessmentMutation.isPending ? "Uploading..." : "Submit Assessment Video"}
        </Button>
      </CardContent>
    </Card>
  );
}

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Activity,
  CheckCircle2,
  Loader2,
  FileImage,
  X,
  Sparkles,
  Search,
  Bone // Radiology icon
} from "lucide-react";

export function RadiologyAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState("");
  const [scanType, setScanType] = useState("xray");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-teal-500/20 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
            <Bone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Radiology & Medical Imaging</h3>
              <Badge className="bg-teal-500/20 text-teal-300 border-0 text-xs">DICOM / Matrix</Badge>
            </div>
            <p className="text-sm text-white/60">Upload X-Ray, MRI, PET, Ultrasound, and CT Scans for AI Diagnosis</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label className="text-white/70">Scan Type</Label>
            <Select value={scanType} onValueChange={setScanType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xray">X-Ray (Radiography)</SelectItem>
                <SelectItem value="mri">MRI (Magnetic Resonance)</SelectItem>
                <SelectItem value="pet">PET Scan (Positron Emission)</SelectItem>
                <SelectItem value="ct">CT Scan (Computed Tomography)</SelectItem>
                <SelectItem value="ultrasound">Ultrasound (Sonography)</SelectItem>
                <SelectItem value="dexa">DEXA Scan (Bone Density)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Patient/Member ID</Label>
            <Input
              placeholder="e.g., MEM-001 or Name"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragOver ? 'border-teal-400 bg-teal-500/10' : selectedFile ? 'border-green-400/50 bg-green-500/5' : 'border-white/20 hover:border-teal-500/50 hover:bg-white/5'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".dcm,image/jpeg,image/png,video/mp4"
            onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{selectedFile.name}</p>
                  <p className="text-white/50 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                  <X className="w-4 h-4 mr-1" /> Clear File
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-3"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-white/5 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-white/40" />
                </div>
                <div>
                  <p className="text-white font-medium">Drop DICOM or Image files here (Max 1GB)</p>
                  <p className="text-white/50 text-sm mt-1">
                    Upload medical imaging scans for AI anomaly detection
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            variant="outline"
            disabled={!selectedFile}
            className="border-white/10 hover:bg-white/5 text-white"
            onClick={() => {
               toast({ title: "Upload Started", description: "Saving to secure patient record vault." });
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Save to Patient Record
          </Button>
          <Button
            disabled={!selectedFile}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
            onClick={() => {
              toast({ title: "Radiology AI Engaged", description: "Analyzing scan for anomalies..." });
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze Scan AI
          </Button>
        </div>
      </Card>
    </div>
  );
}

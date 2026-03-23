import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Upload,
  Video,
  Play,
  Square,
  Sparkles,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Scan,
  User,
  Image as ImageIcon
} from "lucide-react";

interface AIBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  color: string;
}

export function SkinAnalyzer() {
  const [activeTab, setActiveTab] = useState("upload");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState<AIBox[]>([]);
  const [findings, setFindings] = useState<string[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  
  // Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err) {
        console.warn("Camera access not immediately granted or available.");
      }
    }
    getDevices();
    return () => stopStream();
  }, []);

  const startStream = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: selectedDeviceId ? { 
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        } : {
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      toast({ title: "Stream Error", description: err.message, variant: "destructive" });
    }
  };

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsAnalyzing(false);
    setDetectedBoxes([]);
  };

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.9);
    }
    return null;
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      // Mocking endpoint for Skin Analysis
      const response = await fetch("/api/dermatology/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setDetectedBoxes(data.boxes || []);
        setFindings(data.findings || []);
      }
    },
  });

  // Handle Drag & Drop for iPad/IBOOLO pictures
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setSelectedFile(file);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-rose-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Dermatology AI Analysis</h3>
              <Badge className="bg-rose-500/20 text-rose-300 border-0 text-xs">IBOOLO Ready</Badge>
            </div>
            <p className="text-sm text-white/60">High-resolution skin lesion & melanoma detection</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-black/40 border border-white/10">
          <TabsTrigger value="upload" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">
            <Upload className="w-4 h-4 mr-2" /> Upload Dermatoscope Image
          </TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300">
            <Camera className="w-4 h-4 mr-2" /> Live USB Dermatoscope
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <div 
            className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              dragOver ? 'border-rose-400 bg-rose-500/10' : selectedFile ? 'border-green-400/50 bg-green-500/5' : 'border-white/20 hover:border-rose-500/50 hover:bg-white/5'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/heic"
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
              }}
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
                <p className="text-white font-medium">{selectedFile.name}</p>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Clear</Button>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="w-10 h-10 text-white/40 mx-auto mb-3" />
                <p className="text-white font-medium">Drop IBOOLO image here or click to browse</p>
                <p className="text-white/50 text-sm">Supports high-res JPEG, PNG, HEIC from iPhone/iPad</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button disabled={!selectedFile} className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Skin Lesion
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-white/10">
             <select
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                if (stream) { stopStream(); setTimeout(startStream, 300); }
              }}
            >
              <option value="">Select Video Input Source</option>
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0,5)}`}</option>
              ))}
            </select>
            {!stream ? (
              <Button onClick={startStream} className="bg-rose-500 hover:bg-rose-600">
                <Play className="w-4 h-4 mr-2" /> Connect Feed
              </Button>
            ) : (
              <Button onClick={stopStream} variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
                <Square className="w-4 h-4 mr-2" /> Disconnect
              </Button>
            )}
          </div>

          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner">
            {!stream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                <Camera className="w-12 h-12 mb-3 opacity-50" />
                <p>Waiting for dermatoscope signal...</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                <canvas ref={canvasRef} className="hidden" />
                {/* Overlay processing logic would go here similar to MicroscopeLiveAnalyzer */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono text-white/90">LIVE FEED</span>
                </div>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

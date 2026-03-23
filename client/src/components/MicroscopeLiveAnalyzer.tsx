import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Microscope,
  Video,
  Play,
  Square,
  Sparkles,
  Camera,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw
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

export function MicroscopeLiveAnalyzer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedBoxes, setDetectedBoxes] = useState<AIBox[]>([]);
  const [findings, setFindings] = useState<string[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Enumerate devices on mount
    async function getDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request perm first
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      } catch (err: any) {
        toast({
          title: "Camera Access Denied",
          description: "Please allow access to your camera/microscope.",
          variant: "destructive"
        });
      }
    }
    getDevices();

    return () => {
      stopStream();
    };
  }, []);

  const startStream = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: selectedDeviceId ? { 
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 }
        } : {
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: any) {
      toast({
        title: "Stream Error",
        description: err.message,
        variant: "destructive"
      });
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
      // Return base64 JPEG
      return canvas.toDataURL("image/jpeg", 0.8);
    }
    return null;
  }, []);

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await fetch("/api/blood-analysis/live-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        // AI returns bounding boxes relative to video percentage
        setDetectedBoxes(data.boxes || []);
        setFindings(data.findings || []);
      }
    },
    onError: (error: any) => {
      // Don't toast every 5 seconds if loop is running, just log
      console.warn("Live analysis error:", error.message);
    }
  });

  const generateProtocolMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/blood-analysis/generate-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ findings }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Protocol Queued",
        description: "Agent NEXUS has begun generating the presentation and clinical notes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Start Protocol",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Autonomous analyzing loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing && stream) {
      interval = setInterval(() => {
        const frame = captureFrame();
        if (frame && !analyzeMutation.isPending) {
          analyzeMutation.mutate(frame);
        }
      }, 5000); // Analyze every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, stream, captureFrame, analyzeMutation]);

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-violet-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">Live USB Microscope</h3>
              <Badge className="bg-violet-500/20 text-violet-300 border-0 text-xs">AI Vision</Badge>
            </div>
            <p className="text-sm text-white/60">Real-time object detection & anomaly tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {devices.length > 0 && (
            <select
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                if (stream) {
                  stopStream();
                  setTimeout(startStream, 300);
                }
              }}
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.substring(0,5)}`}</option>
              ))}
            </select>
          )}

          {!stream ? (
            <Button onClick={startStream} className="bg-violet-500 hover:bg-violet-600">
              <Play className="w-4 h-4 mr-2" /> Connect Feed
            </Button>
          ) : (
            <Button onClick={stopStream} variant="destructive" className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
              <Square className="w-4 h-4 mr-2" /> Disconnect
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Main Monitor */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-inner">
            {!stream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
                <Video className="w-12 h-12 mb-3 opacity-50" />
                <p>Waiting for microscope signal...</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* AR Bounding Boxes Overlay */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {/* Scanning Effect */}
                      <motion.div
                        className="w-full h-1 bg-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                        animate={{ y: ["0%", "100%", "0%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      />

                      {/* Boxes */}
                      {detectedBoxes.map(box => (
                        <motion.div
                          key={box.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute border-2 pointer-events-auto group cursor-crosshair transition-all"
                          style={{
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                            borderColor: box.color,
                            backgroundColor: `${box.color}20`
                          }}
                        >
                          <div className="absolute -top-6 left-0 px-2 py-0.5 rounded text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: box.color }}>
                            {box.label} {(box.confidence * 100).toFixed(0)}%
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live Indicator */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-mono text-white/90">LIVE</span>
                </div>
              </>
            )}
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={isAnalyzing ? "default" : "outline"}
                disabled={!stream}
                className={isAnalyzing ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]" : "border-fuchsia-500/50 text-fuchsia-400"}
                onClick={() => setIsAnalyzing(!isAnalyzing)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isAnalyzing ? "Stop Autonomous Analysis" : "Start Autonomous AI"}
              </Button>
              <Button
                variant="outline"
                disabled={!stream || analyzeMutation.isPending}
                className="border-white/10"
                onClick={() => {
                  const frame = captureFrame();
                  if (frame) analyzeMutation.mutate(frame);
                }}
              >
                <Camera className="w-4 h-4 mr-2" />
                Snapshot Analysis
              </Button>
            </div>

            {analyzeMutation.isPending && (
              <div className="flex items-center gap-2 text-fuchsia-400 text-sm animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Processing Frame...
              </div>
            )}
          </div>
        </div>

        {/* Telemetry / Summary */}
        <div className="bg-black/30 rounded-xl border border-white/10 p-5 h-[300px] lg:h-auto overflow-y-auto">
          <h4 className="font-bold flex items-center gap-2 mb-4 text-white">
            <Activity className="w-4 h-4 text-violet-400" />
            AI Telemetry
          </h4>
          
          {!stream ? (
            <div className="text-center text-white/40 mt-10">
              <p className="text-sm">Connect feed to begin telemetry</p>
            </div>
          ) : findings.length === 0 ? (
            <div className="space-y-3">
              <div className="h-6 bg-white/5 rounded animate-pulse w-3/4" />
              <div className="h-6 bg-white/5 rounded animate-pulse w-1/2" />
              <div className="h-6 bg-white/5 rounded animate-pulse w-5/6" />
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((finding, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
                  <span className="text-white/80">{finding}</span>
                </motion.div>
              ))}
            </div>
          )}

          {findings.length > 0 && !isAnalyzing && (
            <div className="mt-6">
              <Button 
                className="w-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                onClick={() => generateProtocolMutation.mutate()}
                disabled={generateProtocolMutation.isPending}
              >
                {generateProtocolMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Finalize & Generate Protocol
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

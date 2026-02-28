import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoData: string) => void;
  title?: string;
  countdownSeconds?: number;
}

export function CameraCapture({
  isOpen,
  onClose,
  onCapture,
  title = 'Verification Photo',
  countdownSeconds = 3,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch {
      setError('Unable to access camera. Please allow camera permissions.');
      setIsLoading(false);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCountdown(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, startCamera, stopCamera]);

  // Start countdown and capture
  const startCountdown = useCallback(() => {
    setCountdown(countdownSeconds);
  }, [countdownSeconds]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown < 0) return;

    if (countdown === 0) {
      // Capture photo
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const photoData = canvas.toDataURL('image/jpeg', 0.9);
          setCapturedPhoto(photoData);
        }
      }
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setCountdown(null);
  };

  // Submit photo
  const handleSubmit = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative aspect-[4/3] bg-muted">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={startCamera}>
                Try Again
              </Button>
            </div>
          )}

          {!capturedPhoto && !error && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'w-full h-full object-cover',
                  isLoading && 'opacity-0'
                )}
              />
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-dashed border-primary/50 rounded-full" />
              </div>
            </>
          )}

          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Countdown overlay */}
          {countdown !== null && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/30">
              <div className="text-8xl font-bold text-primary-foreground animate-pulse">
                {countdown}
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Actions */}
        <div className="p-4 space-y-3">
          {!capturedPhoto ? (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Position your face in the circle and press capture
              </p>
              <Button
                onClick={startCountdown}
                disabled={isLoading || !!error || countdown !== null}
                className="w-full h-12"
              >
                {countdown !== null ? (
                  `Capturing in ${countdown}...`
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Capture Photo
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Review your photo before submitting
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetake}
                  className="flex-1 h-12"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retake
                </Button>
                <Button onClick={handleSubmit} className="flex-1 h-12">
                  <Check className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

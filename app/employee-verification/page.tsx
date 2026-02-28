'use client'

import { ProtectedLayout } from '@/components/layout/ProtectedLayout'
import { useState } from 'react';
import { Camera, Video, Check, X, Clock, User, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useVerification, VerificationRequest } from '@/contexts/VerificationContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function EmployeeVerification() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    getRequestsForEmployee,
    getPendingRequestsForEmployee,
    submitVerification
  } = useVerification();

  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [verificationType, setVerificationType] = useState<'photo' | 'video' | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequests = getRequestsForEmployee(user?.id || '4');
  const pendingRequests = getPendingRequestsForEmployee(user?.id || '4');
  const completedRequests = allRequests.filter(r => r.status === 'completed' || r.response);

  const handleSelectType = (type: 'photo' | 'video') => {
    setVerificationType(type);
    setShowCamera(true);
  };

  const handleCapture = (mediaData: string) => {
    setCapturedMedia(mediaData);
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    if (!capturedMedia || !selectedRequest) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    submitVerification(
      selectedRequest.id,
      verificationType === 'photo' ? 'image' : 'video',
      capturedMedia
    );

    toast({
      title: 'Verification Submitted',
      description: 'Your verification has been sent to your manager for review.',
    });

    setIsSubmitting(false);
    setSelectedRequest(null);
    setCapturedMedia(null);
    setVerificationType(null);
  };

  const handleRetake = () => {
    setCapturedMedia(null);
    setShowCamera(true);
  };

  const handleCancel = () => {
    setSelectedRequest(null);
    setCapturedMedia(null);
    setVerificationType(null);
  };

  const renderRequestCard = (request: VerificationRequest) => (
    <Card
      key={request.id}
      className={cn(
        "hover:shadow-card transition-shadow cursor-pointer",
        request.status === 'pending' && "border-warning/50"
      )}
      onClick={() => request.status === 'pending' && setSelectedRequest(request)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
            {request.managerName.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{request.title}</h3>
              <Badge
                variant={
                  request.response?.status === 'approved' ? 'default' :
                    request.response?.status === 'rejected' ? 'destructive' :
                      request.status === 'completed' ? 'secondary' : 'outline'
                }
              >
                {request.response ? request.response.status : request.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>From: {request.managerName}</span>
              <span>•</span>
              <span>{format(request.requestedAt, 'MMM d, h:mm a')}</span>
            </div>

            {request.response && (
              <div className={cn(
                "mt-3 p-3 rounded-lg",
                request.response.status === 'approved' ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                <p className="text-sm">
                  <strong>Response:</strong> {request.response.comment || 'No comment'}
                </p>
              </div>
            )}

            {request.status === 'pending' && (
              <Button size="sm" className="mt-3">
                Complete Verification
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Verification capture UI
  if (selectedRequest) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Verification</h1>
          <p className="text-muted-foreground mt-1">
            {selectedRequest.title}
          </p>
        </div>

        {/* Request Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Verification Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold">
                {selectedRequest.managerName.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="font-semibold">{selectedRequest.managerName}</p>
                <p className="text-sm text-muted-foreground">
                  Requested at {format(selectedRequest.requestedAt, 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="p-4 bg-accent rounded-lg">
              <p className="text-sm">&quot;{selectedRequest.description}&quot;</p>
            </div>
          </CardContent >
        </Card >

        {/* Verification Options or Preview */}
        {
          !capturedMedia ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Choose Verification Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSelectType('photo')}
                    className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-light transition-all group"
                  >
                    <div className="p-4 rounded-full bg-muted group-hover:bg-primary-light transition-colors">
                      <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Photo</p>
                      <p className="text-xs text-muted-foreground">Take a selfie</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectType('video')}
                    className="flex flex-col items-center gap-4 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary-light transition-all group"
                  >
                    <div className="p-4 rounded-full bg-muted group-hover:bg-primary-light transition-colors">
                      <Video className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Video</p>
                      <p className="text-xs text-muted-foreground">Record a short clip</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card >
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-video">
                  <img
                    src={capturedMedia}
                    alt="Verification preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-success/90 text-success-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Captured
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleRetake}>
                    Retake
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        }

        {/* Cancel Button */}
        <Button variant="outline" className="w-full" onClick={handleCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 bg-accent rounded-xl">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Privacy Notice</p>
            <p>
              Your verification photo/video will only be shared with your manager for attendance verification purposes.
            </p>
          </div>
        </div>

        {/* Camera Modal */}
        <CameraCapture
          isOpen={showCamera}
          onClose={() => {
            setShowCamera(false);
            setVerificationType(null);
          }}
          onCapture={handleCapture}
          title={verificationType === 'photo' ? 'Take Verification Photo' : 'Record Verification Video'}
          countdownSeconds={3}
        />
      </div >
    );
  }

  return (
    <ProtectedLayout>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Verification Requests</h1>
          <p className="text-muted-foreground">
            View and complete verification requests from your managers
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning/10">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-success/10">
                  <Check className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Check className="h-10 w-10 mx-auto mb-2 text-success" />
                  <p className="text-muted-foreground">No pending verification requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map(req => renderRequestCard(req))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <ImageIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No completed verifications yet</p>
                </CardContent>
              </Card>
            ) : (
              completedRequests.map(req => renderRequestCard(req))
            )}
          </TabsContent>
        </Tabs>
      </div>

    </ProtectedLayout>
  );
}

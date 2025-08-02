/**
 * File List Component for Passdowns
 * Displays and manages file attachments with download/preview capabilities
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { 
  Download,
  Eye,
  Trash2,
  File,
  Image,
  FileText,
  Video,
  Music,
  Archive,
  Calendar,
  User,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { PassdownAttachment } from '../../lib/types/passdown';
import { usePassdownService } from '../../services/ServiceProvider';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface FileListProps {
  attachments: PassdownAttachment[];
  onAttachmentDelete?: (attachmentId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  maxHeight?: string;
}

interface PreviewModalProps {
  attachment: PassdownAttachment | null;
  downloadUrl: string | null;
  onClose: () => void;
}

function PreviewModal({ attachment, downloadUrl, onClose }: PreviewModalProps) {
  if (!attachment || !downloadUrl) return null;

  const isImage = attachment.fileType.startsWith('image/');
  const isPdf = attachment.fileType === 'application/pdf';
  const isVideo = attachment.fileType.startsWith('video/');
  const isAudio = attachment.fileType.startsWith('audio/');

  return (
    <AlertDialog open={!!attachment} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <AlertDialogTitle className="text-lg">{attachment.fileName}</AlertDialogTitle>
              <AlertDialogDescription>
                {formatFileSize(attachment.fileSize)} • {attachment.fileType}
              </AlertDialogDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(downloadUrl, '_blank')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </AlertDialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {isImage && (
            <div className="flex justify-center p-4">
              <img 
                src={downloadUrl} 
                alt={attachment.fileName}
                className="max-w-full max-h-[60vh] object-contain rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden text-center p-8">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">Unable to preview image</p>
              </div>
            </div>
          )}
          
          {isPdf && (
            <div className="h-[60vh]">
              <iframe 
                src={downloadUrl} 
                className="w-full h-full border rounded-lg"
                title={attachment.fileName}
              />
            </div>
          )}
          
          {isVideo && (
            <div className="flex justify-center p-4">
              <video 
                controls 
                className="max-w-full max-h-[60vh] rounded-lg"
                preload="metadata"
              >
                <source src={downloadUrl} type={attachment.fileType} />
                Your browser does not support the video tag.
              </video>
            </div>
          )}
          
          {isAudio && (
            <div className="flex justify-center p-8">
              <div className="w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <Music className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{attachment.fileName}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                </div>
                <audio controls className="w-full">
                  <source src={downloadUrl} type={attachment.fileType} />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            </div>
          )}
          
          {!isImage && !isPdf && !isVideo && !isAudio && (
            <div className="text-center p-8">
              <File className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 mb-4">Preview not available for this file type</p>
              <Button 
                onClick={() => window.open(downloadUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download to view
              </Button>
            </div>
          )}
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Helper function (should be shared utility)
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function FileListComponent({
  attachments,
  onAttachmentDelete,
  showActions = true,
  compact = false,
  maxHeight = '400px'
}: FileListProps) {
  const [previewAttachment, setPreviewAttachment] = useState<PassdownAttachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteAttachment, setDeleteAttachment] = useState<PassdownAttachment | null>(null);
  const [loadingDownloads, setLoadingDownloads] = useState<Set<string>>(new Set());
  const passdownService = usePassdownService();

  // Get file type icon
  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    if (fileType.startsWith('audio/')) return Music;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return FileText;
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive;
    return File;
  }, []);

  // Handle file download
  const handleDownload = useCallback(async (attachment: PassdownAttachment) => {
    if (loadingDownloads.has(attachment.id)) return;

    setLoadingDownloads(prev => new Set(prev).add(attachment.id));
    
    try {
      const result = await passdownService.getAttachmentDownloadUrl(
        attachment.id,
        {
          userId: 'current-user', // Will be populated from auth context
          userEmail: 'user@example.com', // Will be populated from auth context
          companyId: 'current-company', // Will be populated from auth context
          token: 'auth-token' // Will be populated from auth context
        }
      );

      if (result.success && result.data) {
        // Create download link
        const link = document.createElement('a');
        link.href = result.data.downloadUrl;
        link.download = attachment.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Download started');
      } else {
        throw new Error(result.error || 'Failed to get download URL');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      toast.error(errorMessage);
    } finally {
      setLoadingDownloads(prev => {
        const next = new Set(prev);
        next.delete(attachment.id);
        return next;
      });
    }
  }, [loadingDownloads, passdownService]);

  // Handle file preview
  const handlePreview = useCallback(async (attachment: PassdownAttachment) => {
    if (loadingDownloads.has(attachment.id)) return;

    setLoadingDownloads(prev => new Set(prev).add(attachment.id));
    
    try {
      const result = await passdownService.getAttachmentDownloadUrl(
        attachment.id,
        {
          userId: 'current-user', // Will be populated from auth context
          userEmail: 'user@example.com', // Will be populated from auth context
          companyId: 'current-company', // Will be populated from auth context
          token: 'auth-token' // Will be populated from auth context
        }
      );

      if (result.success && result.data) {
        setPreviewAttachment(attachment);
        setPreviewUrl(result.data.downloadUrl);
      } else {
        throw new Error(result.error || 'Failed to get preview URL');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Preview failed';
      toast.error(errorMessage);
    } finally {
      setLoadingDownloads(prev => {
        const next = new Set(prev);
        next.delete(attachment.id);
        return next;
      });
    }
  }, [loadingDownloads, passdownService]);

  // Handle file deletion
  const handleDelete = useCallback(async (attachment: PassdownAttachment) => {
    try {
      const result = await passdownService.deleteAttachment(
        attachment.id,
        {
          userId: 'current-user', // Will be populated from auth context
          userEmail: 'user@example.com', // Will be populated from auth context
          companyId: 'current-company', // Will be populated from auth context
          token: 'auth-token' // Will be populated from auth context
        }
      );

      if (result.success) {
        onAttachmentDelete?.(attachment.id);
        toast.success('Attachment deleted successfully');
        setDeleteAttachment(null);
      } else {
        throw new Error(result.error || 'Failed to delete attachment');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      toast.error(errorMessage);
    }
  }, [passdownService, onAttachmentDelete]);

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No attachments</p>
      </div>
    );
  }

  if (compact) {
    // Compact view - just file badges
    return (
      <div className="flex flex-wrap gap-2">
        {attachments.map((attachment) => {
          const FileIcon = getFileIcon(attachment.fileType);
          
          return (
            <TooltipProvider key={attachment.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => handlePreview(attachment)}
                  >
                    <FileIcon className="w-3 h-3" />
                    {attachment.fileName}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs">
                    <p className="font-medium">{attachment.fileName}</p>
                    <p>{formatFileSize(attachment.fileSize)}</p>
                    <p>Uploaded {formatDistanceToNow(new Date(attachment.uploadedAt))} ago</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Attachments</CardTitle>
              <CardDescription>
                {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            className="space-y-3 overflow-y-auto"
            style={{ maxHeight }}
          >
            {attachments.map((attachment) => {
              const FileIcon = getFileIcon(attachment.fileType);
              const isLoading = loadingDownloads.has(attachment.id);
              
              return (
                <div 
                  key={attachment.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileIcon className="w-6 h-6 text-gray-600 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {attachment.fileName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(attachment.fileSize)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {attachment.uploadedByName}
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(attachment.uploadedAt))} ago
                      </div>
                    </div>
                    
                    {attachment.description && (
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {attachment.description}
                      </p>
                    )}
                  </div>
                  
                  {showActions && (
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(attachment)}
                              disabled={isLoading}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(attachment)}
                              disabled={isLoading}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteAttachment(attachment)}
                              disabled={isLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <PreviewModal 
        attachment={previewAttachment}
        downloadUrl={previewUrl}
        onClose={() => {
          setPreviewAttachment(null);
          setPreviewUrl(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog 
        open={!!deleteAttachment} 
        onOpenChange={() => setDeleteAttachment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteAttachment?.fileName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteAttachment && handleDelete(deleteAttachment)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
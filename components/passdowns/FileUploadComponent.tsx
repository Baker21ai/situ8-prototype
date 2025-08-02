/**
 * File Upload Component for Passdowns
 * Handles drag & drop file uploads with progress tracking
 */

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  Textarea 
} from '../ui/textarea';
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
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image,
  FileText,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { PassdownAttachment } from '../../lib/types/passdown';
import { usePassdownService } from '../../services/ServiceProvider';
import { toast } from 'sonner';

interface FileUploadProps {
  passdownId: string;
  onUploadComplete?: (attachments: PassdownAttachment[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  disabled?: boolean;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  attachment?: PassdownAttachment;
  description?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

export function FileUploadComponent({
  passdownId,
  onUploadComplete,
  onUploadError,
  maxFiles = MAX_FILES,
  maxFileSize = MAX_FILE_SIZE,
  disabled = false
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDescriptionDialog, setShowDescriptionDialog] = useState<string | null>(null);
  const [tempDescription, setTempDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Validate files
  const validateFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = [];
    const errors: string[] = [];

    // Check total file count
    if (files.length + fileList.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { files: newFiles, errors };
    }

    Array.from(fileList).forEach((file) => {
      // Validate using service method
      const validation = passdownService.validateFile(file, maxFileSize);
      
      if (validation.isValid) {
        newFiles.push({
          file,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          progress: 0,
          status: 'pending'
        });
      } else {
        errors.push(`${file.name}: ${validation.errors.map(e => e.message).join(', ')}`);
      }
    });

    return { files: newFiles, errors };
  }, [files.length, maxFiles, maxFileSize, passdownService]);

  // Handle file selection
  const handleFileSelect = useCallback((fileList: FileList) => {
    const { files: newFiles, errors } = validateFiles(fileList);

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [validateFiles]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const { files: droppedFiles } = e.dataTransfer;
    if (droppedFiles && droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Upload single file
  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const, progress: 0 } : f
      ));

      // Upload file using service
      const result = await passdownService.uploadFileToPassdown(
        passdownId,
        uploadFile.file,
        uploadFile.description,
        { 
          userId: 'current-user', // Will be populated from auth context
          userEmail: 'user@example.com', // Will be populated from auth context
          companyId: 'current-company', // Will be populated from auth context
          token: 'auth-token' // Will be populated from auth context
        }
      );

      if (result.success && result.data) {
        // Update file status to completed
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'completed' as const, progress: 100, attachment: result.data }
            : f
        ));

        toast.success(`${uploadFile.file.name} uploaded successfully`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Update file status to error
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error' as const, error: errorMessage }
          : f
      ));

      toast.error(`Failed to upload ${uploadFile.file.name}: ${errorMessage}`);
      onUploadError?.(errorMessage);
    }
  }, [passdownId, passdownService, onUploadError]);

  // Upload all pending files
  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) return;

    // Upload files in parallel (with reasonable concurrency)
    const uploadPromises = pendingFiles.map(file => uploadFile(file));
    await Promise.all(uploadPromises);

    // Notify completion
    const completedAttachments = files
      .filter(f => f.status === 'completed' && f.attachment)
      .map(f => f.attachment!);
    
    if (completedAttachments.length > 0) {
      onUploadComplete?.(completedAttachments);
    }
  }, [files, uploadFile, onUploadComplete]);

  // Add description to file
  const addDescription = useCallback((fileId: string, description: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, description } : f
    ));
  }, []);

  // Handle description dialog
  const handleDescriptionSubmit = useCallback(() => {
    if (showDescriptionDialog) {
      addDescription(showDescriptionDialog, tempDescription);
      setShowDescriptionDialog(null);
      setTempDescription('');
    }
  }, [showDescriptionDialog, tempDescription, addDescription]);

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <Upload className="w-8 h-8 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag files here'}
            </p>
            <p className="text-xs text-gray-500">
              Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
            </p>
            <p className="text-xs text-gray-400">
              Supports images, documents, videos, audio, and archives
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Files ({files.length})</h4>
            {pendingCount > 0 && (
              <Button 
                size="sm" 
                onClick={uploadAllFiles}
                disabled={disabled || uploadingCount > 0}
                className="flex items-center gap-2"
              >
                {uploadingCount > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload All ({pendingCount})
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((uploadFile) => {
              const FileIcon = getFileIcon(uploadFile.file.type);
              
              return (
                <div 
                  key={uploadFile.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {uploadFile.file.name}
                      </p>
                      <Badge 
                        variant={uploadFile.status === 'completed' ? 'default' : 
                                uploadFile.status === 'error' ? 'destructive' : 'secondary'}
                      >
                        {uploadFile.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                      {uploadFile.description && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <p className="text-xs text-gray-600 truncate">
                            {uploadFile.description}
                          </p>
                        </>
                      )}
                    </div>
                    
                    {uploadFile.status === 'uploading' && (
                      <Progress value={uploadFile.progress} className="mt-2" />
                    )}
                    
                    {uploadFile.status === 'error' && uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {uploadFile.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDescriptionDialog(uploadFile.id);
                          setTempDescription(uploadFile.description || '');
                        }}
                        disabled={disabled}
                      >
                        Add Note
                      </Button>
                    )}
                    
                    {uploadFile.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    
                    {uploadFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    
                    {uploadFile.status === 'uploading' && (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadFile.id)}
                      disabled={disabled || uploadFile.status === 'uploading'}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Summary */}
          {(completedCount > 0 || errorCount > 0) && (
            <div className="flex items-center gap-4 text-xs text-gray-600">
              {completedCount > 0 && (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {completedCount} uploaded
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  {errorCount} failed
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Description Dialog */}
      <AlertDialog open={!!showDescriptionDialog} onOpenChange={() => setShowDescriptionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Description</AlertDialogTitle>
            <AlertDialogDescription>
              Add an optional description for this file attachment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <Textarea
            placeholder="Enter description..."
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            maxLength={255}
            rows={3}
          />
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDescriptionSubmit}>
              Add Description
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
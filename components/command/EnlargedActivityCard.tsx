import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Camera } from 'lucide-react';
import { 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  MessageSquare,
  Edit3,
  Save,
  X,
  Zap,
  Shield
} from 'lucide-react';
import { ActivityData } from '../../lib/types/activity';
import { DialOption } from './ModularCommandCenter';

interface EnlargedActivityCardProps {
  activity: ActivityData;
  onClose: () => void;
  onOptionChange: (option: DialOption) => void;
  className?: string;
}

export const EnlargedActivityCard: React.FC<EnlargedActivityCardProps> = ({
  activity,
  onClose,
  onOptionChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState(activity);
  const [newNote, setNewNote] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSave = () => {
    // In real implementation, this would update the activity via API/store
    console.log('Saving activity:', editedActivity);
    setIsEditing(false);
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In real implementation, add note to activity
      console.log('Adding note:', newNote);
      setNewNote('');
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setEditedActivity(prev => ({ ...prev, status: newStatus as any }));
  };

  const handleAssignGuard = () => {
    // Switch to guards panel and highlight assignment
    onOptionChange('guards');
  };

  const handleViewCameras = () => {
    // Switch to cameras panel
    onOptionChange('cameras');
  };

  const handleViewTimeline = () => {
    // Switch to timeline panel
    onOptionChange('timeline');
  };

  return (
    <Card className={`w-full border-2 border-blue-200 shadow-lg ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {/* Priority Indicator */}
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-4 h-4 rounded-full ${getPriorityColor(activity.priority)}`} />
              <Zap className="h-5 w-5 text-blue-600" />
            </div>

            {/* Activity Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedActivity.title}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, title: e.target.value }))}
                    className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none flex-1"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-gray-900">{activity.title}</h2>
                )}
                
                <Badge className={getStatusColor(editedActivity.status)}>
                  {editedActivity.status.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>

              {/* Metadata Row */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(activity.created_at).toLocaleString()}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {activity.location}
                </div>
                {activity.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {activity.assignedTo}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-3">
                {isEditing ? (
                  <Textarea
                    value={editedActivity.description}
                    onChange={(e) => setEditedActivity(prev => ({ ...prev, description: e.target.value }))}
                    className="resize-none"
                    rows={2}
                  />
                ) : (
                  <p className="text-gray-700">{activity.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Controls */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="gap-1">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Status Update */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Status</label>
            <Select value={editedActivity.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Actions */}
          <Button variant="outline" size="sm" onClick={handleAssignGuard} className="h-8">
            <Shield className="h-4 w-4 mr-1" />
            Assign Guard
          </Button>

          <Button variant="outline" size="sm" onClick={handleViewCameras} className="h-8">
            <Camera className="h-4 w-4 mr-1" />
            View Cameras
          </Button>

          <Button variant="outline" size="sm" onClick={handleViewTimeline} className="h-8">
            <Clock className="h-4 w-4 mr-1" />
            Timeline
          </Button>
        </div>

        {/* Notes Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Add Note</label>
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a note about this activity..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="resize-none flex-1"
              rows={2}
            />
            <Button onClick={handleAddNote} disabled={!newNote.trim()} className="self-end">
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {activity.priority === 'high' ? '< 5m' : '< 15m'}
            </div>
            <div className="text-xs text-gray-600">Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {activity.assignedTo ? '1' : '0'}
            </div>
            <div className="text-xs text-gray-600">Guards Assigned</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {Math.floor(Math.random() * 30) + 1}m
            </div>
            <div className="text-xs text-gray-600">Age</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnlargedActivityCard;
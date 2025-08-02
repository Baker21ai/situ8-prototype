/**
 * PassdownDashboard Component
 * Main UI for viewing and managing shift passdowns
 */

import React, { useEffect, useState, useMemo } from 'react';
import { usePassdownStore } from '../stores/passdownStore';
import { useServices } from '../services/ServiceProvider';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Grid, 
  List, 
  Filter,
  Plus,
  Archive,
  ChevronDown,
  User,
  MapPin,
  Tag,
  CheckCircle,
  Eye,
  Bell,
  BellOff
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Skeleton } from './ui/skeleton';
import { 
  PassdownSummary, 
  ShiftType, 
  UrgencyLevel, 
  PassdownStatus,
  PassdownFilters 
} from '../lib/types/passdown';
import { formatDistanceToNow } from 'date-fns';

// Shift type display mapping
const shiftTypeLabels: Record<ShiftType, string> = {
  night: 'Night Shift',
  day: 'Day Shift',
  evening: 'Evening Shift',
  swing: 'Swing Shift',
  custom: 'Custom Shift'
};

// Urgency level colors and icons
const urgencyConfig: Record<UrgencyLevel, { color: string; icon: React.ReactNode }> = {
  low: { color: 'bg-green-100 text-green-800', icon: null },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: null },
  high: { color: 'bg-orange-100 text-orange-800', icon: <AlertCircle className="w-3 h-3" /> },
  critical: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-3 h-3" /> }
};

// Status colors
const statusConfig: Record<PassdownStatus, { color: string; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
  active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
  acknowledged: { color: 'bg-green-100 text-green-800', label: 'Acknowledged' },
  expired: { color: 'bg-gray-100 text-gray-600', label: 'Expired' },
  archived: { color: 'bg-gray-100 text-gray-500', label: 'Archived' }
};

interface PassdownDashboardProps {
  onCreateNew?: () => void;
  onSelectPassdown?: (passdown: PassdownSummary) => void;
}

export function PassdownDashboard({ onCreateNew, onSelectPassdown }: PassdownDashboardProps) {
  const {
    passdowns,
    loading,
    error,
    filters,
    viewMode,
    showArchived,
    stats,
    currentPage,
    totalPages,
    fetchPassdowns,
    fetchCurrentShiftPassdowns,
    fetchUrgentPassdowns,
    setFilters,
    clearFilters,
    setViewMode,
    setShowArchived,
    clearError
  } = usePassdownStore();

  const [quickFilter, setQuickFilter] = useState<'all' | 'current' | 'urgent'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial fetch
  useEffect(() => {
    if (quickFilter === 'current') {
      fetchCurrentShiftPassdowns();
    } else if (quickFilter === 'urgent') {
      fetchUrgentPassdowns();
    } else {
      fetchPassdowns(filters);
    }
  }, [quickFilter]);

  // Filter passdowns based on search
  const filteredPassdowns = useMemo(() => {
    if (!searchTerm) return passdowns;
    
    const term = searchTerm.toLowerCase();
    return passdowns.filter(p => 
      p.title.toLowerCase().includes(term) ||
      p.summary?.toLowerCase().includes(term) ||
      p.createdByName.toLowerCase().includes(term) ||
      p.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }, [passdowns, searchTerm]);

  // Handle filter changes
  const handleFilterChange = (key: keyof PassdownFilters, value: any) => {
    setFilters({ [key]: value });
  };

  // Render loading state
  if (loading && passdowns.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={clearError}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  // Render list item
  const renderListItem = (passdown: PassdownSummary) => (
    <Card
      key={passdown.id}
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelectPassdown?.(passdown)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{passdown.title}</h3>
              {passdown.acknowledgmentRequired && (
                <Bell className="w-4 h-4 text-orange-500" />
              )}
            </div>
            
            {passdown.summary && (
              <p className="text-sm text-gray-600 line-clamp-2">{passdown.summary}</p>
            )}

            <div className="flex flex-wrap gap-2 text-sm">
              <Badge className={urgencyConfig[passdown.urgencyLevel].color}>
                {urgencyConfig[passdown.urgencyLevel].icon}
                {passdown.urgencyLevel}
              </Badge>
              
              <Badge className={statusConfig[passdown.status].color}>
                {statusConfig[passdown.status].label}
              </Badge>

              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {passdown.shiftDate}
              </Badge>

              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {shiftTypeLabels[passdown.toShift]}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {passdown.createdByName}
                </span>
                {passdown.locationName && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {passdown.locationName}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {passdown.readCount}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {passdown.acknowledgmentCount}
                </span>
              </div>
            </div>

            {passdown.tags && passdown.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {passdown.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Render grid item
  const renderGridItem = (passdown: PassdownSummary) => (
    <Card
      key={passdown.id}
      className="hover:shadow-md transition-shadow cursor-pointer h-full"
      onClick={() => onSelectPassdown?.(passdown)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-2">{passdown.title}</CardTitle>
          {passdown.acknowledgmentRequired && (
            <Bell className="w-4 h-4 text-orange-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Badge className={urgencyConfig[passdown.urgencyLevel].color}>
            {urgencyConfig[passdown.urgencyLevel].icon}
            {passdown.urgencyLevel}
          </Badge>
          <Badge className={statusConfig[passdown.status].color}>
            {statusConfig[passdown.status].label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {passdown.summary && (
          <p className="text-sm text-gray-600 line-clamp-3">{passdown.summary}</p>
        )}
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{passdown.shiftDate} - {shiftTypeLabels[passdown.toShift]}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-3 h-3" />
            <span>{passdown.createdByName}</span>
          </div>
          
          {passdown.locationName && (
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{passdown.locationName}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {passdown.readCount}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {passdown.acknowledgmentCount}
            </span>
          </div>
          
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(passdown.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Passdowns</h2>
          <p className="text-gray-600">Manage shift communication and handoffs</p>
        </div>
        
        <Button onClick={onCreateNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Passdown
        </Button>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Today's Passdowns</p>
                  <p className="text-2xl font-bold">{stats.todayCount}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Acknowledgment</p>
                  <p className="text-2xl font-bold">{stats.pendingAcknowledgment}</p>
                </div>
                <BellOff className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Critical Items</p>
                  <p className="text-2xl font-bold">{stats.byUrgency.critical}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Attachments</p>
                  <p className="text-2xl font-bold">{stats.attachmentCount}</p>
                </div>
                <Archive className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Quick Filters */}
            <div className="flex gap-2">
              <Button
                variant={quickFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('all')}
              >
                All Passdowns
              </Button>
              <Button
                variant={quickFilter === 'current' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('current')}
              >
                Current Shift
              </Button>
              <Button
                variant={quickFilter === 'urgent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('urgent')}
              >
                Urgent Only
              </Button>
            </div>

            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search passdowns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Advanced Filters */}
            <div className="flex gap-2">
              <Select
                value={filters.urgencyLevel || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('urgencyLevel', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Urgency</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('status', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.urgencyLevel || filters.status || filters.toShift || showArchived) && (
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filters.urgencyLevel && (
                <Badge variant="secondary">
                  Urgency: {filters.urgencyLevel}
                  <button
                    onClick={() => handleFilterChange('urgencyLevel', undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.status && (
                <Badge variant="secondary">
                  Status: {filters.status}
                  <button
                    onClick={() => handleFilterChange('status', undefined)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {showArchived && (
                <Badge variant="secondary">
                  Show Archived
                  <button
                    onClick={() => setShowArchived(false)}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passdowns List/Grid */}
      {filteredPassdowns.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No passdowns found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? "Try adjusting your search term"
                : "No passdowns match your current filters"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={onCreateNew}>
                Create New Passdown
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          )}>
            {filteredPassdowns.map(passdown => 
              viewMode === 'list' 
                ? renderListItem(passdown)
                : renderGridItem(passdown)
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => fetchPassdowns({ ...filters, page: currentPage - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => fetchPassdowns({ ...filters, page: currentPage + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
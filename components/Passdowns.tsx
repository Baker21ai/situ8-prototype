/**
 * Passdowns Component
 * Main entry point for the Passdowns module
 */

import React, { useState } from 'react';
import { PassdownDashboard } from './PassdownDashboard';
import { PassdownCreateForm } from './PassdownCreateForm';
import { PassdownDetailView } from './PassdownDetailView';
import { PassdownSummary, Passdown } from '../lib/types/passdown';
import { useModuleNavigation } from '../hooks/useModuleNavigation';
import { BreadcrumbNavigation } from './shared/BreadcrumbNavigation';

type ViewMode = 'dashboard' | 'create' | 'detail' | 'edit';

export function Passdowns() {
  // Navigation system integration
  const navigation = useModuleNavigation();
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPassdownId, setSelectedPassdownId] = useState<string | null>(null);

  // Handle navigation between views
  const handleCreateNew = () => {
    setViewMode('create');
  };

  const handleSelectPassdown = (passdown: PassdownSummary) => {
    setSelectedPassdownId(passdown.id);
    setViewMode('detail');
  };

  const handleEditPassdown = (passdown: Passdown) => {
    setSelectedPassdownId(passdown.id);
    setViewMode('edit');
  };

  const handleBackToDashboard = () => {
    setSelectedPassdownId(null);
    setViewMode('dashboard');
  };

  const handleCreateSuccess = (passdownId: string) => {
    setSelectedPassdownId(passdownId);
    setViewMode('detail');
  };

  const handleDeletePassdown = (passdownId: string) => {
    // In real app, this would show a confirmation dialog
    console.log('Delete passdown:', passdownId);
    handleBackToDashboard();
  };

  // Render based on current view mode
  switch (viewMode) {
    case 'create':
      return (
        <div className="container mx-auto px-4 py-6">
          <BreadcrumbNavigation />
          <PassdownCreateForm
            onSuccess={handleCreateSuccess}
            onCancel={handleBackToDashboard}
          />
        </div>
      );

    case 'edit':
      return (
        <div className="container mx-auto px-4 py-6">
          <BreadcrumbNavigation />
          <PassdownCreateForm
            onSuccess={handleCreateSuccess}
            onCancel={handleBackToDashboard}
            // In real app, would pass existing passdown data for editing
            // initialData={existingPassdownData}
          />
        </div>
      );

    case 'detail':
      if (!selectedPassdownId) {
        setViewMode('dashboard');
        return null;
      }
      
      return (
        <div className="container mx-auto px-4 py-6">
          <BreadcrumbNavigation />
          <PassdownDetailView
            passdownId={selectedPassdownId}
            onBack={handleBackToDashboard}
            onEdit={handleEditPassdown}
            onDelete={handleDeletePassdown}
          />
        </div>
      );

    default:
      return (
        <div className="container mx-auto px-4 py-6">
          <BreadcrumbNavigation />
          <PassdownDashboard
            onCreateNew={handleCreateNew}
            onSelectPassdown={handleSelectPassdown}
          />
        </div>
      );
  }
}
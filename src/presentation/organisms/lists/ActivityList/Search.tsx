/**
 * ActivityList.Search - Search input component with error boundary protection
 */

import React from 'react';
import { Input } from '../../../../../components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { SearchErrorWrapper } from '../../../atoms/errors';
import { useActivityListContext } from './ActivityListContext';
import { ActivityListSearchProps } from './types';

export function Search({ 
  placeholder = "Search activities, locations, people...", 
  className = '' 
}: ActivityListSearchProps) {
  const { filters, setFilters } = useActivityListContext();

  const handleFallbackSearch = (query: string) => {
    // Simplified search fallback
    setFilters({ search: query });
  };

  return (
    <SearchErrorWrapper 
      context="Activity List Search"
      onSearchFallback={handleFallbackSearch}
      placeholder={placeholder}
    >
      <div className={`relative flex-1 max-w-xs ${className}`}>
        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
        <Input
          id="activity-search"
          placeholder={placeholder}
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="pl-7 h-8 text-xs"
        />
      </div>
    </SearchErrorWrapper>
  );
}
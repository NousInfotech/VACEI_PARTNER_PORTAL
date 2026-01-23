"use client"

import React from 'react';
import { Search, List, LayoutGrid, Download, ArrowLeft, Filter, ChevronDown, Menu } from 'lucide-react';
import { Button } from '../../../../../ui/Button';
import { Input } from '../../../../../ui/input';
import { cn } from '../../../../../lib/utils';
import { useLibrary } from '../../../../../context/LibraryContext';

export const Toolbar: React.FC = () => {
  const {
    currentFolderId,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortConfig,
    handleSort,
    handleBack,
    filterType,
    setFilterType,
    handleDownload,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  } = useLibrary();

  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const filterOptions = [
    { id: 'all', label: 'All Files' },
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'spreadsheet', label: 'Spreadsheets' },
    { id: 'document', label: 'Word Documents' },
  ];

  return (
    <div className="relative z-20 flex items-center justify-between p-2 md:p-3 border-b border-gray-200 gap-2 bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 md:gap-3 flex-1 min-w-0">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className={cn(
            "h-9 w-9 p-0 border-gray-200 rounded-lg lg:hidden shrink-0 flex items-center justify-center",
            isMobileSidebarOpen && "bg-primary text-white border-primary"
          )}
        >
          <Menu className="w-4 h-4" />
        </button>

        {currentFolderId && (
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleBack}
            className="h-9 w-9 p-0 border-gray-200 rounded-lg shrink-0 flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-light" />
          </Button>
        )}
        <div className="relative flex-1 min-w-0 max-w-md shrink">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 border-gray-200 bg-white/50 md:bg-gray-50/50 rounded-lg focus-visible:ring-primary/20 text-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="relative shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "h-9 border-gray-200 rounded-lg gap-1.5 font-medium transition-all px-2 md:px-3 flex items-center justify-center",
              filterType !== 'all' ? "bg-primary/5 border-primary/20 text-primary" : "text-gray-600 bg-white"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">{filterOptions.find(opt => opt.id === filterType)?.label || 'Filter'}</span>
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform hidden sm:inline", isFilterOpen && "rotate-180")} />
          </Button>

          {isFilterOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsFilterOpen(false)} 
              />
              <div className="absolute top-full right-0 lg:left-0 mt-2 w-48 md:w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in duration-100">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setFilterType(opt.id);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "flex items-center w-full px-3 py-2 text-xs md:text-sm rounded-lg transition-colors text-left",
                      filterType === opt.id 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        <div className="hidden md:flex items-center bg-gray-50/50 p-1 rounded-lg border border-gray-200 shrink-0">
          {(['name', 'type', 'size'] as const).map((field) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={cn(
                "h-7 px-2 rounded-md text-[10px] gap-1 transition-all flex items-center justify-center",
                sortConfig.field === field ? "bg-primary text-light shadow-sm" : "text-gray-500 hover:bg-white",
                field !== 'name' && "border-l border-gray-100"
              )}
            >
              <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
              {sortConfig.field === field && (sortConfig.order === 'asc' ? '↑' : '↓')}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-gray-50/50 p-1 rounded-lg border border-gray-200 gap-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "h-7 px-2 rounded-lg transition-all flex items-center justify-center", 
              viewMode === 'list' ? "bg-primary shadow-sm border-0" : "bg-white/50"
            )}
          >
            <List className={cn("w-4 h-4 transition-colors", viewMode === 'list' ? "text-white" : "text-gray-600")} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "h-7 px-2 rounded-lg transition-all flex items-center justify-center",
              viewMode === 'grid' ? "bg-primary shadow-sm border-0" : "bg-white/50"
            )}
          >
            <LayoutGrid className={cn("w-4 h-4 transition-colors", viewMode === 'grid' ? "text-white" : "text-gray-600")} />
          </button>
        </div>
        
        <Button 
          variant="default" 
          onClick={() => handleDownload()}
          className="h-9 bg-primary hover:bg-primary/90 text-white font-medium border-0 rounded-lg gap-2 shadow-none px-3 md:px-5 flex items-center justify-center shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Download</span>
        </Button>
      </div>
    </div>
  );
};

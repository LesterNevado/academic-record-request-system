import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ToggleGroup, 
  ToggleGroupItem 
} from "@/components/ui/toggle-group";
import { DocumentType, SortOption, getDocumentTypeDisplayName } from '@/utils/requestUtils';
import { format } from 'date-fns';

interface Processor {
  id: string;
  name: string;
}

interface FiltersState {
  searchTerm: string;
  documentType: DocumentType;
  processor: string;
  sortOption: SortOption;
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

interface RequestFiltersProps {
  filters: FiltersState;
  processors: Processor[];
  setSearchTerm: (value: string) => void;
  setSortOption: (value: SortOption) => void;
  setDocumentType: (value: DocumentType) => void;
  setProcessor: (value: string) => void;
  setDateRange: (value: {from: string | null, to: string | null}) => void;
  clearFilters: () => void;
}

export const RequestFilters: React.FC<RequestFiltersProps> = ({
  filters,
  processors,
  setSearchTerm,
  setSortOption,
  setDocumentType,
  setProcessor,
  setDateRange,
  clearFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search requests..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0047AB]"
            value={filters.searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center whitespace-nowrap"
            onClick={() => setShowFilters(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center whitespace-nowrap">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOption("newest")}>
                {filters.sortOption === "newest" && <CheckCircle className="w-4 h-4 mr-2" />}
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("oldest")}>
                {filters.sortOption === "oldest" && <CheckCircle className="w-4 h-4 mr-2" />}
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("name_asc")}>
                {filters.sortOption === "name_asc" && <CheckCircle className="w-4 h-4 mr-2" />}
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("name_desc")}>
                {filters.sortOption === "name_desc" && <CheckCircle className="w-4 h-4 mr-2" />}
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOption("status")}>
                {filters.sortOption === "status" && <CheckCircle className="w-4 h-4 mr-2" />}
                Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {(filters.documentType !== "all" || filters.processor !== "all" || filters.dateRange.from || filters.dateRange.to) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.documentType !== "all" && (
            <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              {getDocumentTypeDisplayName(filters.documentType)}
              <button
                onClick={() => setDocumentType("all")}
                className="ml-2 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {filters.processor !== "all" && (
            <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Processor: {processors.find(p => p.id === filters.processor)?.name}
              <button
                onClick={() => setProcessor("all")}
                className="ml-2 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <div className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
              Date: {filters.dateRange.from ? formatDate(filters.dateRange.from) : 'Any'} - {filters.dateRange.to ? formatDate(filters.dateRange.to) : 'Any'}
              <button
                onClick={() => setDateRange({ from: null, to: null })}
                className="ml-2 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline ml-2"
          >
            Clear all filters
          </button>
        </div>
      )}

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Filter Requests</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <label className="text-base font-semibold">Document Type</label>
              <ToggleGroup 
                type="single"
                variant="outline"
                className="justify-start flex-wrap gap-2"
                value={filters.documentType}
                onValueChange={(value) => {
                  if (value) setDocumentType(value as DocumentType);
                }}
              >
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="certificate">Certificate of Grades (COG)</ToggleGroupItem>
                <ToggleGroupItem value="certification">Certification</ToggleGroupItem>
                <ToggleGroupItem value="soa">Statement of Account (SOA)</ToggleGroupItem>
                <ToggleGroupItem value="registration_form">Registration Form</ToggleGroupItem>
                <ToggleGroupItem value="com">Certificate of Matriculation (COM)</ToggleGroupItem>
                <ToggleGroupItem value="coe">Certificate of Enrollment (COE)</ToggleGroupItem>
                <ToggleGroupItem value="coa">Certificate of No Availed Scholarship (COA)</ToggleGroupItem>
                <ToggleGroupItem value="others">Others</ToggleGroupItem>
              </ToggleGroup>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Processor</label>
              <Select 
                value={filters.processor} 
                onValueChange={setProcessor}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a processor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Processors</SelectItem>
                  {processors.map((proc) => (
                    <SelectItem key={proc.id} value={proc.id}>
                      {proc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <Input
                    type="date"
                    value={filters.dateRange.from || ''}
                    onChange={(e) => {
                      const newFrom = e.target.value || null;
                      setDateRange({
                        from: newFrom,
                        to: filters.dateRange.to
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <Input
                    type="date"
                    value={filters.dateRange.to || ''}
                    onChange={(e) => {
                      const newTo = e.target.value || null;
                      setDateRange({
                        from: filters.dateRange.from,
                        to: newTo
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={clearFilters}
            >
              Reset
            </Button>
            <DialogClose asChild>
              <Button className="bg-[#0047AB] hover:bg-[#00377e]">
                Apply Filters
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

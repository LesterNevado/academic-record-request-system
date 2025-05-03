
import { useState } from "react";
import { DocumentType, Request, SortOption, matchesDocumentTypeFilter, getRequestType } from "@/utils/requestUtils";

interface DateRange {
  from: string | null;
  to: string | null;
}

interface UseRequestFiltersProps {
  requests: Request[];
}

export const useRequestFilters = ({ requests }: UseRequestFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [documentType, setDocumentType] = useState<DocumentType>("all");
  const [processor, setProcessor] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null
  });

  const matchesProcessorFilter = (request: Request): boolean => {
    if (processor === "all") return true;
    return request.processed_by === processor;
  };

  const matchesDateFilter = (request: Request): boolean => {
    if (!dateRange.from && !dateRange.to) return true;
    
    const requestDate = new Date(request.created_at);
    
    if (dateRange.from && !dateRange.to) {
      const fromDate = new Date(dateRange.from);
      return requestDate >= fromDate;
    }
    
    if (!dateRange.from && dateRange.to) {
      const toDate = new Date(dateRange.to);
      return requestDate <= toDate;
    }
    
    const fromDate = new Date(dateRange.from!);
    const toDate = new Date(dateRange.to!);
    return requestDate >= fromDate && requestDate <= toDate;
  };

  const getFilteredAndSortedRequests = () => {
    if (!Array.isArray(requests)) return [];
    
    const filtered = requests.filter(request => {
      // Use the imported getRequestType function instead of trying to call it as a method
      const requestType = getRequestType(request);
        
      const matchesSearch = 
        request.student_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        requestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.student_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch && 
        matchesDocumentTypeFilter(request, documentType) && 
        matchesProcessorFilter(request) &&
        matchesDateFilter(request);
    });
    
    return filtered.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name_asc":
          return a.student_name.localeCompare(b.student_name);
        case "name_desc":
          return b.student_name.localeCompare(a.student_name);
        case "status":
          const statusOrder = { 
            'approved': 1, 
            'awaiting_pickup': 2, 
            'pending': 3, 
            'rejected': 4 
          };
          return (statusOrder[a.status as keyof typeof statusOrder] || 5) - 
                 (statusOrder[b.status as keyof typeof statusOrder] || 5);
        default:
          return 0;
      }
    });
  };

  const clearFilters = () => {
    setDocumentType("all");
    setProcessor("all");
    setDateRange({ from: null, to: null });
    setSortOption("newest");
    setSearchTerm("");
  };

  return {
    filters: {
      searchTerm,
      sortOption,
      documentType,
      processor,
      dateRange
    },
    setSearchTerm,
    setSortOption,
    setDocumentType,
    setProcessor,
    setDateRange,
    clearFilters,
    filteredRequests: getFilteredAndSortedRequests()
  };
};

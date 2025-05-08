import { Tables } from "@/integrations/supabase/types";

export type Request = Tables<"requests"> & {
  transcript_selected?: boolean;
  certificate_selected?: boolean;
  certification_selected?: boolean;
  others_selected?: boolean;
  soa_selected?: boolean;
  registration_form_selected?: boolean;
  com_selected?: boolean;
  coe_selected?: boolean;
  coa_selected?: boolean;
  processor_name?: string | null;
};

export type DocumentType = 
  "all" | "transcript" | "certificate" | "certification" | "soa" | "others" | 
  "registration_form" | "com" | "coe" | "coa";

export type SortOption = "newest" | "oldest" | "name_asc" | "name_desc" | "status";

/**
 * Gets a formatted string of all document types selected in a request
 */
export const getRequestType = (request: Request): string => {
  const types = [];
  if (request.certificate_selected) types.push("Certificate of Grades (COG)");
  if (request.certification_selected) types.push("Certification");
  if (request.soa_selected) types.push("Statement of Account (SOA)");
  if (request.registration_form_selected) types.push("Registration Form");
  if (request.com_selected) types.push("Certificate of Matriculation (COM)");
  if (request.coe_selected) types.push("Certificate of Enrollment (COE)");
  if (request.coa_selected) types.push("Certificate of No Availed Scholarship (COA)");
  if (request.others_selected) types.push("Others");
  return types.join(", ");
};

/**
 * Checks if a request matches a specific document type filter
 */
export const matchesDocumentTypeFilter = (request: Request, documentType: DocumentType): boolean => {
  if (documentType === "all") return true;
  
  switch (documentType) {
    case "transcript": return Boolean(request.transcript_selected);
    case "certificate": return Boolean(request.certificate_selected);
    case "certification": return Boolean(request.certification_selected);
    case "soa": return Boolean(request.soa_selected);
    case "registration_form": return Boolean(request.registration_form_selected);
    case "com": return Boolean(request.com_selected);
    case "coe": return Boolean(request.coe_selected);
    case "coa": return Boolean(request.coa_selected);
    case "others": return Boolean(request.others_selected);
    default: return true;
  }
};

/**
 * Get the display name for a document type
 */
export const getDocumentTypeDisplayName = (documentType: DocumentType): string => {
  switch (documentType) {
    case "all": return "All";
    case "certificate": return "Certificate of Grades (COG)";
    case "certification": return "Certification";
    case "soa": return "Statement of Account (SOA)";
    case "registration_form": return "Registration Form";
    case "com": return "Certificate of Matriculation (COM)";
    case "coe": return "Certificate of Enrollment (COE)";
    case "coa": return "Certificate of No Availed Scholarship (COA)";
    case "others": return "Others";
    default: return "Unknown";
  }
};

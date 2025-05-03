
import React from 'react';
import { CheckCircle2, XCircle } from "lucide-react";

interface CTCIndicatorProps {
  hasCTC: boolean;
}

export const CTCIndicator: React.FC<CTCIndicatorProps> = ({ hasCTC }) => (
  hasCTC ? 
    <div className="flex items-center justify-center">
      <CheckCircle2 className="w-5 h-5 text-green-600 mr-1" />
      <span className="text-green-600 font-medium">Yes</span>
    </div> : 
    <div className="flex items-center justify-center">
      <XCircle className="w-5 h-5 text-red-500 mr-1" />
      <span className="text-red-500">No</span>
    </div>
);

export default CTCIndicator;

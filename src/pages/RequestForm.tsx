import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SessionContext } from "../App";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentButton } from "@/components/payment/PaymentButton";
import { Sidebar } from "@/components/layout/Sidebar";

interface RequestType {
  selected: boolean;
  copies: number;
  price: number;
  ctc: boolean;
  details: string;
}

type RequestTypes = {
  certificate: RequestType;
  registrationForm: RequestType;
  com: RequestType; 
  coa: RequestType;
  coe: RequestType;
  soa: RequestType;
  certification: RequestType;
  others: RequestType;
};

const RequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { session, userRoles: contextRoles } = useContext(SessionContext);
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  }>({
    name: null,
    email: null,
    avatarUrl: null
  });

  const [userRoles, setUserRoles] = useState<string[]>(contextRoles || []);

  const [formData, setFormData] = useState({
    studentName: "",
    studentNumber: "",
    contactNumber: "",
    homeAddress: "",
    purpose: "",
    requestTypes: {
      certificate: { selected: false, copies: 1, price: 100, ctc: false, details: "" },
      registrationForm: { selected: false, copies: 1, price: 120, ctc: false, details: "" },
      com: { selected: false, copies: 1, price: 120, ctc: false, details: "" },
      coa: { selected: false, copies: 1, price: 120, ctc: false, details: "" },
      coe: { selected: false, copies: 1, price: 120, ctc: false, details: "" },
      soa: { selected: false, copies: 1, price: 150, ctc: false, details: "" },
      certification: { selected: false, copies: 1, price: 100, ctc: false, details: "" },
      others: { selected: false, copies: 1, price: 100, ctc: false, details: "" }
    } as RequestTypes
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    certificationDetails: false,
    othersDetails: false
  });
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const updateUserProfile = async () => {
      if (!session) {
        navigate('/');
        return;
      }

      const { user } = session;
      const name = user.user_metadata.name || user.user_metadata.full_name;
      const email = user.email;
      const avatarUrl = user.user_metadata.avatar_url;

      setUserProfile({
        name,
        email,
        avatarUrl
      });
      
      if (name) {
        setFormData(prev => ({
          ...prev,
          studentName: name
        }));
      }
      
      if (!contextRoles || contextRoles.length === 0) {
        const { data: roles, error: rolesError } = await supabase.rpc(
          'get_user_roles',
          { user_id: user.id }
        );
        
        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
          toast.error(`Error fetching roles: ${rolesError.message}`);
        } else {
          console.log("User roles:", roles);
          setUserRoles(roles || []);
          
          if (roles && (roles.includes('faculty') || roles.includes('admin'))) {
            toast.error('Faculty and Admin users cannot create requests');
            navigate('/dashboard');
          }
        }
      } else {
        if (contextRoles.includes('faculty') || contextRoles.includes('admin')) {
          toast.error('Faculty and Admin users cannot create requests');
          navigate('/dashboard');
        }
      }
    };

    updateUserProfile();
  }, [session, navigate, contextRoles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStudentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d-]/g, '');
    
    let formattedValue = value;
    if (value.length > 0) {
      formattedValue = value.replace(/-/g, '');
      
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.substring(0, 2) + '-' + formattedValue.substring(2);
      }
      
      if (formattedValue.length > 8) {
        formattedValue = formattedValue.substring(0, 8) + '-' + formattedValue.substring(8);
      }
      
      formattedValue = formattedValue.substring(0, 12);
    }
    
    setFormData({
      ...formData,
      studentNumber: formattedValue
    });
  };

  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const limitedValue = value.substring(0, 11);
    
    setFormData({
      ...formData,
      contactNumber: limitedValue
    });
  };

  const handleCheckboxChange = (type: keyof RequestTypes) => {
    if (type === 'certification' && formData.requestTypes.certification.selected) {
      setFormErrors(prev => ({ ...prev, certificationDetails: false }));
    } else if (type === 'others' && formData.requestTypes.others.selected) {
      setFormErrors(prev => ({ ...prev, othersDetails: false }));
    }

    setFormData({
      ...formData,
      requestTypes: {
        ...formData.requestTypes,
        [type]: {
          ...formData.requestTypes[type],
          selected: !formData.requestTypes[type].selected
        }
      }
    });
  };

  const handleCopiesChange = (type: keyof RequestTypes, value: number) => {
    setFormData({
      ...formData,
      requestTypes: {
        ...formData.requestTypes,
        [type]: {
          ...formData.requestTypes[type],
          copies: Math.max(1, value)
        }
      }
    });
  };

  const handleDetailsChange = (type: keyof RequestTypes, value: string) => {
    if (type === 'certification') {
      setFormErrors(prev => ({ ...prev, certificationDetails: false }));
    } else if (type === 'others') {
      setFormErrors(prev => ({ ...prev, othersDetails: false }));
    }

    setFormData({
      ...formData,
      requestTypes: {
        ...formData.requestTypes,
        [type]: {
          ...formData.requestTypes[type],
          details: value
        }
      }
    });
  };

  const handleCtcDrySealChange = (type: keyof RequestTypes) => {
    setFormData({
      ...formData,
      requestTypes: {
        ...formData.requestTypes,
        [type]: {
          ...formData.requestTypes[type],
          ctc: !formData.requestTypes[type].ctc
        }
      }
    });
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      certificationDetails: false,
      othersDetails: false
    };

    if (formData.requestTypes.certification.selected && !formData.requestTypes.certification.details?.trim()) {
      newErrors.certificationDetails = true;
      isValid = false;
    }

    if (formData.requestTypes.others.selected && !formData.requestTypes.others.details?.trim()) {
      newErrors.othersDetails = true;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const calculateSubtotal = () => {
    let subtotal = 0;
    for (const key in formData.requestTypes) {
      const req = formData.requestTypes[key as keyof typeof formData.requestTypes];
      if (req.selected) {
        subtotal += (req.copies || 0) * (req.price || 0);
        if (req.ctc) {
          subtotal += (req.copies || 0) * 50; // ₱50 per copy for CTC/Dry Seal
        }
      }
    }
    return subtotal;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (!session) {
        toast.error("You must be logged in to submit a request");
        return;
      }
      
      setShowPayment(true);
      
    } catch (error: any) {
      console.error("Error preparing request:", error);
      toast.error(`Failed to prepare request: ${error.message || "Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const requiredFieldStyle = "text-[#ea384c]";

  const requestTypeConfig = {
    certificate: { price: 100, name: "Certificate of Grades (COG)", requiredDetails: false },
    registrationForm: { price: 120, name: "Registration Form", requiredDetails: true },
    com: { price: 120, name: "Certificate of Matriculation (COM)", requiredDetails: false },
    coa: { price: 120, name: "Certificate of No Availed Scholarship", requiredDetails: false },
    coe: { price: 120, name: "Certificate of Enrollment (COE)", requiredDetails: false },
    soa: { price: 150, name: "Statement of Account (SOA)", requiredDetails: false },
    certification: { price: 100, name: "Certification", requiredDetails: true },
    others: { price: 100, name: "Others", requiredDetails: true },
  };

  const requestTypes = Object.entries(requestTypeConfig).map(([key, value]) => ({
    key,
    ...value,
    selected: false,
    copies: 1,
    ctc: false,
    details: ""
  }));

  // Universal button style for all four action buttons
  const universalButtonStyle = "w-full sm:w-auto flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base text-lg font-bold shadow-xl transition-all";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-10 pt-8">
      {/* Header Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mb-8">
        <div className="flex items-center gap-4 mb-2 -ml-4">
          <div className="w-1.5 h-10 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Request Record Form</h1>
            <p className="mt-1 text-lg text-slate-500 font-medium">Fill out the form below to request your academic records</p>
          </div>
        </div>
        <div className="border-b border-blue-100 shadow-sm" />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
        <div className="backdrop-blur-lg bg-white/70 rounded-2xl shadow-2xl border border-blue-100 p-10">
          {showPayment ? (
            <div className="bg-gradient-to-br from-blue-50 via-white to-blue-100 rounded-lg shadow p-8 border border-blue-100 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-blue-400 rounded-full" />
                <h2 className="text-2xl font-extrabold text-gray-900">Complete Your Payment</h2>
              </div>
              <p className="mb-8 text-slate-600 text-lg">Please complete the payment to process your request.</p>
              <div className="p-6 bg-blue-50 rounded-xl mb-8 border border-blue-100 shadow flex flex-col gap-2">
                <h3 className="font-semibold text-blue-900 mb-2">Request Summary:</h3>
                <ul className="space-y-2">
                  {Object.entries(formData.requestTypes).map(([key, value]) => (
                    value.selected && (
                      <li key={key} className="flex items-center gap-2 text-base text-blue-900">
                        {key === "certificate" && "Certificate of Grades (COG)"}
                        {key === "registrationForm" && "Registration Form"}
                        {key === "com" && "Certificate of Matriculation (COM)"}
                        {key === "coe" && "Certificate of Enrollment (COE)"}
                        {key === "coa" && "Certificate of No Availed Scholarship"}
                        {key === "soa" && "Statement of Account (SOA)"}
                        {key === "certification" && `Certification (${value.details ?? ""})`}
                        {key === "others" && `Others (${value.details ?? ""})`}
                        : <span className="bg-blue-600 text-white font-bold rounded-full px-3 py-1 ml-2">{value.copies}</span> {value.copies > 1 ? 'copies' : 'copy'}
                      </li>
                    )
                  ))}
                </ul>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <span className="font-bold text-blue-900 text-lg">Total:</span>
                  <span className="bg-blue-600 text-white rounded-full px-6 py-2 font-mono font-bold text-lg shadow border border-blue-700">₱{calculateSubtotal().toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t border-blue-100 my-8" />
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  className={`${universalButtonStyle} border-2 border-blue-400 text-blue-700 bg-white hover:bg-blue-50 focus:ring-2 focus:ring-blue-200`}
                >
                  <ArrowLeft className="w-5 h-5" /> Back
                </button>
                <PaymentButton 
                  requestFormData={formData}
                  className={`${universalButtonStyle} bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white focus:ring-2 focus:ring-blue-200`}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Personal Info Section */}
              <div className="bg-blue-50/30 rounded-xl p-6 mb-8 shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-900 text-lg">Personal Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name <span className={requiredFieldStyle}>*</span></Label>
                    <Input
                      id="studentName"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      required
                      className="rounded-full px-5 py-3 text-base border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentNumber">Student Number <span className={requiredFieldStyle}>*</span> (Format: XX-XXXXX-XXX)</Label>
                    <Input
                      id="studentNumber"
                      name="studentNumber"
                      value={formData.studentNumber}
                      onChange={handleStudentNumberChange}
                      placeholder="XX-XXXXX-XXX"
                      required
                      className="rounded-full px-5 py-3 text-base border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number <span className={requiredFieldStyle}>*</span> (11 digits only)</Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleContactNumberChange}
                      placeholder="e.g., 09123456789"
                      maxLength={11}
                      required
                      className="rounded-full px-5 py-3 text-base border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="homeAddress">Home Address</Label>
                    <Input
                      id="homeAddress"
                      name="homeAddress"
                      value={formData.homeAddress}
                      onChange={handleInputChange}
                      className="rounded-full px-5 py-3 text-base border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="border-b border-blue-100 my-8" />
              {/* Document Selection Section */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <Label className="text-lg font-semibold">
                    APPLICATION FOR: <span className={requiredFieldStyle}>*</span>
                  </Label>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-12 gap-4 font-semibold text-sm rounded-t-xl h-12 items-center">
                    <div className="col-span-6 flex items-center h-full">Document Type</div>
                    <div className="col-span-1 flex items-center justify-center text-center whitespace-nowrap h-full pl-2">CTC/Dry Seal</div>
                    <div className="col-span-2 flex items-center justify-center text-center h-full pl-2">No. of Copies</div>
                    <div className="col-span-2 flex items-center justify-center text-center h-full pl-2">Details</div>
                    <div className="col-span-1 flex items-center justify-center text-center h-full">Price</div>
                  </div>
                  {Object.entries(formData.requestTypes).map(([key, value]) => {
                    let label = "";
                    let showDetailsInput = false;
                    switch(key){
                      case "certificate": label = "Certificate of Grades (COG)"; break;
                      case "registrationForm": label = "Registration Form"; break;
                      case "com": label = "Certificate of Matriculation (COM)"; break;
                      case "coe": label = "Certificate of Enrollment (COE)"; break;
                      case "coa": label = "Certificate of No Availed Scholarship"; break;
                      case "soa": label = "Statement of Account (SOA)"; break;
                      case "certification": label = "Certification"; showDetailsInput = true; break;
                      case "others": label = "Others"; showDetailsInput = true; break;
                      default: label = key; break;
                    }
                    const isSelected = value.selected;
                    const ctcFee = value.ctc ? 50 * value.copies : 0;
                    const totalPrice = (value.price * value.copies) + ctcFee;
                    return (
                      <div
                        key={key}
                        className={`grid grid-cols-12 gap-4 items-center rounded-xl p-4 pr-8 mb-4 border transition-all overflow-x-hidden
                          ${isSelected ? 'border-blue-400 bg-blue-50/60 shadow-lg' : 'border-blue-100 bg-white hover:bg-blue-50/40 shadow-sm'}`}
                      >
                        <div className="col-span-6 flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={value.selected}
                            onCheckedChange={() => handleCheckboxChange(key as keyof RequestTypes)}
                            className="scale-125 accent-blue-500 focus:ring-2 focus:ring-blue-400 text-blue-600 border-blue-400 checked:border-blue-600 checked:bg-blue-500"
                          />
                          <Label htmlFor={key} className="font-medium text-base">
                            {label}
                          </Label>
                        </div>
                        <div className="col-span-1 flex justify-center items-center pl-2">
                          <Checkbox
                            id={`${key}-ctc`}
                            checked={value.ctc}
                            onCheckedChange={() => handleCtcDrySealChange(key as keyof RequestTypes)}
                            className="scale-110 accent-blue-500 focus:ring-2 focus:ring-blue-400 text-blue-600 border-blue-400 checked:border-blue-600 checked:bg-blue-500"
                            disabled={!value.selected}
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-center text-center pl-2">
                          <Input
                            id={`${key}Copies`}
                            type="number"
                            min={1}
                            value={value.copies}
                            onChange={e => handleCopiesChange(key as keyof RequestTypes, parseInt(e.target.value) || 1)}
                            className="text-center rounded-full px-3 py-2 border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                            disabled={!value.selected}
                          />
                        </div>
                        <div className="col-span-2 flex flex-col items-center justify-center text-center pl-2">
                          {showDetailsInput && (
                            <>
                              <div className="w-full flex items-center gap-1">
                                <Input
                                  className={`mt-1 rounded-full px-3 py-2 border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all ${(key === "certification" && formErrors.certificationDetails) || (key === "others" && formErrors.othersDetails) ? 'border-[#ea384c] focus-visible:ring-[#ea384c]' : ''}`}
                                  value={value.details}
                                  onChange={e => handleDetailsChange(key as keyof RequestTypes, e.target.value)}
                                  placeholder="Please specify"
                                  required={value.selected}
                                  disabled={!value.selected}
                                />
                                <span className="text-[#ea384c] text-lg">*</span>
                              </div>
                              {/* Error message */}
                              {((formErrors.certificationDetails && key === "certification") ||
                                (formErrors.othersDetails && key === "others")) && (
                                <span className="text-xs text-[#ea384c] mt-1">This field is required.</span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="col-span-1 flex flex-col items-center justify-center text-center h-full">
                          <span className="bg-blue-100 text-blue-900 rounded-full px-4 py-1 font-mono font-semibold">
                            ₱{totalPrice.toFixed(2)}
                          </span>
                          {value.ctc && (
                            <span className="text-xs text-blue-500 mt-1 whitespace-nowrap">(incl. CTC/Dry Seal)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end mt-4">
                    <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-full px-8 py-3 shadow-lg font-bold text-xl border border-blue-200">
                      Total: ₱{calculateSubtotal().toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-b border-blue-100 my-8" />
              {/* Purpose Section */}
              <div className="bg-blue-50/30 rounded-xl p-6 mb-8 shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-900 text-lg">Purpose <span className="text-[#ea384c]">*</span></span>
                </div>
                <Textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="rounded-2xl border-blue-100 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="border-b border-blue-100 my-8" />
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className={`${universalButtonStyle} border-blue-200 hover:bg-blue-50 text-blue-700`}
                >
                  <ArrowLeft className="w-5 h-5" /> Cancel
                </Button>
                <Button
                  type="submit"
                  className={`${universalButtonStyle} bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white`}
                  disabled={submitting}
                >
                  {submitting ? "Processing..." : <><CheckCircle className="w-5 h-5" /> Submit Request</>}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestForm;

import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        userProfile={userProfile}
        userRoles={userRoles}
        loading={loading}
      />
      <div className="flex-1 p-10 overflow-y-auto">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        {showPayment ? (
          <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">Complete Your Payment</h2>
            <p className="mb-6">Please complete the payment to process your request.</p>
            <div className="p-4 bg-gray-50 rounded-lg mb-6">
              <h3 className="font-medium mb-3">Request Summary:</h3>
              <ul className="space-y-2">
                {Object.entries(formData.requestTypes).map(([key, value]) => (
                  value.selected && (
                    <li key={key}>
                      {key === "certificate" && "Certificate of Grades (COG)"}
                      {key === "registrationForm" && "Registration Form"}
                      {key === "com" && "Certificate of Matriculation (COM)"}
                      {key === "coe" && "Certificate of Enrollment (COE)"}
                      {key === "coa" && "Certificate of No Availed Scholarship"}
                      {key === "soa" && "Statement of Account (SOA)"}
                      {key === "certification" && `Certification (${value.details ?? ""})`}
                      {key === "others" && `Others (${value.details ?? ""})`}
                      : {value.copies} {value.copies > 1 ? 'copies' : 'copy'}
                    </li>
                  )
                ))}
              </ul>
            </div>
            <div className="flex justify-end">
              <PaymentButton 
                requestFormData={formData}
                className="bg-[#0047AB] hover:bg-[#00377e] text-white"
              />
            </div>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-bold">Request Record Form</h1>
              <p className="text-gray-600 mt-2">Fill out the form below to request your academic records</p>
            </header>
            <div className="bg-white rounded-lg shadow p-8 border border-gray-200">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name <span className={requiredFieldStyle}>*</span></Label>
                    <Input
                      id="studentName"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      required
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
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="homeAddress">Home Address</Label>
                    <Input
                      id="homeAddress"
                      name="homeAddress"
                      value={formData.homeAddress}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-lg font-semibold">
                      APPLICATION FOR: <span className={requiredFieldStyle}>*</span>
                    </Label>
                    <div className="mt-4 space-y-4">
                      <div className="grid grid-cols-12 gap-4 font-semibold text-sm">
                        <div className="col-span-6">Document Type</div>
                        <div className="col-span-1 text-center">CTC/Dry Seal</div>
                        <div className="col-span-2 text-center">No. of Copies</div>
                        <div className="col-span-2">Details</div>
                        <div className="col-span-1 text-right">Price</div>
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

                        return (
                          <div key={key} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-6 flex items-center space-x-2">
                              <Checkbox
                                id={key}
                                checked={value.selected}
                                onCheckedChange={() => handleCheckboxChange(key as keyof RequestTypes)}
                              />
                              <Label htmlFor={key} className="font-normal">
                                {label}
                              </Label>
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <Checkbox
                                id={`${key}-ctc`}
                                checked={value.ctc}
                                onCheckedChange={() => handleCtcDrySealChange(key as keyof RequestTypes)}
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor={`${key}Copies`} className="text-sm block mb-1 text-center">No. of Copies</Label>
                              <Input
                                id={`${key}Copies`}
                                type="number"
                                min={1}
                                value={value.copies}
                                onChange={e => handleCopiesChange(key as keyof RequestTypes, parseInt(e.target.value) || 1)}
                                className="text-center"
                                disabled={!value.selected}
                              />
                            </div>
                            <div className="col-span-2 flex flex-col">
                              {showDetailsInput && (
                                <Input
                                  className={`mt-1 ${(key === "certification" && formErrors.certificationDetails) || (key === "others" && formErrors.othersDetails) ? 'border-[#ea384c] focus-visible:ring-[#ea384c]' : ''}`}
                                  value={value.details}
                                  onChange={e => handleDetailsChange(key as keyof RequestTypes, e.target.value)}
                                  placeholder="Please specify"
                                  required={value.selected}
                                  disabled={!value.selected}
                                />
                              )}
                            </div>
                            <div className="col-span-1 text-right font-mono">
                              ₱{(value.price * value.copies).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-end mt-4 font-semibold text-lg">
                        Total: ₱{calculateSubtotal().toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="purpose">Purpose <span className={requiredFieldStyle}>*</span></Label>
                    <Textarea
                      id="purpose"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      required
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#0047AB] hover:bg-[#00377e]"
                    disabled={submitting}
                  >
                    {submitting ? "Processing..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestForm;

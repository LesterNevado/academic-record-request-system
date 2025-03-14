
import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  LogOut,
  ArrowLeft 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SessionContext } from "../App";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import { TablesInsert } from "@/integrations/supabase/types";

const RequestForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useContext(SessionContext);
  const [userProfile, setUserProfile] = useState<{
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  }>({
    name: null,
    email: null,
    avatarUrl: null
  });
  
  const [formData, setFormData] = useState({
    studentName: "",
    studentNumber: "",
    contactNumber: "",
    homeAddress: "",
    purpose: "",
    requestTypes: {
      transcript: { selected: false, copies: 1 },
      certificate: { selected: false, copies: 1 },
      certification: { selected: false, copies: 1, details: "" },
      others: { selected: false, copies: 1, details: "" }
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    certificationDetails: false,
    othersDetails: false
  });

  useEffect(() => {
    const updateUserProfile = () => {
      if (!session) {
        navigate('/');
        return;
      }

      // Get user metadata from session
      const { user } = session;
      const name = user.user_metadata.name || user.user_metadata.full_name;
      const email = user.email;
      const avatarUrl = user.user_metadata.avatar_url;

      // Set user profile and pre-fill name if available
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
    };

    updateUserProfile();
  }, [session, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle student number input with format XX-XXXXX-XXX
  const handleStudentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d-]/g, '');
    
    // Format as XX-XXXXX-XXX
    let formattedValue = value;
    if (value.length > 0) {
      formattedValue = value.replace(/-/g, ''); // Remove existing hyphens
      
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.substring(0, 2) + '-' + formattedValue.substring(2);
      }
      
      if (formattedValue.length > 8) {
        formattedValue = formattedValue.substring(0, 8) + '-' + formattedValue.substring(8);
      }
      
      // Limit to format length (10 digits + 2 hyphens = 12 characters)
      formattedValue = formattedValue.substring(0, 12);
    }
    
    setFormData({
      ...formData,
      studentNumber: formattedValue
    });
  };

  // Handle contact number input - only allow numbers and limit to 11 digits
  const handleContactNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
    const limitedValue = value.substring(0, 11); // Limit to 11 digits
    
    setFormData({
      ...formData,
      contactNumber: limitedValue
    });
  };

  const handleCheckboxChange = (type: string) => {
    // Reset detail field errors when unchecking checkboxes
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
          ...formData.requestTypes[type as keyof typeof formData.requestTypes],
          selected: !formData.requestTypes[type as keyof typeof formData.requestTypes].selected
        }
      }
    });
  };

  const handleCopiesChange = (type: string, value: number) => {
    setFormData({
      ...formData,
      requestTypes: {
        ...formData.requestTypes,
        [type]: {
          ...formData.requestTypes[type as keyof typeof formData.requestTypes],
          copies: Math.max(1, value) // Ensure at least 1 copy
        }
      }
    });
  };

  const handleDetailsChange = (type: string, value: string) => {
    // Clear error when user types in details
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
          ...formData.requestTypes[type as keyof typeof formData.requestTypes],
          details: value
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

    // Check if certification is selected but details are empty
    if (formData.requestTypes.certification.selected && !formData.requestTypes.certification.details.trim()) {
      newErrors.certificationDetails = true;
      isValid = false;
    }

    // Check if others is selected but details are empty
    if (formData.requestTypes.others.selected && !formData.requestTypes.others.details.trim()) {
      newErrors.othersDetails = true;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
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
      
      // Prepare request data for submission to Supabase
      const requestData: TablesInsert<"requests"> = {
        user_id: session.user.id,
        student_name: formData.studentName,
        student_number: formData.studentNumber,
        contact_number: formData.contactNumber,
        home_address: formData.homeAddress,
        purpose: formData.purpose,
        
        transcript_selected: formData.requestTypes.transcript.selected,
        transcript_copies: formData.requestTypes.transcript.selected ? formData.requestTypes.transcript.copies : null,
        
        certificate_selected: formData.requestTypes.certificate.selected,
        certificate_copies: formData.requestTypes.certificate.selected ? formData.requestTypes.certificate.copies : null,
        
        certification_selected: formData.requestTypes.certification.selected,
        certification_copies: formData.requestTypes.certification.selected ? formData.requestTypes.certification.copies : null,
        certification_details: formData.requestTypes.certification.selected ? formData.requestTypes.certification.details : null,
        
        others_selected: formData.requestTypes.others.selected,
        others_copies: formData.requestTypes.others.selected ? formData.requestTypes.others.copies : null,
        others_details: formData.requestTypes.others.selected ? formData.requestTypes.others.details : null,
        
        status: 'pending'
      };
      
      console.log("Submitting request data:", requestData);
      
      // Submit to Supabase
      const { error, data } = await supabase
        .from('requests')
        .insert(requestData)
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Request submitted successfully:", data);
      
      // Invalidate requests query to refresh data
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      
      toast.success("Request submitted successfully!");
      navigate("/requests");
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(`Failed to submit request: ${error.message || "Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(`Logout failed: ${error.message}`);
      } else {
        toast.success("Successfully logged out");
        navigate("/");
      }
    } catch (err) {
      console.error("Unexpected error during logout:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // CSS for required field marker
  const requiredFieldStyle = "text-[#ea384c]";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#0047AB] text-white p-6 flex flex-col">
        <div className="flex items-center mb-10">
          <img
            src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73?placeholderIfAbsent=true"
            alt="NEU Logo"
            className="w-12 h-12 mr-3"
          />
          <h1 className="text-xl font-bold">NEU ARRS</h1>
        </div>
        
        {/* User Profile Section */}
        <div className="mb-6 flex flex-col items-center">
          {userProfile.avatarUrl ? (
            <img 
              src={userProfile.avatarUrl} 
              alt="Profile" 
              className="w-16 h-16 rounded-full mb-2 border-2 border-white"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <User className="w-8 h-8" />
            </div>
          )}
          <p className="text-sm font-semibold text-center">{userProfile.name || "User"}</p>
          <p className="text-xs text-white/70 text-center">{userProfile.email}</p>
        </div>
        
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <Link to="/dashboard" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/requests" className="flex items-center p-2 rounded-lg hover:bg-white/20 transition-colors">
                <FileText className="w-5 h-5 mr-3" />
                Requests
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto">
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full flex items-center justify-center text-white bg-[#0047AB] border-2 border-white hover:bg-[#003d91]"
            disabled={loading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-10">
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
                <Label className="text-lg font-semibold">APPLICATION FOR: <span className={requiredFieldStyle}>*</span></Label>
                
                {/* Reorganized layout for application types */}
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8 flex items-center space-x-2">
                      <Checkbox 
                        id="transcript" 
                        checked={formData.requestTypes.transcript.selected}
                        onCheckedChange={() => handleCheckboxChange('transcript')}
                      />
                      <Label htmlFor="transcript" className="font-normal">Transcript of Records (TOR)</Label>
                    </div>
                    
                    <div className="col-span-4">
                      <Label htmlFor="transcriptCopies" className="text-sm block mb-1 text-center">No. of Copies</Label>
                      <Input
                        id="transcriptCopies"
                        type="number"
                        min="1"
                        value={formData.requestTypes.transcript.copies}
                        onChange={(e) => handleCopiesChange('transcript', parseInt(e.target.value) || 1)}
                        className="text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8 flex items-center space-x-2">
                      <Checkbox 
                        id="certificate" 
                        checked={formData.requestTypes.certificate.selected}
                        onCheckedChange={() => handleCheckboxChange('certificate')}
                      />
                      <Label htmlFor="certificate" className="font-normal">Certificate of Grades (COG)</Label>
                    </div>
                    
                    <div className="col-span-4">
                      <Label htmlFor="certificateCopies" className="text-sm block mb-1 text-center">No. of Copies</Label>
                      <Input
                        id="certificateCopies"
                        type="number"
                        min="1"
                        value={formData.requestTypes.certificate.copies}
                        onChange={(e) => handleCopiesChange('certificate', parseInt(e.target.value) || 1)}
                        className="text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8 flex items-start space-x-2">
                      <Checkbox 
                        id="certification" 
                        checked={formData.requestTypes.certification.selected}
                        onCheckedChange={() => handleCheckboxChange('certification')}
                        className="mt-2"
                      />
                      <div className="flex-1">
                        <Label htmlFor="certification" className="font-normal">Certification</Label>
                        <Input
                          className={`mt-2 ${formErrors.certificationDetails ? 'border-[#ea384c] focus-visible:ring-[#ea384c]' : ''}`}
                          value={formData.requestTypes.certification.details}
                          onChange={(e) => handleDetailsChange('certification', e.target.value)}
                          placeholder="Please specify"
                          required={formData.requestTypes.certification.selected}
                        />
                        {formErrors.certificationDetails && (
                          <p className="text-[#ea384c] text-xs mt-1">This field is required when Certification is selected</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-4">
                      <Label htmlFor="certificationCopies" className="text-sm block mb-1 text-center">No. of Copies</Label>
                      <Input
                        id="certificationCopies"
                        type="number"
                        min="1"
                        value={formData.requestTypes.certification.copies}
                        onChange={(e) => handleCopiesChange('certification', parseInt(e.target.value) || 1)}
                        className="text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8 flex items-start space-x-2">
                      <Checkbox 
                        id="others" 
                        checked={formData.requestTypes.others.selected}
                        onCheckedChange={() => handleCheckboxChange('others')}
                        className="mt-2"
                      />
                      <div className="flex-1">
                        <Label htmlFor="others" className="font-normal">Others (Please Specify)</Label>
                        <Input
                          className={`mt-2 ${formErrors.othersDetails ? 'border-[#ea384c] focus-visible:ring-[#ea384c]' : ''}`}
                          value={formData.requestTypes.others.details}
                          onChange={(e) => handleDetailsChange('others', e.target.value)}
                          placeholder="Please specify"
                          required={formData.requestTypes.others.selected}
                        />
                        {formErrors.othersDetails && (
                          <p className="text-[#ea384c] text-xs mt-1">This field is required when Others is selected</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="col-span-4">
                      <Label htmlFor="othersCopies" className="text-sm block mb-1 text-center">No. of Copies</Label>
                      <Input
                        id="othersCopies"
                        type="number"
                        min="1"
                        value={formData.requestTypes.others.copies}
                        onChange={(e) => handleCopiesChange('others', parseInt(e.target.value) || 1)}
                        className="text-center"
                      />
                    </div>
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
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;

// components/HelpSupport.jsx
import React, { useState, useRef } from "react";
import { 
  X, Upload, Mail, User, Building2, MessageSquare, 
  AlertCircle, CheckCircle, Image as ImageIcon, Trash2,
  Loader, Send
} from "lucide-react";
import axios from "axios";
import { backendUrl } from "../utils/backendUrl";

const HelpSupport = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    companyName: user?.companyName || "",
    problem: "",
    issueType: "General Query"
  });
  
  const [screenshot, setScreenshot] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const fileInputRef = useRef(null);

  const issueTypes = [
    "General Query",
    "Bug Report",
    "Feature Request",
    "Billing Issue",
    "Account Related",
    "Other"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear previous preview immediately
      setScreenshotPreview("");
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitStatus({ 
          type: "error", 
          message: "File size should be less than 5MB" 
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitStatus({ 
          type: "error", 
          message: "Please upload an image file (PNG, JPG, GIF)" 
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setScreenshot(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.problem.trim()) {
      setSubmitStatus({ type: "error", message: "Please describe your problem" });
      return;
    }

    if (!formData.email.trim()) {
      setSubmitStatus({ type: "error", message: "Email address is required" });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Prepare the data
      const emailData = {
        name: formData.name,
        email: formData.email,
        companyName: formData.companyName,
        issueType: formData.issueType,
        problem: formData.problem,
        screenshot: screenshotPreview || null
      };

      // Send to backend
      const response = await axios.post(
        `${backendUrl}/api/support/send-support-email`,
        emailData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSubmitStatus({ 
          type: "success", 
          message: "Your request has been sent to the support team. They will review it shortly and get back to you via email." 
        });
        
        // Reset form after success
        setFormData({
          name: user?.name || "",
          email: user?.email || "",
          companyName: user?.companyName || "",
          problem: "",
          issueType: "General Query"
        });
        removeScreenshot();
        
        // Close modal after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error("Error sending support request:", error);
      setSubmitStatus({ 
        type: "error", 
        message: "Failed to send request. Please try again or contact support directly." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Mail className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Help & Support Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                We're here to help! Fill out the form below and we'll get back to you ASAP.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Status Messages */}
          {submitStatus && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              submitStatus.type === "success" 
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" 
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              {submitStatus.type === "success" ? (
                <CheckCircle size={20} className="text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-bold ${
                  submitStatus.type === "success" 
                    ? "text-green-800 dark:text-green-300" 
                    : "text-red-800 dark:text-red-300"
                }`}>
                  {submitStatus.type === "success" ? "Success!" : "Error"}
                </p>
                <p className={`text-xs ${
                  submitStatus.type === "success" 
                    ? "text-green-700 dark:text-green-400" 
                    : "text-red-700 dark:text-red-400"
                }`}>
                  {submitStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Success state - show only success message and hide form */}
          {submitStatus?.type === "success" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                Request Sent Successfully!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
                Your support request has been received. Our team will review it and respond to your email within 24 hours.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
                This window will close automatically...
              </p>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <MessageSquare size={16} />
                  How to get help:
                </h3>
                <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>Select the type of issue you're experiencing</li>
                  <li>Describe your problem in detail</li>
                  <li>Attach a screenshot if applicable (optional, max 5MB)</li>
                  <li>Click "Send Support Request" - we'll receive it instantly</li>
                  <li>We'll respond to your email within 24 hours</li>
                </ol>
              </div>

              {/* Issue Type */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  Issue Type *
                </label>
                <select
                  name="issueType"
                  value={formData.issueType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  disabled={isSubmitting}
                >
                  {issueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                    <User size={14} className="inline mr-1" />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                    <Mail size={14} className="inline mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  <Building2 size={14} className="inline mr-1" />
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Problem Description */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  Describe Your Problem *
                </label>
                <textarea
                  name="problem"
                  value={formData.problem}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Please provide as much detail as possible..."
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                  <ImageIcon size={14} className="inline mr-1" />
                  Screenshot (Optional - Max 5MB)
                </label>
                
                {!screenshotPreview ? (
                  <div className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      className="hidden"
                      id="screenshot-upload"
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="screenshot-upload"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-slate-50 dark:bg-slate-800/50 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload size={24} className="text-slate-400 dark:text-slate-500 mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Click to upload screenshot
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </label>
                  </div>
                ) : (
                  <div className="relative border border-slate-300 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-48 object-contain rounded"
                    />
                    {!isSubmitting && (
                      <>
                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="absolute top-5 right-5 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {screenshot?.name} ({(screenshot?.size / 1024).toFixed(1)} KB)
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Change
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        {submitStatus?.type !== "success" && (
          <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2 min-w-[180px] justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Support Request
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpSupport;
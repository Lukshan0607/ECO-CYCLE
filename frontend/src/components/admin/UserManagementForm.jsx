import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  User as UserIcon, Mail, Phone, MapPin, Shield, Eye, EyeOff, 
  Building, Users, Star, X, IdCard, Lock, CheckCircle, AlertCircle
} from 'lucide-react';

// Status options for the status dropdown
const statusOptions = [
  'Active',
  'Inactive',
  'Suspended'
];

// Simple email validation
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ---------- Memoized Form Field Components ----------
const InputField = React.memo(function InputField({
  label, name, type = 'text', icon: Icon, required = false, options = null,
  disabled = false, value, onChange, onBlur, error, placeholder, min, inputMode = 'text'
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        )}
        {options ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : ''
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            min={min}
            className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-500' : ''
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            autoComplete={type === 'email' ? 'email' : 'off'}
            inputMode={inputMode}
          />
        )}
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
});

const PasswordField = React.memo(function PasswordField({
  label, name, show, setShow, required = false, value, onChange, onBlur, error, isEditing
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        {isEditing && <span className="text-gray-500 text-xs ml-2">(leave blank to keep current)</span>}
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? 'border-red-500' : ''
          }`}
          placeholder={isEditing ? 'Leave blank to keep current password' : `Enter ${label.toLowerCase()}`}
          autoComplete={name === 'password' ? 'new-password' : 'off'}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
});

// -------------------- Main Form --------------------
const UserManagementForm = ({ user = null, onSubmit, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    nic: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobile: '',
    address: '',
    status: 'Active'
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set form data when user prop changes (edit mode)
  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        nic: user.nic || '',
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        mobile: user.mobile || user.phone || '',
        address: user.address || '',
        status: user.status || 'Active'
      });
    }
  }, [isEditing, user]);

  // Field validation
  const validateField = (name, value) => {
    let error = '';
    
    switch(name) {
      case 'nic':
        if (!value.trim()) {
          error = 'NIC is required';
        } else if (!/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/.test(value)) {
          error = 'Please enter a valid NIC number';
        }
        break;
      case 'name':
        if (!value.trim()) {
          error = 'Name is required';
        } else if (value.length < 2) {
          error = 'Name must be at least 2 characters long';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!isValidEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'mobile':
        if (value && !/^[0-9]{10}$/.test(value)) {
          error = 'Please enter a valid 10-digit mobile number';
        }
        break;
      case 'password':
        if (!isEditing && !value) {
          error = 'Password is required';
        } else if (value && value.length < 6) {
          error = 'Password must be at least 6 characters long';
        }
        break;
      case 'confirmPassword':
        if (formData.password && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
    }
    
    return error;
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Format NIC to uppercase
    if (name === 'nic') {
      processedValue = value.toUpperCase();
    }
    // Format mobile number (only allow digits)
    else if (name === 'mobile') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }
    
    // Update form data
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate all fields
    Object.keys(formData).forEach(field => {
      // Skip password fields if in edit mode and both are empty
      if (isEditing && (field === 'password' || field === 'confirmPassword') && 
          !formData.password && !formData.confirmPassword) {
        return;
      }
      
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Prepare user data for submission
    const userData = { 
      ...formData
    };
    
    // Remove confirmPassword from submission
    delete userData.confirmPassword;
    
    // Only include password if it was changed
    if (!userData.password) {
      delete userData.password;
    }
    
    try {
      setIsSubmitting(true);
      await onSubmit(userData);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Handle API errors
      if (error.response?.data?.errors) {
        // Map backend validation errors to form errors
        const apiErrors = {};
        error.response.data.errors.forEach(err => {
          const field = err.path;
          apiErrors[field] = err.msg;
        });
        setErrors(apiErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* NIC */}
              <InputField
                label="NIC Number"
                name="nic"
                type="text"
                icon={IdCard}
                value={formData.nic}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.nic}
                placeholder="Enter NIC number"
                required
              />
              
              {/* Name */}
              <InputField
                label="Full Name"
                name="name"
                type="text"
                icon={UserIcon}
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.name}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <InputField
                label="Email Address"
                name="email"
                type="email"
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.email}
                placeholder="Enter email address"
                required
              />
              
              {/* Mobile */}
              <InputField
                label="Mobile Number"
                name="mobile"
                type="tel"
                icon={Phone}
                value={formData.mobile}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.mobile}
                placeholder="Enter mobile number"
                inputMode="numeric"
              />
            </div>
            
            {/* Address */}
            <InputField
              label="Address"
              name="address"
              type="text"
              icon={MapPin}
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.address}
              placeholder="Enter full address"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <PasswordField
                label="Password"
                name="password"
                show={showPassword}
                setShow={setShowPassword}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.password}
                isEditing={isEditing}
                required={!isEditing}
              />
              
              {/* Confirm Password */}
              <PasswordField
                label="Confirm Password"
                name="confirmPassword"
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.confirmPassword}
                isEditing={isEditing}
                required={!isEditing}
              />
            </div>
            
            {/* Status */}
            <div className="grid grid-cols-1 gap-4">
              <InputField
                label="Status"
                name="status"
                icon={formData.status === 'Active' ? CheckCircle : AlertCircle}
                value={formData.status}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.status}
                options={statusOptions}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : isEditing ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserManagementForm;

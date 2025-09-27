// src/components/business/Contact.jsx
import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  MapPinIcon, 
  ClockIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
    priority: "medium"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Prefer environment variables if available (recommended)
      const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || "service_9tztduw";
      const TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || "template_06y31nn";
      const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || "JFLwReWH9vSUtSK4k";

      const templateParams = {
        to_email: "ecocycle923@gmail.com",
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        message: formData.message,
      };

      // Send email via EmailJS
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
        publicKey: PUBLIC_KEY,
      });

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
        priority: "medium",
      });
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send your message. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: <PhoneIcon className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with our support team",
      contact: "+1 (555) 123-4567",
      availability: "Mon-Fri 9AM-6PM EST"
    },
    {
      icon: <EnvelopeIcon className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      contact: "ecocycle923@gmail.com",
      availability: "24/7 - Response within 24hrs"
    },
    {
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available on website",
      availability: "Mon-Fri 9AM-6PM EST"
    },
    {
      icon: <MapPinIcon className="w-6 h-6" />,
      title: "Visit Our Office",
      description: "Meet us in person",
      contact: "123 Green Street, Eco City, EC 12345",
      availability: "Mon-Fri 9AM-5PM EST"
    }
  ];

  const categories = [
    "General Inquiry",
    "Technical Support",
    "Billing & Payments",
    "Collection Services",
    "Product Information",
    "Partnership Opportunities",
    "Feedback & Suggestions",
    "Other"
  ];

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      {/* Hero Section (styled like Home hero, but Contact-specific) */}
      <section className="relative pt-28 pb-20 bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-medium mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              We're here to help
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Contact Us</h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Get in touch with our team for support, partnerships, or general inquiries.
            </p>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get In Touch</h2>
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        {method.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{method.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{method.description}</p>
                      <p className="text-blue-600 font-medium mb-1">{method.contact}</p>
                      <div className="flex items-center text-gray-500 text-xs">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {method.availability}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link 
                  to="/faq" 
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
                  Frequently Asked Questions
                </Link>
                <Link 
                  to="/help" 
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                  Help Center
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                  {error}
                </div>
              )}
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent Successfully!</h3>
                  <p className="text-gray-600 mb-6">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your full name"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Please provide detailed information about your inquiry..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      * Required fields
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                        isSubmitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg"
                      } text-white`}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Office Hours & Location */
        }
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Office Hours</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday - Friday</span>
                <span className="font-medium">9:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saturday</span>
                <span className="font-medium">10:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunday</span>
                <span className="font-medium">Closed</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Emergency support available 24/7 for critical issues
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Our Location</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPinIcon className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="font-medium">EcoCycle Headquarters</p>
                  <p className="text-gray-600">123 Green Street</p>
                  <p className="text-gray-600">Eco City, EC 12345</p>
                  <p className="text-gray-600">United States</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Free parking available. Public transportation accessible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

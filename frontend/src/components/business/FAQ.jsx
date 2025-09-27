// src/components/business/FAQ.jsx
import React, { useState } from "react";
import Navbar from "../layout/Navbar";
import Footer from "../layout/Footer";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

const faqData = [
  {
    id: 1,
    category: "General",
    question: "What is EcoCycle and how does it work?",
    answer: "EcoCycle is a comprehensive waste management and recycling platform that helps businesses and individuals track, manage, and recycle plastic bottles and other materials. Our system converts waste into valuable products while providing rewards for participation."
  },
  {
    id: 2,
    category: "General",
    question: "What types of materials do you accept?",
    answer: "We accept various types of plastic bottles including PET, HDPE, glass bottles, and other recyclable containers. Our system can process clear, colored, and mixed plastic materials."
  },
  {
    id: 3,
    category: "Rewards",
    question: "How do I earn points in the EcoCycle system?",
    answer: "You earn points by submitting recyclable materials, making purchases from our eco-friendly product catalog, referring friends, and participating in community recycling events. Points can be redeemed for discounts, products, or cash rewards."
  },
  {
    id: 4,
    category: "Rewards",
    question: "What can I do with my reward points?",
    answer: "Reward points can be used to purchase eco-friendly products, get discounts on future orders, redeem gift cards, or convert to cash. Higher tier members get access to exclusive rewards and better conversion rates."
  },
  {
    id: 5,
    category: "Collection",
    question: "How does the collection process work?",
    answer: "Our transport team follows scheduled routes to collect materials from registered locations. You can track collection status in real-time, receive notifications, and schedule special pickups through our platform."
  },
  {
    id: 6,
    category: "Collection",
    question: "What are your collection schedules?",
    answer: "We operate daily collection routes in urban areas and twice-weekly in suburban areas. Weekend collections are available for high-volume locations. You can view and modify your collection schedule in the transport dashboard."
  },
  {
    id: 7,
    category: "Products",
    question: "What products are made from recycled materials?",
    answer: "We produce a wide range of products including recycled PET filament for 3D printing, eco-friendly bags, containers, construction materials, and household items. All products are made from 100% recycled materials."
  },
  {
    id: 8,
    category: "Products",
    question: "How do I place an order for eco-friendly products?",
    answer: "You can browse our product catalog, add items to cart, and checkout using points or traditional payment methods. Members get exclusive discounts and early access to new products."
  },
  {
    id: 9,
    category: "Account",
    question: "How do I create an account and get started?",
    answer: "Simply sign up with your email, verify your account, and complete your profile. You can immediately start earning points and accessing our services. Business accounts have additional features for bulk operations."
  },
  {
    id: 10,
    category: "Account",
    question: "What are the different membership tiers?",
    answer: "We offer Bronze, Silver, Gold, and Platinum tiers based on your activity and points earned. Higher tiers unlock better rewards, priority support, exclusive products, and enhanced features."
  },
  {
    id: 11,
    category: "Technical",
    question: "Is my data secure on the EcoCycle platform?",
    answer: "Yes, we use industry-standard encryption and security measures to protect your data. We comply with data protection regulations and never share personal information with third parties without consent."
  },
  {
    id: 12,
    category: "Technical",
    question: "Can I access EcoCycle on mobile devices?",
    answer: "Our platform is fully responsive and works on all devices. We also have dedicated mobile apps for iOS and Android with additional features like QR code scanning and location-based services."
  }
];

const categories = ["All", "General", "Rewards", "Collection", "Products", "Account", "Technical"];

export default function FAQ() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [openItems, setOpenItems] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFAQs = faqData.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white text-gray-900">
      <Navbar />

      {/* Hero Section (Home-like) */}
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
              Need help? Start here
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
              Find answers to common questions about EcoCycle
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map(item => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.question}</h3>
                  </div>
                  {openItems[item.id] ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
              
              {openItems[item.id] && (
                <div className="px-6 pb-4 border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed pt-4">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No FAQs found matching your search criteria.</p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-6">Can't find what you're looking for? Our support team is here to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/contact" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Contact Support
            </Link>
            <Link 
              to="/help" 
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Help Center
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

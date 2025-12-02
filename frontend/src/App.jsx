import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
// REMOVED: import { AuthProvider } ... we don't need this anymore

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Signup from './pages/Signup';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';
import Checkout from './pages/Checkout';
import TaxiBooking from './pages/TaxiBooking';
import ListingForm from './pages/ListingForm';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import HelpCenter from './pages/HelpCenter';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function App() {
  return (
    // REMOVED: <AuthProvider> wrapper
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        <div className="flex-grow dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/listings/:id" element={<ListingDetails />} />
            <Route path="/payment/create/:id" element={<Checkout />} />
            <Route path="/listings/:id/taxi" element={<TaxiBooking />} />
            <Route path="/create-listing" element={<ListingForm />} />
            <Route path="/edit-listing/:id" element={<ListingForm />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Static Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </div>
        
        <Footer />
      </div>
    </Router>
  );
}

export default App;
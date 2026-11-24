import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Footer from './components/Footer';
import Navbar from './components/Navbar';

// Pages
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import HelpCenter from './pages/HelpCenter';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';
import ListingForm from './pages/ListingForm';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import ProfileSettings from './pages/ProfileSettings';
import Signup from './pages/Signup';
import TaxiBooking from './pages/TaxiBooking';
import Terms from './pages/Terms';

function App() {
  return (
    <AuthProvider>
      <Router>
      <Toaster
          position="top-center"
          gutter={12}
          containerStyle={{ top: 20 }}
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '14px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              border: '1px solid #f3f4f6',
              maxWidth: '420px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #dcfce7',
                background: '#f0fdf4',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #fecaca',
                background: '#fef2f2',
              },
            },
            loading: {
              style: {
                border: '1px solid #e0e7ff',
                background: '#eef2ff',
              },
            },
          }}
        />
      
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        
        <div className="flex-grow dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listings" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/settings" element={<ProfileSettings />} />
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
    </AuthProvider>
  );
}

export default App;
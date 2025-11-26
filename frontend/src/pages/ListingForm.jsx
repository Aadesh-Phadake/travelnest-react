// --- IMPORTS ---
// React core and hooks for state (useState) and side effects (useEffect)
import React, { useEffect, useState } from 'react';

// Routing hooks: 
// useNavigate for changing pages programmatically
// useParams to get parameters from the URL (like /edit/:id)
import { useNavigate, useParams } from 'react-router-dom';

// Redux hook to access the global store state (to get the current user)
import { useSelector } from 'react-redux';

// Custom axios instance for making HTTP requests (includes base URL and interceptors)
import api from '../api/axios';

// Toast library for showing success/error popup notifications
import toast from 'react-hot-toast';

// Icon library imports for UI elements
import { Plus, X, Save, Loader, ArrowLeft, Upload, FileText, Image as ImageIcon } from 'lucide-react';

// --- COMPONENT DEFINITION ---
const ListingForm = () => {
    // 1. EXTRACT URL PARAMETERS
    // We try to get 'id' from the URL. If the route is "/listings/edit/123", id will be "123".
    // If the route is "/listings/create", id will be undefined.
    const { id } = useParams(); 

    // 2. INITIALIZE NAVIGATION
    // This hook gives us a function to redirect the user to other pages.
    const navigate = useNavigate();

    // 3. GET CURRENT USER FROM REDUX
    // We need the user object to check their role (admin vs user) for the success message later.
    const { user } = useSelector((state) => state.auth);

    // 4. DETERMINE MODE (EDIT vs CREATE)
    // If 'id' exists, isEditMode becomes true. Otherwise, it is false.
    const isEditMode = Boolean(id);

    // --- STATE MANAGEMENT ---

    // 'loading': Controls the full-screen spinner while fetching existing data in Edit Mode.
    const [loading, setLoading] = useState(false);

    // 'uploading': Controls the disabled state of buttons while files are being uploaded to the server.
    const [uploading, setUploading] = useState(false);

    // 'formData': The main state object that holds all the input values for the form.
    const [formData, setFormData] = useState({
        title: '',          // Property Title
        description: '',    // Property Description
        price: '',          // Price per night
        country: '',        // Country name
        location: '',       // City/State
        images: [],         // Array to store the string URLs of images (returned from server)
        hotelLicense: null, // String URL for the uploaded PDF/Image license
        rooms: '',          // Total count of rooms (calculated aggregate)
        // Nested object for specific room counts
        roomTypes: {
            single: '',     // Count of single rooms
            double: '',     // Count of double rooms
            triple: ''      // Count of triple rooms
        }
    });

    // 'imageFiles': Local state to store raw File objects (useful if we needed to access the raw file data later).
    const [imageFiles, setImageFiles] = useState([]); 

    // 'licenseFile': Local state to store the raw license File object.
    const [licenseFile, setLicenseFile] = useState(null); 

    // 'imagePreviews': Local state to store Blob URLs (e.g., "blob:http://...") 
    // This allows us to show the user a preview of the image immediately without waiting for the server.
    const [imagePreviews, setImagePreviews] = useState([]); 

    // --- EFFECT: FETCH DATA FOR EDIT MODE ---
    // This runs when the component mounts, or if 'id' changes.
    useEffect(() => {
        // Only run this logic if we are editing an existing listing
        if (isEditMode) {
            const fetchListing = async () => {
                try {
                    setLoading(true); // Turn on the loading spinner
                    
                    // API GET request to fetch listing details by ID
                    const res = await api.get(`/listings/${id}`);
                    
                    // Normalize the response data (some APIs return data directly, some wrap it in .listing)
                    const data = res.data.listing || res.data;
                    
                    // Fill the form state with the data received from the database
                    setFormData({
                        title: data.title || '',
                        description: data.description || '',
                        price: data.price || '',
                        country: data.country || '',
                        location: data.location || '',
                        // Use existing images if they exist, else empty array
                        images: data.images && data.images.length > 0 ? data.images : [],
                        hotelLicense: data.hotelLicense || null,
                        rooms: data.rooms || '',
                        // Safety check: ensure roomTypes object structure exists
                        roomTypes: data.roomTypes || {
                            single: '',
                            double: '',
                            triple: ''
                        }
                    });
                    
                    // If the listing has images, set them as the previews so the user sees them
                    if (data.images && data.images.length > 0) {
                        setImagePreviews(data.images);
                    }
                } catch (error) {
                    // Handle fetch error
                    toast.error("Failed to load listing details");
                    navigate('/listings'); // Redirect back to list on failure
                } finally {
                    setLoading(false); // Turn off the loading spinner
                }
            };
            
            fetchListing(); // Execute the function defined above
        }
    }, [id, isEditMode, navigate]); // Dependency array: Effect runs if these values change

    // --- EVENT HANDLERS ---

    // 1. GENERIC INPUT HANDLER
    // Used for simple text/number inputs (Title, Description, Price, etc.)
    const handleChange = (e) => {
        // Use spread operator (...formData) to keep existing values
        // Update the specific field [e.target.name] with the new value
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. SINGLE IMAGE UPLOAD HANDLER
    // Note: This uploads the file to the server immediately upon selection.
    const handleImageChange = async (e, index) => {
        const file = e.target.files[0]; // Get the first selected file
        if (!file) return; // Exit if no file

        // Validation: Check MIME type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validation: Check file size (Max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should be less than 10MB');
            return;
        }

        try {
            setUploading(true); // Disable submit button during upload
            
            // Create FormData object to send file as 'multipart/form-data'
            const formDataUpload = new FormData();
            formDataUpload.append('image', file);

            // POST request to upload endpoint
            const response = await api.post('/api/upload/image', formDataUpload);

            // If upload successful
            if (response.data.success) {
                const imageUrl = response.data.url; // Get the URL returned by the server
                
                // Logic to handle Array updates immutably
                const currentImages = Array.isArray(formData.images) ? formData.images : [];
                const newImages = [...currentImages];
                
                // If index is provided, we are replacing an existing image
                if (index !== undefined && index < newImages.length) {
                    newImages[index] = imageUrl;
                } else {
                    // Otherwise, we are adding a new image
                    newImages.push(imageUrl);
                }
                
                // Update file/preview arrays similarly (Logic identical to above)
                const currentImageFiles = Array.isArray(imageFiles) ? imageFiles : [];
                const newImageFiles = [...currentImageFiles];
                if (index !== undefined && index < newImageFiles.length) {
                    newImageFiles[index] = file;
                } else {
                    newImageFiles.push(file);
                }
                
                const currentPreviews = Array.isArray(imagePreviews) ? imagePreviews : [];
                const newPreviews = [...currentPreviews];
                const previewUrl = URL.createObjectURL(file); // Create local blob URL
                if (index !== undefined && index < newPreviews.length) {
                    newPreviews[index] = previewUrl;
                } else {
                    newPreviews.push(previewUrl);
                }

                // Update all states
                setFormData(prevData => ({ ...prevData, images: newImages }));
                setImageFiles(newImageFiles);
                setImagePreviews(newPreviews);
                
                toast.success('Image uploaded successfully!');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setUploading(false); // Re-enable buttons
            e.target.value = ''; // Reset file input so the same file can be selected again if needed
        }
    };

    // 3. MULTIPLE IMAGE UPLOAD HANDLER
    // Allows selecting multiple files from the file dialog at once.
    const handleMultipleImages = async (e) => {
        // 'e.target.files' is a FileList, convert to Array for easier handling
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Validation: Ensure total images don't exceed 20
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.length + files.length > 20) {
            toast.error('Maximum 20 images allowed');
            return;
        }

        // Filter: Check each file for Type and Size
        const validFiles = files.filter(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return; // Exit if no valid files

        try {
            setUploading(true);
            
            // Prepare FormData for batch upload
            const formDataUpload = new FormData();
            validFiles.forEach(file => {
                formDataUpload.append('images', file); // Append all files to 'images' key
                console.log('Added file to FormData:', file.name, file.size, file.type);
            });
            
            console.log('Sending upload request with', validFiles.length, 'files');
            const response = await api.post('/api/upload/images', formDataUpload);
            console.log('Upload response:', response.data);
            
            // Extract uploaded URLs from response
            const successfulUrls = response.data.success ? response.data.urls : [];

            if (successfulUrls.length > 0) {
                // Merge new URLs with existing images
                setFormData(prevData => ({
                    ...prevData,
                    images: [...(prevData.images || []), ...successfulUrls]
                }));
                
                // Generate local previews for the new files
                const newPreviews = validFiles.map(file => URL.createObjectURL(file));
                // Append new previews to existing list
                setImagePreviews(prevPreviews => [...(prevPreviews || []), ...newPreviews]);
                
                toast.success(`${successfulUrls.length} image(s) uploaded successfully!`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload images';
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: errorMessage
            });
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // 4. LICENSE DOCUMENT UPLOAD HANDLER
    // Handles PDF or Image upload for hotel verification.
    const handleLicenseChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Define valid extensions
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
        
        // Validate Extension/Type
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
            toast.error('Please select a PDF or image file (JPG/PNG)');
            console.error('Invalid file type:', file.type, 'Extension:', fileExtension);
            return;
        }
        
        console.log('License file selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
            extension: fileExtension
        });

        // Validate Size
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size should be less than 10MB');
            return;
        }

        try {
            setUploading(true);
            
            const formDataUpload = new FormData();
            formDataUpload.append('document', file); // Key must match backend expectations

            const response = await api.post('/api/upload/document', formDataUpload);

            // If success, store URL in form data
            if (response.data.success && response.data.url) {
                setFormData(prevData => ({ ...prevData, hotelLicense: response.data.url }));
                setLicenseFile(file);
                console.log('License uploaded successfully:', response.data.url);
                toast.success('License document uploaded successfully!');
            } else {
                throw new Error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to upload document';
            console.error('Error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: errorMessage
            });
            toast.error(errorMessage);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // 5. REMOVE IMAGE HANDLER
    // Removes an image from the UI and State based on its index.
    const removeImage = (index) => {
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        // Filter out item at 'index'
        const newImages = currentImages.filter((_, i) => i !== index);
        const newPreviews = Array.isArray(imagePreviews) ? imagePreviews.filter((_, i) => i !== index) : [];
        const newImageFiles = Array.isArray(imageFiles) ? imageFiles.filter((_, i) => i !== index) : [];
        
        // Update all state arrays
        setFormData(prevData => ({ ...prevData, images: newImages }));
        setImagePreviews(newPreviews);
        setImageFiles(newImageFiles);
    };

    // 6. FORM SUBMIT HANDLER
    // Executed when user clicks "Create Listing" or "Update Listing".
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent page refresh
        
        // Validation: Required Text Fields
        if (!formData.title || !formData.price || !formData.location) {
            return toast.error("Please fill in all required fields");
        }

        // Validation: Required Images
        const currentImages = Array.isArray(formData.images) ? formData.images : [];
        if (currentImages.length === 0) {
            return toast.error("Please upload at least one image");
        }

        // Validation: Room Calculation
        // Parse strings to integers (inputs return strings by default)
        const totalRooms = (parseInt(formData.roomTypes.single) || 0) + 
                           (parseInt(formData.roomTypes.double) || 0) + 
                           (parseInt(formData.roomTypes.triple) || 0);
        
        if (totalRooms === 0) {
            return toast.error("Please enter at least one room type");
        }

        try {
            setLoading(true); // Show spinner
            const currentImages = Array.isArray(formData.images) ? formData.images : [];
            
            // Recalculate total rooms for final payload
            const calculatedTotalRooms = (parseInt(formData.roomTypes.single) || 0) + 
                                         (parseInt(formData.roomTypes.double) || 0) + 
                                         (parseInt(formData.roomTypes.triple) || 0);

            // Construct payload object
            const submitData = {
                ...formData,
                // Ensure no empty strings in images array
                images: currentImages.filter(url => url && url.trim() !== ""),
                hotelLicense: formData.hotelLicense || null,
                // Send total rooms as integer
                rooms: calculatedTotalRooms, 
                // Send detailed room types as integers
                roomTypes: {
                    single: parseInt(formData.roomTypes.single) || 0,
                    double: parseInt(formData.roomTypes.double) || 0,
                    triple: parseInt(formData.roomTypes.triple) || 0
                }
            };
            
            console.log('Submitting form data:', {
                ...submitData,
                images: submitData.images.length,
                hotelLicense: submitData.hotelLicense ? 'Present' : 'Missing'
            });

            if (isEditMode) {
                // EDIT MODE: Send PUT request
                await api.put(`/listings/${id}`, submitData);
                toast.success("Listing updated successfully!");
                navigate(`/listings/${id}`); // Go to details page
            } else {
                // CREATE MODE: Send POST request
                await api.post('/listings', submitData);
                
                // Show different messages based on user role
                if (user?.role === 'admin') {
                    toast.success("Listing created successfully!");
                } else {
                    toast.success("Listing request sent for approval!");
                }
                navigate('/listings'); // Go to listing dashboard
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false); // Stop spinner
        }
    };

    // --- LOADING STATE RENDER ---
    // If fetching data for Edit Mode, show full screen loader
    if (loading && isEditMode && !formData.title) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    // --- MAIN RENDER ---
    return (
        // Container: Full height, background color with dark mode support
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={() => navigate(-1)} // Go back one step in history
                    className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </button>

                {/* Main Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                    {/* Header Section */}
                    <div className="bg-primary/10 px-8 py-6 border-b border-primary/20">
                        {/* Title changes based on mode */}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEditMode ? "Edit Listing" : "Create New Listing"}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">
                            {isEditMode ? "Update your property details below." : "Fill in the details to list your property on TravelNest."}
                        </p>
                    </div>

                    {/* Form Start */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        
                        {/* 1. Title Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Listing Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title} // Bind state
                                onChange={handleChange} // Bind handler
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                placeholder="e.g. Cozy Cottage in the Hills"
                                required // HTML validation
                            />
                        </div>

                        {/* 2. Description Textarea */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                placeholder="Describe the property features, amenities, and surroundings..."
                                required
                            />
                        </div>

                        {/* 3. Grid for Price and Country */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per Night (₹)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    placeholder="1500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                    placeholder="e.g. India"
                                    required
                                />
                            </div>
                        </div>

                        {/* 4. Location Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location (City/State)</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                placeholder="e.g. Jaipur, Rajasthan"
                                required
                            />
                        </div>

                        {/* 5. Room Types Section */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Room Types Available</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Single Room */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Single Stay Rooms (1 person)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.single"
                                        value={formData.roomTypes.single}
                                        // Inline handler to update nested state object
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes,
                                                    single: e.target.value
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        placeholder="e.g. 30"
                                        required
                                    />
                                </div>
                                {/* Double Room */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Double Stay Rooms (2 people)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.double"
                                        value={formData.roomTypes.double}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes,
                                                    double: e.target.value
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        placeholder="e.g. 50"
                                        required
                                    />
                                </div>
                                {/* Triple Room */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Triple Stay Rooms (3 people)</label>
                                    <input
                                        type="number"
                                        name="roomTypes.triple"
                                        value={formData.roomTypes.triple}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                roomTypes: {
                                                    ...formData.roomTypes,
                                                    triple: e.target.value
                                                }
                                            });
                                        }}
                                        min="0"
                                        className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                        placeholder="e.g. 20"
                                        required
                                    />
                                </div>
                            </div>
                            {/* Live calculation of total rooms */}
                            <p className="text-xs text-gray-400 mt-2">
                                Total Rooms: {(
                                    (parseInt(formData.roomTypes.single) || 0) + 
                                    (parseInt(formData.roomTypes.double) || 0) + 
                                    (parseInt(formData.roomTypes.triple) || 0)
                                )}
                            </p>
                        </div>

                        {/* 6. Image Upload Section */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 items-center gap-2">
                                <ImageIcon className="w-4 h-4" />
                                Property Images
                            </label>
                            
                            {/* Multiple Image Upload Area */}
                            <div className="mb-4">
                                <label className="block text-xs text-gray-600 mb-2">Upload Multiple Images</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        multiple // Enable multiple file selection
                                        accept="image/*" // Restrict to image types
                                        onChange={handleMultipleImages}
                                        className="hidden" // Hide default input
                                        // Disable if upload in progress or limit reached
                                        disabled={uploading || (Array.isArray(formData.images) && formData.images.length >= 20)}
                                    />
                                    {/* Custom Upload Box */}
                                    <label 
                                        htmlFor="image-upload"
                                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg cursor-pointer hover:border-primary transition"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Click to upload images</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB each</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Image Previews Grid */}
                            {Array.isArray(formData.images) && formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                                    {/* Map over images to show preview cards */}
                                    {formData.images.map((url, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={imagePreviews[index] || url} // Use preview blob or server URL
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                            />
                                            {/* Delete Button (Visible on Hover) */}
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                                title="Remove Image"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-3">
                                {Array.isArray(formData.images) ? formData.images.length : 0} / 20 images uploaded
                            </p>
                        </div>

                        {/* 7. Hotel License Document Upload */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Hotel License Document
                            </label>
                            
                            {/* Conditional UI: Show Link if uploaded, else show Upload Box */}
                            {formData.hotelLicense ? (
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">License document uploaded</span>
                                    </div>
                                    <a
                                        href={formData.hotelLicense}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline"
                                    >
                                        View Document
                                    </a>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="license-upload"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleLicenseChange}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <label 
                                        htmlFor="license-upload"
                                        className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg cursor-pointer hover:border-primary transition"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-sm text-gray-600 dark:text-gray-300">Upload License Document</span>
                                            <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG up to 10MB</span>
                                        </div>
                                    </label>
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-2">
                                Upload your hotel license or registration document (PDF or Image)
                            </p>
                        </div>

                        {/* 8. Main Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || uploading} // Disable if busy
                            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-primary hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {/* Show Spinner or Icon/Text based on state */}
                            {loading || uploading ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {isEditMode ? "Update Listing" : "Create Listing"}
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ListingForm;
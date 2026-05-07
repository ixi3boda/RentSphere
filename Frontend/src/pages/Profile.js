// src/pages/Profile.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { AnimatedPage, AnimatedButton } from '../components/AnimatedPage';
import { motion } from 'framer-motion';

function Profile() {
  const { user, updateProfile, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const syncProfile = async () => {
      setFetchLoading(true);
      await refreshUser();
      if (mounted) setFetchLoading(false);
    };
    syncProfile();
    return () => {
      mounted = false;
    };
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      // Load existing profile picture if any
      if (user.avatar) {
        setProfilePicturePreview(user.avatar);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    const MAX_BYTES = 2 * 1024 * 1024; // 2MB

    const compressImage = (fileToCompress, maxBytes) => {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(fileToCompress);
        const img = new Image();
        img.onload = async () => {
          try {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let [w, h] = [img.naturalWidth, img.naturalHeight];

            // Start with original dimensions
            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);

            const mime = fileToCompress.type || 'image/jpeg';

            // helper to get blob at given quality
            const toBlob = (quality) =>
              new Promise((res) => canvas.toBlob(res, mime, quality));

            // Try decreasing quality first
            let quality = 0.92;
            let blob = await toBlob(quality);

            // If still too large, iteratively reduce quality and dimensions
            let attempts = 0;
            while ((blob && blob.size > maxBytes) && attempts < 12) {
              attempts += 1;
              // reduce quality
              quality = Math.max(0.4, quality - 0.12);
              blob = await toBlob(quality);
              if (blob && blob.size <= maxBytes) break;

              // if quality floor reached and still large, scale down dimensions by 0.85
              w = Math.floor(w * 0.85);
              h = Math.floor(h * 0.85);
              canvas.width = w;
              canvas.height = h;
              ctx.clearRect(0, 0, w, h);
              ctx.drawImage(img, 0, 0, w, h);
              blob = await toBlob(quality);
            }

            // If compression succeeded, return a File (preserve original name)
            if (blob) {
              const outFile = new File([blob], fileToCompress.name, { type: mime });
              resolve(outFile);
            } else {
              // fallback: return original file
              resolve(fileToCompress);
            }
          } catch (err) {
            resolve(fileToCompress);
          } finally {
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to read image'));
        };
        img.src = url;
      });
    };

    (async () => {
      let finalFile = file;
      if (file.size > MAX_BYTES) {
        alert('Reducing image size to 2 MB');
        try {
          finalFile = await compressImage(file, MAX_BYTES);
        } catch (err) {
          console.warn('Compression failed, using original file', err);
          finalFile = file;
        }
      }

      setProfilePicture(finalFile);
      // Create preview URL
      const previewUrl = URL.createObjectURL(finalFile);
      setProfilePicturePreview(previewUrl);
    })();

  };

  // Function to convert image to base64 (for demo - use Cloudinary in production)
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    
    try {
      let profilePictureBase64 = null;
      
      // Convert image to base64 if a new one was selected
      if (profilePicture) {
        profilePictureBase64 = await convertToBase64(profilePicture);
      }
      
      // Prepare update data
      const updateData = {
        full_name: formData.name,
        username: formData.username,
        mobile_number: formData.phone || '',
        avatar_url: profilePictureBase64 || user?.avatar || null,
      };

      const result = await updateProfile(updateData);
      if (!result.success) {
        throw new Error(result.error || 'Profile update failed.');
      }
      
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePicturePreview && profilePicturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  return (
    <AnimatedPage>
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold gradient-text mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </motion.div>

          {fetchLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center items-center py-20"
            >
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rentsphere-teal mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your profile...</p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Success Message */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg"
                >
                  {successMessage}
                </motion.div>
              )}

              {/* Profile Card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-effect rounded-2xl overflow-hidden shadow-2xl"
              >
            {/* Cover Image Section */}
            <div className="relative h-32 bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange">
              <div className="absolute -bottom-12 left-8">
                {/* Profile Picture - Clickable in edit mode */}
                <motion.div 
                  className={`relative ${isEditing ? 'cursor-pointer group' : ''}`}
                  whileHover={isEditing ? { scale: 1.05 } : {}}
                  onClick={isEditing ? handleImageClick : undefined}
                >
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
                    {profilePicturePreview ? (
                      <img 
                        src={profilePicturePreview} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-r from-rentsphere-teal to-rentsphere-orange flex items-center justify-center">
                        <span className="text-3xl text-white font-bold">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Status Indicator Circle */}
                  <div className={`absolute top-0 right-0 w-6 h-6 rounded-full border-2 border-white shadow-lg ${
                    user?.active ? 'bg-green-500' : 'bg-red-500'
                  }`} title={user?.active ? 'Active' : 'Inactive'} />
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-semibold">Change</span>
                    </div>
                  )}
                </motion.div>
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-16 pb-8 px-8">
              {!isEditing ? (
                // View Mode
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{formData.name || 'Not set'}</h2>
                      <p className="text-gray-500">{formData.email}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="btn-primary !py-2 !px-6"
                    >
                      Edit Profile
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Username</label>
                        <p className="text-gray-800 font-medium">{formData.username || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Email Address</label>
                        <p className="text-gray-800 font-medium">{formData.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Phone Number</label>
                        <p className="text-gray-800 font-medium">{formData.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-500">Member Since</label>
                        <p className="text-gray-800 font-medium">
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Last Updated</label>
                        <p className="text-gray-800 font-medium">
                          {user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Account Type</label>
                        <p className="text-gray-800 font-medium capitalize">
                          {user?.role === 'admin' ? '🔑 Property Admin' : user?.role === 'tenant' ? '🏠 Tenant' : '👤 Visitor'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Account Status</label>
                        <p className="text-gray-800 font-medium">
                          {user?.active ? (
                            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span>Active</span>
                          ) : (
                            <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Inactive</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field bg-gray-50"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  {/* Image Upload Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 Tip: Click on your profile picture above to upload a new image. 
                      Supported formats: JPG, PNG, GIF (Max 2MB)
                    </p>
                  </div>

                  <div className="flex gap-4 justify-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset image preview if cancelled
                        if (user?.avatar) {
                          setProfilePicturePreview(user.avatar);
                        } else {
                          setProfilePicturePreview(null);
                        }
                        setProfilePicture(null);
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </motion.button>
                    <AnimatedButton type="submit" loading={loading}>
                      Save Changes
                    </AnimatedButton>
                  </div>
                </form>
              )}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
          >
            <div className="glass-effect rounded-xl p-6 text-center card-hover">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-2xl font-bold text-rentsphere-teal">0</div>
              <div className="text-gray-600">Active Listings</div>
            </div>
            <div className="glass-effect rounded-xl p-6 text-center card-hover">
              <div className="text-3xl mb-2">🤝</div>
              <div className="text-2xl font-bold text-rentsphere-teal">0</div>
              <div className="text-gray-600">Active Contracts</div>
            </div>
            <div className="glass-effect rounded-xl p-6 text-center card-hover">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-rentsphere-teal">0</div>
              <div className="text-gray-600">Reviews</div>
            </div>
          </motion.div>
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

export default Profile;
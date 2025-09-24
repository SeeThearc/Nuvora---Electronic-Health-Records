import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const UploadPatientRecord = ({ patientAddress }) => {
  const { addMedicalRecord, loading } = useData();
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid file type (JPEG, PNG, GIF, WebP, PDF)');
        return;
      }

      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const uploadRecord = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!description.trim()) {
      alert('Please provide a description for the medical record');
      return;
    }

    try {
      const result = await addMedicalRecord(patientAddress, selectedFile, description);
      
      if (result) {
        alert('Medical record uploaded successfully!');
        // Reset form
        setSelectedFile(null);
        setDescription('');
        setPreview(null);
        // Reset file input
        document.getElementById('file-input').value = '';
      }
    } catch (error) {
      console.error("Error uploading record:", error);
      alert('Failed to upload medical record. Please try again.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="upload-patient-record">
      <h3>Upload Medical Record</h3>
      <p>Patient: {formatAddress(patientAddress)}</p>
      
      <div className="upload-form">
        <div className="form-group">
          <label>Select Medical Record (Image/Document):</label>
          <input
            id="file-input"
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />
        </div>

        {preview && (
          <div className="file-preview">
            <img src={preview} alt="Preview" style={{maxWidth: '300px', maxHeight: '200px'}} />
          </div>
        )}

        {selectedFile && !preview && (
          <div className="file-info">
            <p>Selected file: {selectedFile.name}</p>
            <p>Size: {formatFileSize(selectedFile.size)}</p>
            <p>Type: {selectedFile.type}</p>
          </div>
        )}

        <div className="form-group">
          <label>Description *:</label>
          <textarea
            placeholder="Provide details about this medical record (e.g., findings, diagnosis, recommendations)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
          <small>{description.length}/500 characters</small>
        </div>

        <button 
          onClick={uploadRecord} 
          disabled={!selectedFile || !description.trim() || loading}
          className="upload-btn"
        >
          {loading ? 'Uploading...' : 'Upload Medical Record'}
        </button>

        <button 
          type="button"
          onClick={() => {
            setSelectedFile(null);
            setDescription('');
            setPreview(null);
            document.getElementById('file-input').value = '';
          }}
          className="reset-btn"
          disabled={loading}
        >
          Reset Form
        </button>
      </div>

      <div className="upload-info">
        <h4>Supported File Types:</h4>
        <ul>
          <li>Images: JPG, PNG, GIF, WebP</li>
          <li>Documents: PDF, DOC, DOCX</li>
          <li>Maximum file size: 10MB</li>
        </ul>
      </div>

      <div className="patient-consent">
        <div className="consent-notice">
          <h5>⚠️ Medical Record Upload</h5>
          <p>By uploading this medical record, you confirm that:</p>
          <ul>
            <li>You have the patient's consent to upload this record</li>
            <li>The record is medically relevant and accurate</li>
            <li>You are authorized to add records for this patient</li>
            <li>The record complies with medical privacy regulations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadPatientRecord;
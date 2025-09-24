import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const UploadMedicalRecord = () => {
  const { acc, addMedicalRecord } = useData();
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
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

    try {
      setLoading(true);
      const result = await addMedicalRecord(acc, selectedFile, description);
      
      if (result) {
        alert('Medical record uploaded successfully!');
        setSelectedFile(null);
        setDescription('');
        setPreview(null);
        // Reset file input
        document.getElementById('file-input').value = '';
      }
      setLoading(false);
    } catch (error) {
      console.error("Error uploading record:", error);
      setLoading(false);
    }
  };

  return (
    <div className="upload-medical-record">
      <h3>Upload Medical Record</h3>
      
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
            <p>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        )}

        <div className="form-group">
          <label>Description (Optional):</label>
          <textarea
            placeholder="Add a description for this medical record..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <button 
          onClick={uploadRecord} 
          disabled={!selectedFile || loading}
          className="upload-btn"
        >
          {loading ? 'Uploading...' : 'Upload Medical Record'}
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
    </div>
  );
};

export default UploadMedicalRecord;
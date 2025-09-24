import { useState } from "react";
import { useData } from "../context/DataContext";

const AddMedicalRecordFile = ({ patientAddress }) => {
  const { uploadFileToIPFS, state } = useData();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !patientAddress) {
      setStatus("Select a file and patient address.");
      return;
    }
    setStatus("Uploading...");
    try {
      // upload file to IPFS
      const cid = await uploadFileToIPFS(file);
      // call smart contract to store CID
      const tx = await state.contract.addMedicalRecord(patientAddress, cid);
      await tx.wait();
      setStatus("Medical record uploaded successfully! CID: " + cid);
      setFile(null);
    } catch (err) {
      setStatus("Error uploading: " + err.message);
    }
  };

  return (
    <div className="dashboard-card">
      <h3>Add Medical Record (File Upload)</h3>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} accept="image/*,application/pdf" />
        <button type="submit" className="btn btn-success">Upload</button>
      </form>
      {status && <div>{status}</div>}
    </div>
  );
};

export default AddMedicalRecordFile;
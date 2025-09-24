import { createContext, useState, useContext } from "react";
import abi from "../artifacts/EHR.json";
import { ethers } from "ethers";
import axios from "axios";

export const DataContext = createContext();

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

export const DataProvider = ({ children }) => {
  const [state, setState] = useState({
    provider: null,
    signer: null,
    contract: null,
  });
  const [acc, setAcc] = useState("Not connected");
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]); // 🔹 Store all logs

  // 🔹 Logger function
  const logAction = (action, details = {}) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      account: acc,
      action,
      ...details,
    };
    console.log("📜 LOG:", newLog);
    setLogs((prev) => [...prev, newLog]);
  };

  // 🔹 Wallet Connection
  const connectWallet = async () => {
    try {
      const contractABI = abi.abi;
      const contractAddress = "0x27638019199E4D62bfcc0cbbae6300691C10a871";

      if (window.ethereum) {
        const account = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        window.ethereum.on("chainChanged", () => window.location.reload());
        window.ethereum.on("accountsChanged", () => window.location.reload());

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        setAcc(account[0]);
        setState({ provider, signer, contract });

        logAction("Wallet Connected", { account: account[0], contractAddress });

        await checkUserRegistration(contract, account[0]);
      } else {
        alert("Please install MetaMask");
      }
    } catch (error) {
      logAction("Wallet Connection Failed", { error: error.message });
      alert("Error connecting wallet");
    }
  };

  // 🔹 Check Registration
  const checkUserRegistration = async (contract, address) => {
    try {
      if (!contract) {
        logAction("Check Registration Failed", { reason: "Contract not init" });
        return;
      }

      const isPatient = await contract.isPatient(address);
      const isDoctor = await contract.isDoctor(address);

      if (isPatient) {
        setUserType("patient");
        await fetchUserData(contract, address, "patient");
      } else if (isDoctor) {
        setUserType("doctor");
        await fetchUserData(contract, address, "doctor");
      } else {
        setUserType(null);
        setUserData(null);
      }

      logAction("Checked User Registration", { address, isPatient, isDoctor });
    } catch (error) {
      logAction("Check Registration Error", { error: error.message });
    }
  };

  // 🔹 Fetch User Data from IPFS
  const fetchUserData = async (contract, address, type) => {
    try {
      let ipfsHash;
      if (type === "patient") {
        const patientData = await contract.getPatientData(address);
        ipfsHash = patientData.dataIPFShash;
      } else if (type === "doctor") {
        const doctorData = await contract.getDoctorData(address);
        ipfsHash = doctorData.dataIPFShash;
      } else {
        setUserData(null);
        return;
      }

      if (!ipfsHash || ipfsHash === "") {
        setUserData(null);
        return;
      }

      const data = await fetchJSONFromIPFS(ipfsHash);
      setUserData(data);

      logAction("Fetched User Data", { type, address, ipfsHash });
    } catch (error) {
      logAction("Fetch User Data Failed", { error: error.message });
      setUserData(null);
    }
  };

  // 🔹 Fetch All Doctors
  const getAllDoctors = async () => {
    try {
      if (!state.contract) throw new Error("Contract not initialized");

      const doctorAddresses = await state.contract.getAllDoctorAddresses();
      const doctorsData = [];

      for (const address of doctorAddresses) {
        try {
          const doctorData = await state.contract.getDoctorData(address);
          if (doctorData.exists) {
            const ipfsData = await fetchJSONFromIPFS(doctorData.dataIPFShash);
            doctorsData.push({
              address,
              specialization: doctorData.specialization,
              ...ipfsData,
            });
          }
        } catch (error) {
          logAction("Doctor Fetch Failed", { doctor: address, error: error.message });
        }
      }

      logAction("Fetched All Doctors", { count: doctorsData.length });
      return doctorsData;
    } catch (error) {
      logAction("Fetch All Doctors Failed", { error: error.message });
      return [];
    }
  };

  // 🔹 Upload JSON to IPFS
  const uploadJSONToIPFS = async (data) => {
    try {
      setLoading(true);
      const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      });
      setLoading(false);
      logAction("Uploaded JSON to IPFS", { ipfsHash: response.data.IpfsHash });
      return response.data.IpfsHash;
    } catch (error) {
      setLoading(false);
      logAction("Upload JSON to IPFS Failed", { error: error.message });
      throw error;
    }
  };

  // 🔹 Upload Image to IPFS
  const uploadImageToIPFS = async (file) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);

      const metadata = JSON.stringify({
        name: `Medical_Record_${Date.now()}`,
        keyvalues: {
          uploadedBy: acc,
          timestamp: new Date().toISOString(),
          type: "medical_record",
        },
      });
      formData.append("pinataMetadata", metadata);

      const options = JSON.stringify({ cidVersion: 0 });
      formData.append("pinataOptions", options);

      const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
      const response = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      });

      setLoading(false);
      logAction("Uploaded Image to IPFS", { ipfsHash: response.data.IpfsHash });
      return response.data.IpfsHash;
    } catch (error) {
      setLoading(false);
      logAction("Upload Image to IPFS Failed", { error: error.message });
      throw error;
    }
  };

  // 🔹 Fetch JSON from IPFS
  const fetchJSONFromIPFS = async (hash) => {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${hash}`);
      return response.data;
    } catch (error) {
      logAction("Fetch JSON from IPFS Failed", { hash, error: error.message });
      throw error;
    }
  };

  // 🔹 Get Image URL from IPFS
  const getImageFromIPFS = (hash) =>
    `https://gateway.pinata.cloud/ipfs/${hash}`;

  // 🔹 Get Patient Records
  const getPatientRecords = async (patientAddress) => {
    try {
      if (!state.contract) throw new Error("Contract not initialized");
      const records = await state.contract.getPatientRecords(patientAddress);
      logAction("Fetched Patient Records", { patientAddress, count: records.length });
      return records;
    } catch (error) {
      logAction("Fetch Patient Records Failed", { error: error.message });
      return [];
    }
  };

  // 🔹 Fetch Medical Records
  const fetchMedicalRecords = async (patientAddress) => {
    try {
      const recordHashes = await getPatientRecords(patientAddress);
      const records = recordHashes.map((hash) => ({
        hash,
        imageUrl: getImageFromIPFS(hash),
      }));
      logAction("Fetched Medical Records", { patientAddress, count: records.length });
      return records;
    } catch (error) {
      logAction("Fetch Medical Records Failed", { error: error.message });
      return [];
    }
  };

  // 🔹 Register Patient
  const registerPatient = async (patientData) => {
    try {
      if (!state.contract) {
        alert("Please connect your wallet first");
        return false;
      }

      setLoading(true);
      const ipfsHash = await uploadJSONToIPFS(patientData);
      const tx = await state.contract.registerPatient(ipfsHash);

      logAction("Register Patient Tx Sent", { ipfsHash, txHash: tx.hash });

      await tx.wait();
      setUserType("patient");
      setUserData(patientData);
      setLoading(false);

      logAction("Register Patient Tx Confirmed", { ipfsHash, txHash: tx.hash });
      return true;
    } catch (error) {
      setLoading(false);
      logAction("Register Patient Failed", { error: error.message });
      return false;
    }
  };

  // 🔹 Register Doctor
  const registerDoctor = async (doctorData) => {
    try {
      if (!state.contract) {
        alert("Please connect your wallet first");
        return false;
      }

      setLoading(true);
      const ipfsHash = await uploadJSONToIPFS(doctorData);
      const tx = await state.contract.registerDoctor(
        ipfsHash,
        doctorData.specialization
      );

      logAction("Register Doctor Tx Sent", {
        ipfsHash,
        specialization: doctorData.specialization,
        txHash: tx.hash,
      });

      await tx.wait();
      setUserType("doctor");
      setUserData(doctorData);
      setLoading(false);

      logAction("Register Doctor Tx Confirmed", { ipfsHash, txHash: tx.hash });
      return true;
    } catch (error) {
      setLoading(false);
      logAction("Register Doctor Failed", { error: error.message });
      return false;
    }
  };

  // 🔹 Add Medical Record
  const addMedicalRecord = async (patientAddress, imageFile, description = "") => {
    try {
      if (!state.contract) {
        alert("Please connect your wallet first");
        return false;
      }

      setLoading(true);

      const recordData = {
        description,
        timestamp: new Date().toISOString(),
        addedBy: acc,
        patientAddress,
      };

      const imageHash = await uploadImageToIPFS(imageFile);
      const metadataHash = await uploadJSONToIPFS(recordData);

      const tx = await state.contract.addMedicalRecord(
        patientAddress,
        imageHash
      );

      logAction("Add Medical Record Tx Sent", {
        patientAddress,
        imageHash,
        metadataHash,
        txHash: tx.hash,
      });

      await tx.wait();
      setLoading(false);

      logAction("Add Medical Record Tx Confirmed", {
        patientAddress,
        imageHash,
        metadataHash,
        txHash: tx.hash,
      });
      return { imageHash, metadataHash };
    } catch (error) {
      setLoading(false);
      logAction("Add Medical Record Failed", { error: error.message });
      return false;
    }
  };

  // 🔹 Refresh User Data
  const refreshUserData = async () => {
    if (state.contract && acc && acc !== "Not connected") {
      await checkUserRegistration(state.contract, acc);
    }
  };

  return (
    <DataContext.Provider
      value={{
        state,
        acc,
        userType,
        userData,
        loading,
        logs, // expose logs
        connectWallet,
        registerPatient,
        registerDoctor,
        addMedicalRecord,
        uploadJSONToIPFS,
        uploadImageToIPFS,
        fetchJSONFromIPFS,
        getImageFromIPFS,
        getPatientRecords,
        fetchMedicalRecords,
        checkUserRegistration,
        refreshUserData,
        getAllDoctors,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};

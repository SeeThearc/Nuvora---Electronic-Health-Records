import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const ChatWithDoctor = () => {
  const { state, acc, uploadJSONToIPFS, fetchJSONFromIPFS } = useData();
  const [allowedDoctors, setAllowedDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDoctorInfo, setSelectedDoctorInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadAllowedDoctors();
  }, [state.contract, acc]);

  useEffect(() => {
    if (selectedDoctor) {
      loadChatHistory();
      // Find and set doctor info
      const doctorInfo = allowedDoctors.find(doc => doc.address === selectedDoctor);
      setSelectedDoctorInfo(doctorInfo);
    } else {
      setChatMessages([]);
      setSelectedDoctorInfo(null);
    }
  }, [selectedDoctor, allowedDoctors]);

  const loadAllowedDoctors = async () => {
    if (!state.contract || !acc) return;

    try {
      setLoading(true);
      const doctorAddresses = await state.contract.getAllowedDoctors(acc);
      const doctorData = [];

      for (const address of doctorAddresses) {
        try {
          const doctor = await state.contract.getDoctorData(address);
          if (doctor.exists) {
            const ipfsData = await fetchJSONFromIPFS(doctor.dataIPFShash);
            doctorData.push({
              address,
              specialization: doctor.specialization,
              name: ipfsData.firstName || 'Unknown',
              lastName: ipfsData.lastName || 'Doctor'
            });
          }
        } catch (error) {
          console.log(`Error loading doctor ${address}:`, error);
        }
      }

      setAllowedDoctors(doctorData);
      setLoading(false);
    } catch (error) {
      console.error("Error loading allowed doctors:", error);
      setLoading(false);
    }
  };

  const loadChatHistory = async () => {
    if (!state.contract || !selectedDoctor) return;

    try {
      setLoadingChat(true);
      const messageHashes = await state.contract.getChat(selectedDoctor);
      const messages = [];

      for (const hash of messageHashes) {
        try {
          const messageData = await fetchJSONFromIPFS(hash);
          messages.push(messageData);
        } catch (error) {
          console.log(`Error loading message ${hash}:`, error);
          // Add a placeholder for failed messages
          messages.push({
            message: "Failed to load message",
            sender: "system",
            senderType: "system",
            timestamp: new Date().toISOString(),
            error: true
          });
        }
      }

      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setChatMessages(messages);
      setLoadingChat(false);
    } catch (error) {
      console.error("Error loading chat history:", error);
      setChatMessages([]);
      setLoadingChat(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedDoctor || !state.contract) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        message: newMessage.trim(),
        sender: acc,
        senderType: 'patient',
        timestamp: new Date().toISOString(),
        to: selectedDoctor,
        patientAddress: acc,
        doctorAddress: selectedDoctor
      };

      const ipfsHash = await uploadJSONToIPFS(messageData);
      const tx = await state.contract.sendMessageToDoctor(selectedDoctor, ipfsHash);
      await tx.wait();

      // Add message to local state immediately for better UX
      setChatMessages(prev => [...prev, messageData]);
      setNewMessage('');
      
      // Reload chat to ensure consistency
      setTimeout(() => {
        loadChatHistory();
      }, 1000);
      
      setSendingMessage(false);
    } catch (error) {
      console.error("Error sending message:", error);
      alert('Error sending message. Please try again.');
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const refreshChat = () => {
    if (selectedDoctor) {
      loadChatHistory();
    }
  };

  return (
    <div className="chat-with-doctor">
      <div className="chat-header">
        <h3>Chat with Doctors</h3>
        {selectedDoctor && (
          <button onClick={refreshChat} className="refresh-chat-btn" disabled={loadingChat}>
            {loadingChat ? '🔄' : '↻'} Refresh
          </button>
        )}
      </div>
      
      <div className="doctor-selector">
        <label>Select Doctor to Chat:</label>
        <select 
          value={selectedDoctor} 
          onChange={(e) => setSelectedDoctor(e.target.value)}
          disabled={loading}
        >
          <option value="">
            {loading ? 'Loading doctors...' : 'Select a doctor'}
          </option>
          {allowedDoctors.map(doctor => (
            <option key={doctor.address} value={doctor.address}>
              Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
            </option>
          ))}
        </select>
      </div>

      {selectedDoctor && selectedDoctorInfo && (
        <div className="selected-doctor-info">
          <div className="doctor-avatar-small">
            {selectedDoctorInfo.firstName?.charAt(0)}{selectedDoctorInfo.lastName?.charAt(0)}
          </div>
          <div className="doctor-details">
            <h4>Dr. {selectedDoctorInfo.firstName} {selectedDoctorInfo.lastName}</h4>
            <p>{selectedDoctorInfo.specialization}</p>
          </div>
          <div className="chat-status">
            <span className="online-indicator"></span>
            <span>Online</span>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <div className="chat-container">
          <div className="chat-history">
            {loadingChat && (
              <div className="chat-loading">
                <div className="loading-spinner-small"></div>
                <p>Loading chat history...</p>
              </div>
            )}
            
            {!loadingChat && chatMessages.length === 0 && (
              <div className="no-messages">
                <div className="no-messages-icon">💬</div>
                <h4>No messages yet</h4>
                <p>Start the conversation with Dr. {selectedDoctorInfo?.firstName} {selectedDoctorInfo?.lastName}</p>
                <p>Your messages are encrypted and stored securely on IPFS</p>
              </div>
            )}

            {!loadingChat && chatMessages.map((message, index) => (
              <div 
                key={index} 
                className={`message ${message.senderType === 'patient' ? 'sent' : 'received'} ${message.error ? 'error' : ''}`}
              >
                <div className="message-content">
                  <p>{message.message}</p>
                  <div className="message-footer">
                    <small className="timestamp">{formatTimestamp(message.timestamp)}</small>
                    {message.senderType === 'patient' && (
                      <span className="message-status">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {sendingMessage && (
              <div className="message sent sending">
                <div className="message-content">
                  <p>{newMessage}</p>
                  <div className="message-footer">
                    <small>Sending...</small>
                    <span className="message-status">⏳</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="message-input-container">
            <div className="message-input">
              <textarea
                placeholder={`Type your message to Dr. ${selectedDoctorInfo?.firstName}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                rows={2}
              />
              <button 
                onClick={sendMessage} 
                disabled={!newMessage.trim() || sendingMessage}
                className="send-btn"
              >
                {sendingMessage ? (
                  <div className="sending-spinner"></div>
                ) : (
                  <span>Send ➤</span>
                )}
              </button>
            </div>
            <div className="input-help">
              <small>Press Enter to send, Shift+Enter for new line</small>
            </div>
          </div>
        </div>
      )}

      {allowedDoctors.length === 0 && !loading && (
        <div className="no-doctors-chat">
          <div className="no-doctors-icon">👨‍⚕️</div>
          <h4>No doctors available for chat</h4>
          <p>You haven't granted access to any doctors yet.</p>
          <p>Grant access to doctors first to start chatting with them.</p>
        </div>
      )}
    </div>
  );
};

export default ChatWithDoctor;
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const ChatWithPatient = ({ patientAddress }) => {
  const { state, acc, uploadJSONToIPFS, fetchJSONFromIPFS } = useData();
  const [patientInfo, setPatientInfo] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (patientAddress) {
      loadPatientInfo();
      loadChatHistory();
    }
  }, [patientAddress, state.contract]);

  const loadPatientInfo = async () => {
    if (!state.contract || !patientAddress) return;

    try {
      const patient = await state.contract.getPatientData(patientAddress);
      if (patient.exists) {
        const ipfsData = await fetchJSONFromIPFS(patient.dataIPFShash);
        setPatientInfo({
          address: patientAddress,
          ...ipfsData
        });
      }
    } catch (error) {
      console.error("Error loading patient info:", error);
    }
  };

  const loadChatHistory = async () => {
    if (!state.contract || !patientAddress) return;

    try {
      setLoadingChat(true);
      const messageHashes = await state.contract.getChatWithPatient(patientAddress);
      const messages = [];

      for (const hash of messageHashes) {
        try {
          const messageData = await fetchJSONFromIPFS(hash);
          messages.push(messageData);
        } catch (error) {
          console.log(`Error loading message ${hash}:`, error);
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
    if (!newMessage.trim() || !patientAddress || !state.contract) return;

    try {
      setSendingMessage(true);
      
      const messageData = {
        message: newMessage.trim(),
        sender: acc,
        senderType: 'doctor',
        timestamp: new Date().toISOString(),
        to: patientAddress,
        patientAddress: patientAddress,
        doctorAddress: acc
      };

      const ipfsHash = await uploadJSONToIPFS(messageData);
      const tx = await state.contract.sendMessageToPatient(patientAddress, ipfsHash);
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
    loadChatHistory();
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="chat-with-patient">
      <div className="chat-header">
        <h3>Chat with Patient</h3>
        <button onClick={refreshChat} className="refresh-chat-btn" disabled={loadingChat}>
          {loadingChat ? '🔄' : '↻'} Refresh
        </button>
      </div>

      {patientInfo && (
        <div className="selected-patient-info">
          <div className="patient-avatar-small">
            {patientInfo.name?.charAt(0)}{patientInfo.lastName?.charAt(0)}
          </div>
          <div className="patient-details">
            <h4>{patientInfo.name} {patientInfo.lastName}</h4>
            <p>{patientInfo.age} years old • {patientInfo.gender} • Blood Group: {patientInfo.bloodGroup}</p>
            <p className="patient-address">{formatAddress(patientInfo.address)}</p>
          </div>
          <div className="chat-status">
            <span className="online-indicator"></span>
            <span>Available</span>
          </div>
        </div>
      )}

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
              <p>Start the conversation with {patientInfo?.name} {patientInfo?.lastName}</p>
              <p>Your professional communication is encrypted and stored securely</p>
            </div>
          )}

          {!loadingChat && chatMessages.map((message, index) => (
            <div 
              key={index} 
              className={`message ${message.senderType === 'doctor' ? 'sent' : 'received'} ${message.error ? 'error' : ''}`}
            >
              <div className="message-content">
                <div className="message-header">
                  <span className="sender-label">
                    {message.senderType === 'doctor' ? 'Dr. You' : patientInfo?.name}
                  </span>
                </div>
                <p>{message.message}</p>
                <div className="message-footer">
                  <small className="timestamp">{formatTimestamp(message.timestamp)}</small>
                  {message.senderType === 'doctor' && (
                    <span className="message-status">✓</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {sendingMessage && (
            <div className="message sent sending">
              <div className="message-content">
                <div className="message-header">
                  <span className="sender-label">Dr. You</span>
                </div>
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
              placeholder={`Type your message to ${patientInfo?.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendingMessage}
              rows={3}
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
            <small>Press Enter to send, Shift+Enter for new line • Professional communication guidelines apply</small>
          </div>
        </div>
      </div>

      <div className="medical-disclaimer">
        <div className="disclaimer-content">
          <h5>⚕️ Medical Communication Guidelines</h5>
          <ul>
            <li>Maintain professional tone and medical confidentiality</li>
            <li>Use clear, patient-friendly language when possible</li>
            <li>For urgent medical situations, use emergency contacts</li>
            <li>All communications are permanently stored on blockchain</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChatWithPatient;
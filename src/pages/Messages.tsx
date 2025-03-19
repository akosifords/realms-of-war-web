import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, QuerySnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import NavBar from '../components/NavBar';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/signin');
      return;
    }

    // Subscribe to messages sent to the current user
    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot: QuerySnapshot) => {
      const messageList: Message[] = [];
      snapshot.forEach((doc: QueryDocumentSnapshot) => {
        messageList.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });
      setMessages(messageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) return;
    
    if (!newMessage.trim() || !recipient.trim()) {
      setError('Please enter a message and recipient');
      return;
    }
    
    setSending(true);
    setError('');
    
    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || 'Unknown User',
        receiverId: recipient,
        text: newMessage,
        createdAt: new Date().toISOString(),
        read: false
      });
      
      setNewMessage('');
      setRecipient('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
      <NavBar activeTab="messages" />
      
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>Messages</h1>
        
        {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'left' }}>New Message</h2>
            
            <form onSubmit={sendMessage}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="recipient" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>
                  Recipient ID:
                </label>
                <input
                  type="text"
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>
                  Message:
                </label>
                <textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={4}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #333',
                    borderRadius: '4px',
                    color: 'white',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <button 
                type="submit"
                disabled={sending}
                style={{ 
                  backgroundColor: '#ff6b35', 
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
          
          <div style={{ 
            backgroundColor: '#262640',
            borderRadius: '8px',
            padding: '1.5rem'
          }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'left' }}>Inbox</h2>
            
            {loading ? (
              <p>Loading messages...</p>
            ) : messages.length === 0 ? (
              <p>No messages yet.</p>
            ) : (
              <div>
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    style={{ 
                      padding: '1rem',
                      borderBottom: '1px solid #333',
                      textAlign: 'left',
                      backgroundColor: message.read ? 'transparent' : 'rgba(255, 107, 53, 0.1)'
                    }}
                  >
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>From:</strong> {message.senderName}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Date:</strong> {new Date(message.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Message:</strong> {message.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages; 
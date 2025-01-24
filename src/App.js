import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import sendIcon from './assets/send.svg';

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [serverIP, setServerIP] = useState(`${window.location.hostname}:3000`); // Default to hostname:3000
    const messagesEndRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null); // For server errors

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const handleIPChange = (event) => {
        setServerIP(event.target.value);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        setErrorMessage(null); // Clear any previous error
        setMessages(prevMessages => [...prevMessages, { text: input, sender: 'user' }]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`http://${serverIP}/prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: currentInput }),
            });

            setIsLoading(false);

            if (response.ok) {
                const data = await response.json();
                if (data.response) {
                    setMessages(prevMessages => [...prevMessages, { text: data.response, sender: 'bot' }]);
                } else if (data.message) {
                    setMessages(prevMessages => [...prevMessages, { text: data.message, sender: 'bot' }]);
                }
            } else {
                const errorData = await response.json();
                const errorText = errorData.message || "Error sending request";
                setMessages(prevMessages => [...prevMessages, { text: errorText, sender: 'bot', isError: true }]);
                setErrorMessage(errorText); // Set error message for display above chat
                console.error('Failed to send message:', response.statusText, errorData);
            }
        } catch (error) {
            setIsLoading(false);
            setMessages(prevMessages => [...prevMessages, { text: "Network error, check server IP.", sender: 'bot', isError: true }]);
            setErrorMessage("Network error, check server IP.");
            console.error('Network error:', error);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    }

    return (
        <div className="container">
            <div className="chat-header">
                <h1>AI Home Assistant</h1>
                <input
                    type="text"
                    placeholder="Server IP:Port"
                    value={serverIP}
                    onChange={handleIPChange}
                    className="ip-input"
                />
            </div>
             {errorMessage && <div className="error-display">{errorMessage}</div>} {/* Error display */}
            <div className="chat-box">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
                    >
                        {message.text}
                    </div>
                ))}
                {isLoading && <div className="bot-message">Loading...</div>}
                <div ref={messagesEndRef}></div>
            </div>
            <div className="input-box">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="message-input"
                />
                <button className="send-button" onClick={sendMessage} disabled={isLoading}> {/* Disable button when loading */}
                    <img src={sendIcon} alt="send" />
                </button>
            </div>
        </div>
    );
}

export default App;
import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import sendIcon from './assets/send.svg';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleInputChange = (event) => {
        setInput(event.target.value);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        setErrorMessage(null);
        setMessages(prevMessages => [...prevMessages, { text: input, sender: 'user' }]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`http://52.140.2.134:3000/prompt`, { // Hardcoded IP
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
                setErrorMessage(errorText);
                console.error('Failed to send message:', response.statusText, errorData);
            }
        } catch (error) {
            setIsLoading(false);
            setMessages(prevMessages => [...prevMessages, { text: "Network error, check server connection.", sender: 'bot', isError: true }]);
            setErrorMessage("Network error, check server connection.");
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
            </div>
             {errorMessage && <div className="error-display">{errorMessage}</div>}
            <div className="chat-box">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'} ${message.isError ? 'error-message' : ''}`}
                    >
                        {message.sender === 'bot' ? (
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown
                                children={message.text}
                            />
                        ) : (
                            message.text
                        )}
                    </div>
                ))}
                {isLoading && <div className="bot-message loading-message">Loading...</div>}
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
                <button className="send-button" onClick={sendMessage} disabled={isLoading}>
                    <img src={sendIcon} alt="send" />
                </button>
            </div>
        </div>
    );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Global styles for dark mode
const GlobalStyle = createGlobalStyle`
  body {
    background-color: #1a1a1a;
    color: #ffffff;
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
  }
`;

// Styled components for the chatbot interface
const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8rem 1rem 6rem; /* Adjusted padding */
  width: 70vw; /* Constrain the width */
  margin: auto; /* Center the chat area */
  background-color: #242424; /* Background color for the chat area */
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0); /* Remove the shadow */
  padding-bottom: 5rem;
`;

const Message = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const UserMessage = styled(Message)`
  justify-content: flex-end;
`;

const BotMessage = styled(Message)`
  justify-content: flex-start;
`;

const MessageText = styled.p`
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  background-color: ${(props) => (props.user ? '#4a4a4a' : '#1a1a1a')};
  color: ${(props) => (props.user ? '#ffffff' : '#cccccc')};
  max-width: 80%; /* Constrain the width */
  word-wrap: break-word;
`;

const InputContainer = styled.div`
  position: fixed;
  bottom: ${({ prompt }) => (prompt ? '50vh' : '2rem')};
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  z-index: 2;
  transition: bottom 0.3s ease;
  padding: 0.5rem 1rem; /* Added padding */
  border-radius: 1rem; /* Rounded corners */
  width: ${({ prompt }) => (prompt ? '55vw' : '40vw')}; /* Adjust width */
`;

const Heading = styled.div`
  position: fixed;
  bottom: 65vh;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  z-index: 2;
  font-size: 50px;
  font-weight: bold;
  transition: bottom 0.3s ease;
  padding: 0.5rem 1rem; /* Added padding */
  border-radius: 1rem; /* Rounded corners */
  width: ${({ prompt }) => (prompt ? '70vw' : 'auto')}; /* Adjust width */
`;

const Input = styled.input`
  flex: 1;
  padding: 0.7rem;
  border: none;
  border-radius: 1rem;
  background-color: ${(isFirstQuery) => (isFirstQuery ? '#2b2b2b' : '#1a1a1a')};
  color: #ffffff;
  outline: none;
`;

const SendButton = styled.button`
  background-color: #0077b6;
  color: #ffffff;
  border: none;
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  margin-left: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #005d9e;
  }
`;

const Loader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent black background */
  z-index: 9999; /* Ensure loader is on top of other elements */
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3); /* Light border color */
  border-top: 4px solid #ffffff; /* White border color */
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite; /* Spin animation */
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FeedbackContainer = styled.div`
  justify-content: center;
  align-items: center;
`;

const FeedbackButton = styled.button`
  font-size: 1.5rem;
  background-color: transparent;
  border: none;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
  }
`;

const ChatInterface = () => {
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isFirstQuery, setIsFirstQuery] = useState(true);
  const [isSending, setIsSending] = useState(false); // State to track if a request is being sent
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [lastMessageIndex, setLastMessageIndex] = useState(-1); // Initialize with -1 to indicate no last message
  const [QuestionId, setQuestionId] = useState(0)


  useEffect(() => {
    const generateSessionId = () => {
      const id = uuidv4();
      setSessionId(id);
    };

    generateSessionId();
  }, []);

  const handleSubmit = async (e) => {
    if (!isSending && (e.key === 'Enter' || e.type === 'click')) {
      e.preventDefault();
      setIsSending(true);
  
      const fetchAnswer = async () => {
        try {
          const response = await fetch('http://localhost:8000/api/questions/', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              session_id: sessionId,
              question: userInput,
            }),
          });
  
          if (!response.ok) {
            throw new Error('Internal Server Error');
          }
  
          const data = await response.json();
          setMessages((prevMessages) => {
            const newMessages = [...prevMessages, { user: true, text: userInput }, { user: false, text: data.answer }];
            setLastMessageIndex(newMessages.length - 1);
            return newMessages;
          });
          setUserInput('');
          setIsFirstQuery(false);
          setFeedbackGiven(false);
          setQuestionId(data.question_id);
  
          if (data.answer === 'Please wait for a while, our team will answer you soon.') {
            // If response is still "Please wait...", fetch again after one minute
            setTimeout(fetchAnswer, 20000); // Wait for one minute (60000 milliseconds)
          } else {
            setIsSending(false); // Stop sending requests once answer changes
          }
        } catch (error) {
          console.error(error);
          toast.error('Internal Server Error');
          setIsSending(false);
        }
      };
  
      fetchAnswer();
    }
  };
  
  

  const handleFeedback = async (feedback) => {
    const lastMessageIndex = messages.length - 1;
    const lastMessage = messages[lastMessageIndex];
    
    if (feedback === '👎' && lastMessage && !lastMessage.user) {

      const questionId = QuestionId; 
      try {
        const response = await fetch('http://localhost:8000/api/feedback/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question: questionId,
            answer: lastMessage.text,
            feedback: false,
          }),
        });
  
        if (response.ok) {
          console.log('Feedback submitted successfully.');
          // You can also show a success message to the user if needed
        } else {
          throw new Error('Feedback submission failed.');
        }
      } catch (error) {
        console.error('Error submitting feedback:', error);
        toast.error('Error submitting feedback');
      }
    }
  };
  


  return (
    <ChatContainer>
      <GlobalStyle />

      {isSending && (
        <Loader>
          <Spinner />
        </Loader>
      )}

      {!isFirstQuery && (
        <>
          <nav style={{ backgroundColor: '#1a1a1a' }} className="navbar navbar-dark fixed-top">
            <a className="navbar-brand" href="#">
              <img src="artificial-intelligence.png" width="30" height="30" className="d-inline-block align-top mr-2" alt="" />
              EduBot
            </a>
            <span style={{ fontWeight: 'bold' }} className="navbar-text d-none d-md-inline-block mx-auto">Ask Anything About Our Courses!</span>
            <div className="form-inline my-2 my-lg-0">
              <img src="user.png" width="40" height="40" className="d-inline-block align-top mr-2" alt="" />
            </div>
          </nav>

          <MessagesContainer>
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                {message.user ? (
                  <UserMessage>
                    <MessageText user>{message.text}</MessageText>
                    <img src="user.png" width="33" height="33" className="d-inline-block align-top ml-2 mt-1" alt="" />
                  </UserMessage>
                ) : (
                  <BotMessage>
                    <img src="artificial-intelligence.png" width="30" height="30" className="d-inline-block align-top ml-2 mt-1" alt="" />
                    <MessageText>{message.text}</MessageText>
                    {index === lastMessageIndex && ( // Only render feedback buttons for the last message
                      <FeedbackContainer>
                        <FeedbackButton onClick={() => handleFeedback('👍')} disabled={feedbackGiven}>👍</FeedbackButton>
                        <FeedbackButton onClick={() => handleFeedback('👎')} disabled={feedbackGiven}>👎</FeedbackButton>
                      </FeedbackContainer>
                    )}
                  </BotMessage>
                )}
              </React.Fragment>
            ))}

          </MessagesContainer>
        </>
      )}

      {isFirstQuery && (
        <Heading>The EduBot<img src="artificial-intelligence.png" width="50" height="50" className="d-inline-block align-top ml-2" alt="" /></Heading>
      )}

      <InputContainer prompt={isFirstQuery}>
        <Input
          style={{ backgroundColor: '#1a1a1a', boxShadow: '0px 0px 10px 0px #ffe390' }}
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={handleSubmit}
          isFirstQuery
          disabled={isSending}
        />
      </InputContainer>
      <ToastContainer />
    </ChatContainer>
  );
};

export default ChatInterface;

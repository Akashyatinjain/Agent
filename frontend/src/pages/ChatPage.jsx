import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../features/chat/ChatWindow';
import useChatStore from '../store/chatStore';

export const ChatPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const {
    currentConversationId,
    loadConversation,
    startNewChat,
    fetchConversations
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      loadConversation(conversationId);
    } else if (!conversationId && currentConversationId) {
      startNewChat();
    }
  }, [conversationId]);

  return <ChatWindow />;
};

export default ChatPage;

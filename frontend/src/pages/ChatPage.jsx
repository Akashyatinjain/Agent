import React, { useEffect } from 'react';
import ChatWindow from '../features/chat/ChatWindow';
import useChatStore from '../store/chatStore';
import { fetchConversationsApi } from '../api/chat';

export const ChatPage = () => {
  const { setConversations } = useChatStore();

  useEffect(() => {
    fetchConversationsApi()
      .then((res) => {
        if (res.success) setConversations(res.conversations);
      })
      .catch((e) => { });
  }, [setConversations]);

  return <ChatWindow />;
};

export default ChatPage;

import { create } from 'zustand';

export const useYoutubeStore = create((set) => ({
  currentVideo: null,
  videoHistory: [],
  chatMessages: [],
  isProcessing: false,
  processingStep: '',
  error: null,
  historyError: null,
  isHistoryLoading: false,
  isVideoLoading: false,
  setCurrentVideo: (currentVideo) => set({ currentVideo }),
  setVideoHistory: (videoHistoryOrUpdater) =>
    set((state) => ({
      videoHistory:
        typeof videoHistoryOrUpdater === 'function'
          ? videoHistoryOrUpdater(state.videoHistory)
          : videoHistoryOrUpdater,
    })),
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  updateChatMessage: (messageId, updates) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((message) =>
        message.id === messageId ? { ...message, ...updates } : message
      ),
    })),
  removeChatMessage: (messageId) =>
    set((state) => ({
      chatMessages: state.chatMessages.filter((message) => message.id !== messageId),
    })),
  clearChatMessages: () => set({ chatMessages: [] }),
  setProcessingState: (isProcessing, processingStep = '') =>
    set({ isProcessing, processingStep }),
  setError: (error) => set({ error }),
  setHistoryError: (historyError) => set({ historyError }),
  setHistoryLoading: (isHistoryLoading) => set({ isHistoryLoading }),
  setVideoLoading: (isVideoLoading) => set({ isVideoLoading }),
  resetYoutubeState: () =>
    set({
      currentVideo: null,
      videoHistory: [],
      chatMessages: [],
      isProcessing: false,
      processingStep: '',
      error: null,
      historyError: null,
      isHistoryLoading: false,
      isVideoLoading: false,
    }),
}));

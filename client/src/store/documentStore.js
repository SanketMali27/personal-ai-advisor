import { create } from 'zustand';

export const useDocumentStore = create((set) => ({
  documents: [],
  setDocuments: (documents) => set({ documents }),
  clearDocuments: () => set({ documents: [] }),
  updateDocument: (documentId, updates) =>
    set((state) => ({
      documents: state.documents.map((document) =>
        document._id === documentId ? { ...document, ...updates } : document
      ),
    })),
}));

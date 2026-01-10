import { create } from "zustand";
// Interface de l'utilisateur pour le chat store // 
interface User {
  id: string; 
  email: string;

}
// Inteface du chat store // 
interface ChatStore {
  user: User | null;
  setUser: (user: User | null) => void; 
} 

// fonction de création du chat Store qui permet de gérer l'utilisateur connecté au chat //
export const useChatStore = create<ChatStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user: user }),
}));


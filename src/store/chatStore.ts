import { create } from "zustand";
// Interface de l'utilisateur pour le chat store //
interface User {
  id: string;
  email: string;
}
// Inteface du store ChatStore qui permet de gérer l'utilisateur connecté au chat et le salon de chat //
interface ChatStore {
  user: User | null;
  setUser: (user: User | null) => void;
  // On ajpute le salon du chat dans le store ChatStore //
  currentRoom: Room | null;
  setCurrentRoom: (currentRoom: Room | null) => void;
}

// Interface du salon de chat dans le store ChatStore //
interface Room {
  id: number;
  name: string;
}

// fonction de création du chat Store qui permet de gérer l'utilisateur connecté au chat //
export const useChatStore = create<ChatStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user: user }),
  currentRoom: { id: 1, name: "Bienvenue sur Talk" },
  setCurrentRoom: (room: Room | null) => set({ currentRoom: room }),
}));

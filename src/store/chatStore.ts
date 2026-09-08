import { create } from "zustand";
// Interface de l'utilisateur pour le chat store //
interface User {
  id: string;
  email: string;
}

// Une discussion est soit un salon public, soit une conversation privée //
export type ChatTargetType = "room" | "conversation";

export interface ChatTarget {
  type: ChatTargetType;
  id: number;
  name: string;
}

// Inteface du store ChatStore qui permet de gérer l'utilisateur connecté au chat et la discussion active //
interface ChatStore {
  user: User | null;
  setUser: (user: User | null) => void;
  currentChat: ChatTarget | null;
  setCurrentChat: (currentChat: ChatTarget | null) => void;
}

// Interface d'un salon de discussion tel que stocké dans la table "rooms" //
export interface Room {
  id: number;
  name: string;
}

// fonction de création du chat Store qui permet de gérer l'utilisateur connecté au chat //
export const useChatStore = create<ChatStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user: user }),
  currentChat: { type: "room", id: 1, name: "Bienvenue sur Talk" },
  setCurrentChat: (currentChat: ChatTarget | null) => set({ currentChat }),
}));

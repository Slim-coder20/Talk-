# Logique de Gestion de l'Utilisateur

Ce document explique la logique utilisée pour gérer l'utilisateur dans l'application Talk.

## Architecture Globale

La gestion de l'utilisateur dans l'application repose sur une architecture à plusieurs couches :

1. **Supabase Auth** : Service d'authentification externe
2. **Zustand Store** : Gestion de l'état global de l'utilisateur
3. **App.tsx** : Composant principal qui synchronise Supabase et le store
4. **Auth.tsx** : Composant d'interface pour la connexion/inscription

## Flux d'Authentification

### 1. Initialisation de l'Application (App.tsx)

Au chargement de l'application, le composant `App.tsx` effectue deux actions principales :

#### a) Vérification de la Session Existante

```typescript
supabase.auth.getSession().then((response) => {
  const session = response.data.session;
  setUser({ 
    id: session?.user.id || "", 
    email: session?.user.email || "" 
  });
});
```

**Objectif** : Vérifier si une session active existe déjà (cas où l'utilisateur a rafraîchi la page ou est revenu sur l'application).

**Fonctionnement** :
- Appelle l'API Supabase pour récupérer la session courante
- Si une session existe, extrait les informations de l'utilisateur (id, email)
- Met à jour le store Zustand avec ces informations
- Utilise l'opérateur `?.` (optional chaining) et `||` pour gérer les cas où la session est nulle

#### b) Écoute des Changements d'État

```typescript
const { data } = supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    setUser({
      id: session.user.id || "",
      email: session.user.email || "",
    });
  } else {
    setUser(null);
  }
});
```

**Objectif** : Maintenir l'état de l'utilisateur synchronisé avec Supabase en temps réel.

**Fonctionnement** :
- S'abonne aux événements d'authentification de Supabase
- Se déclenche automatiquement lors de :
  - Connexion réussie
  - Déconnexion
  - Expiration de session
  - Rafraîchissement du token d'authentification
- Met à jour le store Zustand en fonction de l'état de la session
- Réinitialise le store à `null` si l'utilisateur se déconnecte

**Nettoyage** : Le hook `useEffect` retourne une fonction de nettoyage qui se désabonne lors du démontage du composant pour éviter les fuites mémoire.

### 2. Gestion de l'État Global (chatStore.ts)

Le store Zustand centralise l'état de l'utilisateur :

```typescript
interface User {
  id: string; 
  email: string;
}

interface ChatStore {
  user: User | null;
  setUser: (user: User | null) => void; 
}

export const useChatStore = create<ChatStore>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user: user }),
}));
```

**Avantages** :
- État global accessible depuis n'importe quel composant
- Réactif : tous les composants utilisant `useChatStore()` se mettent à jour automatiquement
- Simple et léger (alternative à Redux)
- Pas besoin de Provider au niveau de l'application

### 3. Interface d'Authentification (Auth.tsx)

Le composant `Auth.tsx` gère l'interface utilisateur pour :

#### a) Inscription

```typescript
const { error } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
});
```

**Fonctionnement** :
- Crée un nouveau compte utilisateur dans Supabase
- Envoie un email de confirmation (si configuré dans Supabase)
- Affiche un message de succès ou d'erreur via toast notifications

#### b) Connexion

```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: data.email,
  password: data.password,
});
```

**Fonctionnement** :
- Authentifie l'utilisateur avec email et mot de passe
- Si réussie, Supabase crée une session
- Le listener `onAuthStateChange` dans `App.tsx` détecte le changement
- Le store est automatiquement mis à jour
- L'utilisateur est redirigé vers l'interface principale

### 4. Affichage Conditionnel

Dans `App.tsx`, le rendu est conditionnel :

```typescript
if (!user) {
  return <Auth />;  // Affiche le formulaire de connexion/inscription
}

return (
  <>
    <ToastContainer />
    {/* Interface principale de l'application */}
  </>
);
```

**Logique** :
- Si `user` est `null` : afficher le composant `Auth`
- Si `user` existe : afficher l'interface principale de l'application

## Sécurité et Bonnes Pratiques

### Gestion des Erreurs

- Utilisation de l'opérateur `?.` (optional chaining) pour éviter les erreurs avec des valeurs nulles
- Vérification systématique de l'existence des sessions avant utilisation
- Messages d'erreur explicites affichés à l'utilisateur via toast notifications

### Prévention des Fuites Mémoire

- Désabonnement du listener `onAuthStateChange` lors du démontage du composant
- Utilisation appropriée du tableau de dépendances dans `useEffect`

### Synchronisation en Temps Réel

- L'écoute des changements d'état garantit que l'application reste synchronisée avec l'état d'authentification
- Utile pour gérer les cas où l'utilisateur se connecte depuis un autre onglet ou où la session expire

## Flux Complet d'Utilisation

1. **Premier chargement** :
   - `App.tsx` vérifie s'il existe une session active
   - Si non, affiche `Auth.tsx`
   - Si oui, met à jour le store et affiche l'interface principale

2. **Inscription** :
   - L'utilisateur remplit le formulaire dans `Auth.tsx`
   - `supabase.auth.signUp()` est appelé
   - Un email de confirmation est envoyé
   - (L'utilisateur doit confirmer son email pour se connecter)

3. **Connexion** :
   - L'utilisateur remplit le formulaire dans `Auth.tsx`
   - `supabase.auth.signInWithPassword()` est appelé
   - Supabase crée une session
   - `onAuthStateChange` détecte le changement
   - Le store est mis à jour avec les informations de l'utilisateur
   - `App.tsx` re-rend et affiche l'interface principale

4. **Navigation dans l'application** :
   - L'état `user` est disponible partout via `useChatStore()`
   - Tous les composants peuvent accéder aux informations de l'utilisateur

5. **Déconnexion** :
   - (À implémenter) Appel à `supabase.auth.signOut()`
   - `onAuthStateChange` détecte la déconnexion
   - Le store est réinitialisé à `null`
   - `App.tsx` re-rend et affiche à nouveau `Auth.tsx`

## Points d'Amélioration Futurs

1. **Gestion du rafraîchissement de token** : Supabase gère automatiquement le rafraîchissement, mais on pourrait ajouter une gestion explicite des erreurs
2. **Persistance locale** : Utiliser le localStorage pour améliorer l'expérience utilisateur
3. **Loading states** : Ajouter des états de chargement pendant la vérification de session
4. **Gestion de la déconnexion** : Implémenter un bouton de déconnexion et sa logique
5. **Gestion des erreurs réseau** : Ajouter une gestion des erreurs de connexion réseau

## Conclusion

La logique de gestion de l'utilisateur repose sur une synchronisation entre Supabase (source de vérité) et Zustand (état local de l'application). Cette architecture garantit une expérience utilisateur fluide et réactive tout en maintenant la sécurité et la cohérence des données.


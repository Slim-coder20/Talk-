import styles from "../styles/CreateRoom.module.css";
import "../index.css";
import logo from "../../public/discuter.png";
import { useForm } from "react-hook-form";
import { supabase } from "../supabaseClient";
import { useChatStore } from "../store/chatStore";
import { useNavigate } from "react-router";

// Interface définissant la structure des données du formulaire de création de salon
interface RoomFormData {
  name: string;
}

export const CreateRoom = () => {
  // Utilisation de react-hook-form pour gérer le formulaire et sa validation
  const {
    register, // Fonction pour enregistrer les champs du formulaire
    handleSubmit, // Fonction pour gérer la soumission du formulaire
    formState: { errors }, // État des erreurs de validation du formulaire
  } = useForm<RoomFormData>();

  // Hook React Router pour la navigation programmatique
  const navigate = useNavigate();

  // Fonction asynchrone exécutée lors de la soumission du formulaire
  const onCreateRoom = async (data: RoomFormData) => {
    // Insertion du nouveau salon dans la table rooms de Supabase
    // La méthode .select() permet de récupérer les données du salon créé (notamment l'ID généré)
    const { error, data: newRoom } = await supabase
      .from("rooms")
      .insert([
        {
          name: data.name, // Nom du salon saisi par l'utilisateur
        },
      ])
      .select();

    // Gestion des erreurs d'insertion
    if (error) {
      console.error(
        "Erreur lors de la création de nouveau salon",
        error.message
      );
    } else {
      // Si la création réussit, on récupère le salon créé (premier élément du tableau)
      const room = newRoom[0];
      // Mise à jour du store Zustand avec le nouveau salon comme salle actuelle
      // Utilisation de getState() pour accéder aux actions du store en dehors d'un composant
      useChatStore.getState().setCurrentRoom({ id: room.id, name: room.name });
      // Navigation vers la page principale (salon de discussion) après création réussie
      navigate("/");
    }
  };

  return (
    <div className={styles["create-room-container"]}>
      {/* En-tête de la page avec logo et titre */}
      <div className={styles["create-room-header"]}>
        <div className={styles["create-room-title-left"]}>
          <img src={logo} alt="logo" />
          <h2>Créer un nouveau salon</h2>
        </div>
      </div>
      {/* Formulaire de création de salon */}
      <form
        className={styles["create-room-form"]}
        onSubmit={handleSubmit(onCreateRoom)} // handleSubmit valide le formulaire avant d'appeler onCreateRoom
      >
        {/* Label et champ de saisie du nom du salon */}
        <label htmlFor="room-name">Nom du salon</label>
        <input
          id="room-name"
          type="text"
          placeholder="Entrez le nom du salon"
          {...register("name", { required: "Le nom du salon est requis " })} // Enregistrement du champ avec validation requise
        />
        {/* Affichage du message d'erreur si le champ est invalide */}
        {errors.name && <p className="error-text">{errors.name.message}</p>}
        {/* Bouton de soumission du formulaire */}
        <button type="submit">Créer le salon</button>
      </form>
    </div>
  );
};

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import "../index.css";
import logo from "../../public/discuter.png";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>();

  const password = watch("password");

  // Vérifier si l'utilisateur a un token valide au montage
  // Supabase traite automatiquement le hash dans l'URL (#access_token=...)
  useEffect(() => {
    const checkSession = async () => {
      // Attendre un peu pour que Supabase traite le hash de l'URL
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        toast.error("Lien de réinitialisation invalide ou expiré");
        setTimeout(() => navigate("/"), 2000);
      }
    };
    checkSession();
  }, [navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Vérifier que les mots de passe correspondent
    if (data.password !== data.confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    // Mettre à jour le mot de passe
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      setErrorMessage(error.message);
      toast.error(error.message);
      setIsLoading(false);
    } else {
      toast.success("Votre mot de passe a été modifié avec succès !");
      // Déconnecter l'utilisateur et rediriger vers la page de connexion
      await supabase.auth.signOut();
      navigate("/");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-container-left">
        <h1>
          <span>Talk</span>
          <img src={logo} alt="logo" className="logo-inline" />
        </h1>
        <p>
          Talk est une plateforme de discussion en direct Connectez-vous pour
          commencer à discuter avec vos amis.
        </p>
      </div>
      <div className="auth-container-right">
        <div className="auth-form-card">
          <h2>Nouveau mot de passe</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <label htmlFor="password">Nouveau mot de passe</label>
            <input
              type="password"
              id="password"
              placeholder="Votre nouveau mot de passe"
              {...register("password", {
                required: "Le mot de passe est requis",
                minLength: {
                  value: 6,
                  message:
                    "Le mot de passe doit contenir au moins 6 caractères",
                },
              })}
            />
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}

            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirmez votre nouveau mot de passe"
              {...register("confirmPassword", {
                required: "La confirmation est requise",
                validate: (value) =>
                  value === password ||
                  "Les mots de passe ne correspondent pas",
              })}
            />
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword.message}</p>
            )}

            {errorMessage && <p className="error-text">{errorMessage}</p>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
            </button>
          </form>
          <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button onClick={() => navigate("/")}>Se connecter</button>
          </p>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import "../../index.css";
import logo from "../../../public/discuter.png";
import { useForm } from "react-hook-form";
import { supabase } from "../../supabaseClient";
import { toast } from "react-toastify";

enum AuthType {
  login = "connexion",
  SignUp = "inscription",
  resetPassword = "mot de passe oublié",
}

interface AuthFormData {
  email: string;
  password?: string;
}

const Auth = () => {
  const [authType, setAuthType] = useState<AuthType>(AuthType.SignUp);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>();

  const onSubmit = async (data: AuthFormData) => {
    // Authentification
    setAuthErrorMessage(null);
    if (authType === AuthType.login) {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password || "",
      });
      if (error) setAuthErrorMessage(error.message);
    } else if (authType === AuthType.resetPassword) {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setAuthErrorMessage(error.message);
        toast.error(error.message);
      } else {
        toast.success(
          "Un email de réinitialisation a été envoyé à votre adresse email"
        );
        setAuthType(AuthType.login);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password || "",
      });
      if (error) {
        setAuthErrorMessage(error.message);
        toast.error(error.message);
      } else {
        toast.success(
          "Inscription réussie ! Un mail de confirmation a été envoyé à votre email"
        );
      }
    }
  };

  return (
    <div className="auth-container">
      {/* left conatiner with logo and description */}
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
      {/* right conatiner with form */}
      <div className="auth-container-right">
        <div className="auth-form-card">
          <h2>
            {authType === AuthType.login
              ? "Connexion"
              : authType === AuthType.resetPassword
              ? "Mot de passe oublié"
              : "Inscription"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="votre email ... "
              {...register("email", { required: "Email est requis" })}
            />
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
            {authType !== AuthType.resetPassword && (
              <>
                <label htmlFor="password">Mot de passe </label>
                <input
                  type="password"
                  id="password"
                  placeholder="votre mot de passe "
                  {...register("password", {
                    required: "mot de passe est requis",
                  })}
                />
                {errors.password && (
                  <p className="error-text">{errors.password.message}</p>
                )}
              </>
            )}
            {authErrorMessage && (
              <p className="error-text">{authErrorMessage}</p>
            )}
            {/* Bouton pour soumettre le formulaire */}
            <button type="submit">
              {authType === AuthType.login
                ? "Se connecter"
                : authType === AuthType.resetPassword
                ? "Envoyer le lien de réinitialisation"
                : "S'inscrire"}
            </button>
          </form>
          <div className="auth-container-right">
            {/* On créer une condition pour afficher soit inscription, connexion ou réinitialisation */}
            {authType === AuthType.login ? (
              <>
                <p>
                  Vous n'avez pas de compte ?{" "}
                  <button onClick={() => setAuthType(AuthType.SignUp)}>
                    Inscription
                  </button>
                </p>
                <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
                  <button onClick={() => setAuthType(AuthType.resetPassword)}>
                    Mot de passe oublié ?
                  </button>
                </p>
              </>
            ) : authType === AuthType.resetPassword ? (
              <p>
                Vous vous souvenez de votre mot de passe ?{" "}
                <button onClick={() => setAuthType(AuthType.login)}>
                  Se connecter
                </button>
              </p>
            ) : (
              <p>
                Vous avez déjà un compte?{" "}
                <button onClick={() => setAuthType(AuthType.login)}>
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;

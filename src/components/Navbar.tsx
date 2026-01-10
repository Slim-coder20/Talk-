import { Link } from "react-router";
import style from "./Navbar.module.css";
import logo from "../../public/discuter.png";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
export const Navbar = () => {
  // useNavigate pour naviger entre les pages //
  const navigate = useNavigate();
  // fonction pour se déconnecter en appellant la fonction signOut de supabase //
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Vous avez été déconnecté");
    navigate("/");
  };
  return (
    <nav className={style["navbar-container"]}>
      <Link to="/" className={style["navbar-container-left"]}>
        <img src={logo} alt="logo" />
        <span>Talk</span>
      </Link>
      <ul className={style["navbar-container-right"]}>
        <li>
          <Link to="/">Salon de discussion</Link>
        </li>
        <li>
          <Link to="/rooms">Les salons</Link>
        </li>
        <li>
          <Link to="/create-room">Créer une nouvelle salon</Link>
        </li>
      </ul>
      <div className={style["navbar-container-right-auth"]}>
        <button
          onClick={() => handleLogout()}
          className={style["navbar-container-right-auth-button"]}
        >
          Deconnexion
        </button>
      </div>
    </nav>
  );
};

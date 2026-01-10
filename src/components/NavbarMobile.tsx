import { useState } from "react";
import { Link } from "react-router";
import style from "./Navbar.module.css";
import logo from "../../public/discuter.png";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";

export const NavbarMobile = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Vous avez été déconnecté");
    navigate("/");
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className={style["navbar-mobile-container"]}>
        <Link to="/" className={style["navbar-container-left"]}>
          <img src={logo} alt="logo" />
          <span>Talk</span>
        </Link>
        <button
          className={`${style["menu-burger"]} ${
            isMenuOpen ? style["menu-burger-active"] : ""
          }`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      {/* Overlay */}
      {isMenuOpen && (
        <div className={style["menu-overlay"]} onClick={closeMenu}></div>
      )}

      {/* Menu latéral */}
      <div
        className={`${style["mobile-menu"]} ${
          isMenuOpen ? style["mobile-menu-open"] : ""
        }`}
      >
        <ul className={style["mobile-menu-list"]}>
          <li>
            <Link to="/" onClick={closeMenu}>
              Salon de discussion
            </Link>
          </li>
          <li>
            <Link to="/rooms" onClick={closeMenu}>
              Les salons
            </Link>
          </li>
          <li>
            <Link to="/create-room" onClick={closeMenu}>
              Créer une nouvelle salon
            </Link>
          </li>
          <li className={style["mobile-menu-logout"]}>
            <button
              onClick={handleLogout}
              className={style["navbar-container-right-auth-button"]}
            >
              Déconnexion
            </button>
          </li>
        </ul>
      </div>
    </>
  );
};

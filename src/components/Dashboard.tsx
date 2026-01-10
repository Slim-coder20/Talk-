import { useState, useEffect } from "react";
import { Routes, Route } from "react-router";
import { ChatRoom } from "../pages/ChatRoom";
import { CreateRoom } from "../pages/CreateRoom";
import { RoomList } from "../pages/RoomList";
import { Navbar } from "./Navbar";
import { NavbarMobile } from "./NavbarMobile";
import "../components/Navbar.module.css";

export const Dashboard = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <section className="chat-app">
      {isMobile ? <NavbarMobile /> : <Navbar />}

      <Routes>
        <Route path="/" element={<ChatRoom />} />
        <Route path="/rooms" element={<RoomList />} />
        <Route path="/create-room" element={<CreateRoom />} />
      </Routes>
    </section>
  );
};

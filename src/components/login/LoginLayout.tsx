import React from "react";
import { LoginImage } from "./LoginImage";
import { LoginForm } from "./LoginForm";

export const LoginLayout: React.FC = () => {
  return (
    <main className="bg-white overflow-hidden min-h-screen">
      <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
        <LoginImage />
        <LoginForm />
      </div>
    </main>
  );
};

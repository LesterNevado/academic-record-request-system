import React from "react";
import { LoginForm } from "./LoginForm";

export const LoginLayout: React.FC = () => {
  return (
    <main className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 min-h-screen flex items-center justify-center">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-600/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '8s' }}></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
             
        {/* Concentric Circles */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="absolute border border-blue-300/20 rounded-full animate-pulse"
              style={{
                width: `${(i + 1) * 15}%`, 
                height: `${(i + 1) * 15}%`,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${3 + i * 0.5}s`
              }}
            />
          ))}
        </div>
        
        {/* Floating Particles */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-blue-400/20 rounded-full blur-sm animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-6 h-6 bg-blue-400/10 rounded-full blur-sm animate-pulse" 
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-8 h-8 bg-blue-300/10 rounded-full blur-sm animate-pulse" 
             style={{ animationDuration: '5s' }}></div>
        <div className="absolute bottom-20 right-20 w-5 h-5 bg-blue-500/10 rounded-full blur-sm animate-pulse" 
             style={{ animationDuration: '3s' }}></div>
      </div>

      {/* Main Content */}
      <LoginForm />
    </main>
  );
};
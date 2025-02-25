import React from "react";

export const LoginForm: React.FC = () => {
  const handleGoogleLogin = () => {
    console.log("Google login clicked");
  };

  return (
    <section className="w-6/12 max-md:w-full relative min-h-screen" aria-label="Login form">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0047AB] to-[#1CA9C9] scale-x-110 rounded-[40px_0px_0px_40px] max-md:rounded-none min-h-screen"></div>
      <div className="relative flex grow flex-col items-center justify-center px-20 py-[210.5px] max-md:max-w-full max-md:px-5 max-md:py-[100px] w-full min-h-screen">
        <div className="flex w-[400px] max-w-full flex-col items-center">
          <a href="https://www.neu.edu.ph/" target="_blank" rel="noopener noreferrer" className="self-center">
            <img
              src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73?placeholderIfAbsent=true"
              alt="NEU Logo"
              className="aspect-[1] object-contain w-[100px] max-w-full cursor-pointer"
            />
          </a>

          <h1 className="text-white text-[35px] font-bold text-center mt-[100px] max-md:max-w-full max-md:mt-10 leading-tight">
            Welcome to
            <span className="block text-center whitespace-nowrap">Academic Record Request System</span>
            <span className="block text-center mt-0">(ARRS)</span>
          </h1>

          <button
            onClick={handleGoogleLogin}
            className="bg-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)] border flex w-full flex-col text-xl text-black font-semibold justify-center mt-[126px] px-[47px] py-5 rounded-[20px] border-[rgba(0,0,0,0.2)] border-solid max-md:max-w-full max-md:mt-10 max-md:px-5 hover:bg-gray-50 transition-colors"
            aria-label="Sign in with Google"
          >
            <div className="flex items-stretch gap-[34px]">
              <img
                src="https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/853685cd2d6bd5bcdb1e4bd4db33a67b0ac2f87224df786eb0451986d789067a?placeholderIfAbsent=true"
                alt="Google logo"
                className="aspect-[0.96] object-contain w-12 shrink-0"
              />
              <span className="basis-auto my-auto">Continue with Google</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
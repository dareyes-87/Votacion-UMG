import { Link } from "react-router-dom";


export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 text-white">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 drop-shadow">
        Bienvenido a la plataforma de votaciones
      </h1>

      <p className="text-lg text-white/80 mb-8 max-w-xl">
        Puedes votar sin cuenta o iniciar sesión para crear y gestionar tus propios eventos.
      </p>

      <Link
        to="/votar"
        className="bg-white text-indigo-600 font-medium py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-md"
      >
        Votar ahora
      </Link>
    </div>
  );
}


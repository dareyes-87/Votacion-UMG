// src/components/Navbar.tsx
import { Link } from "react-router-dom";

interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface NavbarProps {
  navItems: NavItem[];
}

const Navbar: React.FC<NavbarProps> = ({ navItems }) => {
  return (
    <header className="bg-[#1b142a]/80 backdrop-blur-md text-white fixed top-0 w-full z-50 shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="font-bold text-xl text-white">🗳️ Votaciones UMG</h1>
        <nav className="flex flex-wrap items-center gap-6">
          {navItems.map((item, index) =>
            item.onClick ? (
              <button
                key={index}
                onClick={item.onClick}
                className="text-sm hover:text-indigo-400 transition-colors"
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={index}
                to={item.href || "#"}
                className="text-sm hover:text-indigo-400 transition-colors"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;


import { NavLink } from "@/components/NavLink";

const Navigation = () => {
  const scrollToZKPFPs = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById("zkpfps-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="w-full py-4 px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-8">
        <NavLink
          to="/"
          className="text-foreground/60 hover:text-foreground transition-colors font-mono text-sm"
          activeClassName="text-foreground"
        >
          Take Photo
        </NavLink>
        <NavLink
          to="/how-to-use"
          className="text-foreground/60 hover:text-foreground transition-colors font-mono text-sm"
          activeClassName="text-foreground"
        >
          How To Use
        </NavLink>
        <a
          href="#zkpfps-section"
          onClick={scrollToZKPFPs}
          className="text-foreground/60 hover:text-foreground transition-colors font-mono text-sm"
        >
          zkPFPs
        </a>
      </div>
    </nav>
  );
};

export default Navigation;

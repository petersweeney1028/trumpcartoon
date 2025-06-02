import { Link } from "wouter";

const Navbar = () => {
  return (
    <nav className="bg-background py-4 border-b border-accent/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white mr-2">
                <span className="font-bold">R</span>
              </div>
              <span className="text-2xl font-heading tracking-wider text-dark">
                ROT.CLUB
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/about"
              className="px-5 py-2 rounded-md bg-accent/20 font-medium text-dark hover:bg-accent/40 transition-colors"
            >
              ABOUT
            </Link>
            <Link
              href="/"
              className="px-5 py-2 rounded-md bg-primary text-white font-medium hover:bg-primary/80 transition-colors"
            >
              GENERATE
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

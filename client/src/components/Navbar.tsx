import { Link } from "wouter";

const Navbar = () => {
  return (
    <nav className="bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8 text-dark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 0H18C18.621 15.75 18.75 15.246 18.75 14.625m-1.5 0h-7.5m7.5 0c.621 0 1.125.504 1.125 1.125"
                />
              </svg>
              <span className="ml-2 text-xl font-bold font-heading text-dark">
                RemixTalk
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            <Link
              href="/explore"
              className="px-3 py-2 rounded-md text-dark font-medium hover:bg-yellow-400 transition-colors"
            >
              Explore Remixes
            </Link>
            <Link
              href="/"
              className="ml-4 px-3 py-2 rounded-md text-white bg-secondary font-medium hover:bg-blue-600 transition-colors"
            >
              Create New
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

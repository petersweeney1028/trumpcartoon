const Footer = () => {
  return (
    <footer className="bg-dark text-white py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 0H18C18.621 15.75 18.75 15.246 18.75 14.625m-1.5 0h-7.5m7.5 0c.621 0 1.125.504 1.125 1.125"
                />
              </svg>
              <span className="ml-2 text-xl font-bold font-heading">
                Rot.Club
              </span>
            </div>
            <p className="text-gray-400 max-w-md">
              Create hilarious political cartoon rots with AI-generated
              dialogue. Share with friends and see what everyone's talking about.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">About</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/how-it-works"
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    How it Works
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    About
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://x.com/peter_sweeney0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    X
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-center">© {new Date().getFullYear()} Rot.Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
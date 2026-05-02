import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  selectIsAuthenticated,
  selectCurrentUser,
  logout,
} from "@/store/slices/authSlice";
import {
  ChevronDown,
  Search,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const exploreModules = [
  {
    title: "Vector Algebra",
    items: [
      { name: "Scalars and Vectors", path: "/scalars-and-vectors" },
      { name: "Addition", path: "/vector-addition" },
      { name: "Multiplication", path: "/vector-multiplication" },
      { name: "Triple Product", path: "/triple-product" },
    ],
  },
  {
    title: "Vector Calculus",
    items: [
      { name: "Cylindrical Coordinates", path: "/cylindrical-coordinates" },
      { name: "Spherical Coordinates", path: "/spherical-coordinates" },
      { name: "Cartesian, Cylindrical and Spherical",
        path: "/cartesian-cylindrical-spherical",
      },
      {
        name: "Differential Length, Area and Volume",
        path: "/vector-calculus-intro",
      },
      { name: "Del Operator", path: "/del-operator" },
    ],
  },
  {
    title: "Electrostatics",
    items: [
      { name: "Intro", path: "/electrostatics-intro" },
      {
        name: "Electric Field & Flux",
        path: "/electric-field-and-flux-density",
      },
      // { name: "Field Operations", path: "/field-operations" },
      { name: "Electric Potential", path: "/electric-potential" },
      // { name: "Gauss Law", path: "/gauss-law" },
      { name: "Electric Dipole", path: "/electric-dipole" },
    ],
  },
  {
    title: "Maxwell Equations",
    items: [
      { name: "Gauss Law", path: "/gauss-law-contd" },
      { name: "Gauss Law Magnetism", path: "/gauss-law-magnetism" },
      { name: "Faraday Law", path: "/faraday-law" },
      { name: "Ampere Law", path: "/ampere-law" },
      { name: "Displacement Current", path: "/displacement-current" },
      { name: "Time Varying Potential", path: "/time-varying-potential" },
      { name: "EMF", path: "/transformer-motional-emf" },
    ],
  },
  {
    title: "Wave Propagation",
    items: [
      { name: "Types of Waves", path: "/types-of-waves" },
      { name: "Wave Power Energy", path: "/wave-power-energy" },
      { name: "Plane Wave Analysis", path: "/plane-wave-analysis" },
      { name: "Wave Reflection", path: "/wave-reflection" },
    ],
  },
  {
    title: "Transmission Lines",
    items: [
      { name: "Types of Transmission Lines", path: "/types-of-transmission-line" },
      { name: "Characteristic Impedance", path: "/characteristic-impedance" },
      { name: "Smith Chart", path: "/smith-chart" },
    ],
  },
];

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [showExplore, setShowExplore] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ name: string; path: string; module: string }>
  >([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [expandedModules, setExpandedModules] = useState<
    Record<string, boolean>
  >({});
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Debug logging
  console.log("Navbar - isAuthenticated:", isAuthenticated);
  console.log("Navbar - user:", user);

  // Create a flattened array of all items for searching
  const allItems = exploreModules.flatMap((module) =>
    module.items.map((item) => ({
      ...item,
      module: module.title,
    })),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !(dropdownRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setShowExplore(false);
      }
      if (
        userDropdownRef.current &&
        !(userDropdownRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
      if (
        searchRef.current &&
        !(searchRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
      if (
        mobileMenuRef.current &&
        !(mobileMenuRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filteredResults = allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.module.toLowerCase().includes(query.toLowerCase()),
    );

    setSearchResults(filteredResults);
    setShowSearchResults(true);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(searchQuery);
    }
  };

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setShowSearchResults(false);
    setSearchQuery("");
    setShowMobileSearch(false);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(logout());
    navigate("/login");
    setShowUserDropdown(false);
    setShowMobileMenu(false);
  };

  const handleUserDashboard = () => {
    if (user?.isAdmin === true) {
      navigate("/profilepage");
    } else {
      navigate("/userdashboard");
    }
    setShowUserDropdown(false);
    setShowMobileMenu(false);
  };

  const handleSettings = () => {
    navigate("/settings");
    setShowUserDropdown(false);
    setShowMobileMenu(false);
  };

  const toggleModuleExpansion = (moduleTitle: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleTitle]: !prev[moduleTitle],
    }));
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    setShowMobileMenu(false);
  };

  return (
    <header className="bg-white fixed top-0 left-0 w-full z-50 border-b border-gray-200 font-sans">
      <div className="max-w-[1400px] mx-auto h-[72px] flex items-center justify-between px-5 text-[18px] text-[#1a1a1a]">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center gap-6 relative">
                  {/* Desktop Center Logo */}
        <div
          className="hidden md:flex items-center gap-2 ml-[-5px] cursor-pointer"
          onClick={() => {
            if (!isAuthenticated) {
              navigate("/");
            } else if (user?.isAdmin === true) {
              navigate("/profilepage");
            } else {
              navigate("/userdashboard");
            }
          }}
        >
          <img src="/fwvlab.png" alt="Logo" className="h-10 w-11" />
          <h1 className="text-[#a00032] font-lato font-bold text-[18px]">
            Fields and Waves Visualization Lab
          </h1>
        </div>

{/* Explore Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setShowExplore(true)}
            onMouseLeave={() => setShowExplore(false)}
          >
            <button
              className={`text-[#2563eb] font-semibold text-[16px] px-3 py-1.5 flex items-center gap-1 rounded-md transition-colors duration-150 hover:bg-blue-50
              ${showExplore ? "bg-blue-50" : ""}
              `}
              onClick={() => setShowExplore(true)}
            >
              Explore <ChevronDown size={16} />
            </button>

            {showExplore && (
              <>
                <div
                  className="absolute left-0 top-full h-6 w-full"
                  aria-hidden="true"
                />
                
                {/* 1. Outer container: Full width background */}
                <div className="fixed left-0 top-[72px] w-full bg-white border-y border-gray-200 shadow-xl z-50">
                  
                  {/* 2. Inner container: Centered content matching your header's width */}
                  <div className="max-w-[1400px] mx-auto w-full flex justify-center gap-12 p-6 text-sm overflow-x-auto">
                    {exploreModules.map((mod, i) => (
                      <div key={i} className="min-w-fit">
                        <h4
                          className="text-[#1a1a1a] font-semibold mb-2 text-[16px] leading-[1.2] cursor-pointer hover:underline"
                          onClick={() => {
                            navigate(
                              `/module/${mod.title.toLowerCase().replace(/\s+/g, "-")}`,
                            );
                            setShowExplore(false);
                          }}
                        >
                          {mod.title}
                        </h4>
                        <ul className="space-y-2">
                          {mod.items.map((sub, j) => (
                            <li
                              key={j}
                              className="text-[#2563eb] text-[16px] py-1 hover:underline cursor-pointer"
                              onClick={() => {
                                navigate(sub.path);
                                setShowExplore(false);
                              }}
                            >
                              {sub.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Desktop Search */}
          <div
            ref={searchRef}
            className="flex items-center border border-[#0f172a] rounded-3xl px-3 py-1.5 relative"
          >
            <Search size={18} className="text-[#2563eb] mr-2" />
            <input
              type="text"
              placeholder="What do you want to learn?"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="outline-none text-[16px] text-[#2563eb] bg-transparent w-96 font-normal"
            />

            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-[45px] left-0 w-[300px] bg-white border border-gray-200 shadow-xl max-h-[400px] overflow-y-auto z-50">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSearchResultClick(result.path)}
                  >
                    <div className="text-[#2563eb] text-[14px] font-medium hover:underline">
                      {result.name}
                    </div>
                    <div className="text-[#666] text-[12px] mt-1">
                      {result.module}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results Message */}
            {showSearchResults &&
              searchResults.length === 0 &&
              searchQuery.trim() !== "" && (
                <div className="absolute top-[45px] left-0 w-[300px] bg-white border border-gray-200 shadow-xl z-50">
                  <div className="px-4 py-3 text-[#666] text-[14px]">
                    No results found for "{searchQuery}"
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Mobile Layout - Left Side */}
        <div className="flex md:hidden items-center gap-3">
          {/* Logo and Name */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (!isAuthenticated) {
                navigate("/");
              } else if (user?.isAdmin === true) {
                navigate("/profilepage");
              } else {
                navigate("/userdashboard");
              }
            }}
          >
            <img src="/fwvlab.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-[#a00032] font-lato font-bold text-[14px] leading-tight">
              Fields and Waves
              <br />
              Visualization Lab
            </h1>
          </div>
        </div>

        {/* Mobile Layout - Right Side */}
        <div className="flex md:hidden items-center gap-3">
          {/* Search Icon */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="text-[#2563eb] p-1"
          >
            <Search size={20} />
          </button>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="text-[#2563eb] p-1"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Desktop Right Section */}
        <div className="hidden md:flex items-center gap-4 text-[16px] font-semibold">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="text-[#2563eb] hover:underline"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="border-2 border-blue-500 hover:bg-blue-50 text-[#2563eb] px-3 py-1.5 rounded-xl text-[16px]"
              >
                Sign up
              </button>
            </>
          ) : (
            user && (
              <div ref={userDropdownRef} className="relative">
                <button
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-1 font-medium transition-colors"
                >
                  <div className="w-6 h-6 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex items-center gap-1 text-[#2563eb] font-semibold text-[17px]">
                    <span>{user.name}</span>
                    <ChevronDown size={14} />
                  </div>
                </button>

                {showUserDropdown && (
                  <div className="absolute top-[45px] right-0 w-48 bg-white border border-gray-200 shadow-xl rounded-lg py-1 z-50">
                    <button
                      onClick={handleUserDashboard}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} />
                      {user?.isAdmin === true ? "Dashboard" : "Dashboard"}
                    </button>

                    <button
                      onClick={handleSettings}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </button>

                    <div className="border-t border-gray-100 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileSearch(false)}
                className="text-[#2563eb] p-1"
              >
                <X size={20} />
              </button>
              <div className="flex-1 flex items-center border border-[#0f172a] rounded px-3 py-2">
                <Search size={18} className="text-[#2563eb] mr-2" />
                <input
                  type="text"
                  placeholder="Search for courses, skills, and more"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                  className="outline-none text-[16px] text-[#2563eb] bg-transparent flex-1 font-medium"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Mobile Search Results */}
          <div className="flex-1 overflow-y-auto">
            {searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSearchResultClick(result.path)}
                >
                  <div className="text-[#2563eb] text-[14px] font-medium">
                    {result.name}
                  </div>
                  <div className="text-[#666] text-[12px] mt-1">
                    {result.module}
                  </div>
                </div>
              ))
            ) : searchQuery.trim() !== "" ? (
              <div className="px-4 py-3 text-[#666] text-[14px]">
                No results found for "{searchQuery}"
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Mobile Menu Modal */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-white z-50 md:hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/fwvlab.png" alt="Logo" className="h-8 w-8" />
                <h1 className="text-[#a00032] font-lato font-bold text-[14px] leading-tight">
                  Fields and Waves
                  <br />
                  Visualization Lab
                </h1>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="text-[#2563eb] p-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Authentication Section */}
            {!isAuthenticated ? (
              <div className="mb-6 pb-4 border-b border-gray-200">
                <button
                  onClick={() => handleMobileNavigation("/login")}
                  className="w-full text-left py-3 text-[#2563eb] font-medium text-[16px] hover:underline"
                >
                  Log in
                </button>
                <button
                  onClick={() => handleMobileNavigation("/signup")}
                  className="w-full text-left py-3 text-[#2563eb] font-medium text-[16px] hover:underline"
                >
                  Sign up
                </button>
              </div>
            ) : (
              user && (
                <div className="mb-6 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-[#2563eb] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="text-[#2563eb] font-semibold text-[16px]">
                      {user.name}
                    </span>
                  </div>
                  <button
                    onClick={handleUserDashboard}
                    className="w-full text-left py-2 text-gray-700 font-medium hover:text-[#2563eb]"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleSettings}
                    className="w-full text-left py-2 text-gray-700 font-medium hover:text-[#2563eb]"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-red-600 font-medium hover:text-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              )
            )}

            {/* Modules Section */}
            <div className="space-y-2">
              {exploreModules.map((module, index) => (
                <div
                  key={index}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <button
                    onClick={() => toggleModuleExpansion(module.title)}
                    className="w-full flex items-center justify-between py-3 text-left text-[#1a1a1a] font-semibold text-[16px] hover:text-[#2563eb]"
                  >
                    <span>{module.title}</span>
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform ${
                        expandedModules[module.title] ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {expandedModules[module.title] && (
                    <div className="pb-3 pl-4">
                      {module.items.map((item, itemIndex) => (
                        <button
                          key={itemIndex}
                          onClick={() => handleMobileNavigation(item.path)}
                          className="w-full text-left py-2 text-[#2563eb] text-[14px] hover:underline"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

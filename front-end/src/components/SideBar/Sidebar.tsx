import {
  FaHome,
  FaFire,
  FaChartLine,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { toggleSidebar } from "../../store/responsive/responsiveSlice";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const dispatch = useDispatch();
  const typeDevice = useSelector((state: RootState) => state.responsive);

  const handleToggle = () => {
    dispatch(toggleSidebar());
  };

  const handleClose = () => {
    if (typeDevice.type !== "PC") {
      dispatch(toggleSidebar());
    }
  };

  const redditNavItems = [
    { name: "Home", icon: FaHome, path: "/" },
    { name: "Popular", icon: FaFire, path: "/popular" },
    { name: "Trending", icon: FaChartLine, path: "/trending" },
  ];

  const sampleCommunities = [
    { name: "r/programming", color: "bg-blue-500" },
    { name: "r/webdev", color: "bg-green-500" },
    { name: "r/react", color: "bg-cyan-500" },
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-[15%] left-0 bottom-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          typeDevice.type === "PC"
            ? typeDevice.isOpen
              ? "w-64"
              : "w-16"
            : typeDevice.isOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full"
        }`}
      >
        {/* Toggle button cho PC */}
        {typeDevice.type === "PC" && (
          <button
            onClick={handleToggle}
            className="absolute -right-3 top-6 z-40 bg-white border border-gray-200 rounded-full p-1.5 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 hover:scale-110"
          >
            {typeDevice.isOpen ? (
              <FaChevronLeft className="w-3 h-3 text-gray-600" />
            ) : (
              <FaChevronRight className="w-3 h-3 text-gray-600" />
            )}
          </button>
        )}

        <div className="h-full overflow-hidden">
          <div className="p-4">
            {/* Main Navigation */}
            <nav className="space-y-1">
              {redditNavItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  onClick={handleClose}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 group ${
                    typeDevice.type === "PC" && !typeDevice.isOpen
                      ? "justify-center"
                      : ""
                  }`}
                >
                  <item.icon className="flex-shrink-0 w-5 h-5 transition-transform duration-200 group-hover:scale-110" />

                  <span
                    className={`font-medium transition-all duration-300 ${
                      typeDevice.type === "PC" && !typeDevice.isOpen
                        ? "opacity-0 w-0 overflow-hidden"
                        : "opacity-100"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Divider */}
            <div
              className={`transition-all duration-300 ${
                typeDevice.type === "PC" && !typeDevice.isOpen
                  ? "opacity-0 h-0 my-0"
                  : "opacity-100 my-4"
              }`}
            >
              <hr className="border-gray-200" />
            </div>

            {/* Recent Communities */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                typeDevice.type === "PC" && !typeDevice.isOpen
                  ? "opacity-0 max-h-0"
                  : "opacity-100 max-h-96"
              }`}
            >
              <div className="space-y-2">
                <h3 className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Recent Communities
                </h3>

                {sampleCommunities.map((community, index) => (
                  <Link
                    key={index}
                    to={`/${community.name}`}
                    onClick={handleClose}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 group ${
                      typeDevice.type === "PC" && !typeDevice.isOpen
                        ? "justify-center"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-6 h-6 ${community.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
                    >
                      {community.name.charAt(2).toUpperCase()}
                    </div>

                    <span
                      className={`text-sm transition-all duration-300 ${
                        typeDevice.type === "PC" && !typeDevice.isOpen
                          ? "opacity-0 w-0 overflow-hidden"
                          : "opacity-100"
                      }`}
                    >
                      {community.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Collapsed community icons */}
            {typeDevice.type === "PC" && !typeDevice.isOpen && (
              <div className="mt-6 space-y-3">
                {sampleCommunities.slice(0, 3).map((community, index) => (
                  <Link
                    key={`collapsed-${index}`}
                    to={`/${community.name}`}
                    className="flex justify-center group"
                    title={community.name}
                  >
                    <div
                      className={`w-8 h-8 ${community.color} rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:scale-110 transition-all duration-200 shadow-sm hover:shadow-md`}
                    >
                      {community.name.charAt(2).toUpperCase()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

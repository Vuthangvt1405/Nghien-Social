import images from "../../constants";
import { IoMdNotificationsOutline } from "react-icons/io";
import { FaBars } from "react-icons/fa6";
import { HiOutlinePlusCircle } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { setType, toggleSidebar } from "../../store/responsive/responsiveSlice";
import { useEffect } from "react";
import AvatarDropdown from "./AvatarDropdown";
import SearchBar from "./SearchBar";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const typeDevice = useSelector((state: RootState) => state.responsive);
  const info = useSelector((state: RootState) => state.user);
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleOpen = () => {
    dispatch(toggleSidebar());
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        dispatch(setType("Mobile"));
      } else if (window.innerWidth >= 1024) {
        dispatch(setType("PC"));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-[15%] bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section */}
        <div className="flex items-center space-x-2">
          {/* Mobile hamburger */}
          {(typeDevice.type === "Tablet" || typeDevice.type === "Mobile") && (
            <button
              className="p-2 text-gray-600 rounded-md hover:bg-gray-100"
              onClick={handleOpen}
            >
              <FaBars size={16} />
            </button>
          )}

          {/* Logo */}
          <Link
            to={`${import.meta.env.VITE_URL_BASE_WEB}/`}
            className="flex items-center"
          >
            <div className="flex items-center justify-center w-12 rounded-full">
              <img src={images.Logo} alt="" />
            </div>
            <span className="hidden text-xl font-bold sm:block">
              Nghien Social
            </span>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4">
          <SearchBar />
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-2">
          {/* Create post button */}
          <Link
            to="/submit"
            className="flex items-center px-3 py-1 space-x-1 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
          >
            <HiOutlinePlusCircle size={20} />
            <span>Create</span>
          </Link>

          {/* Notifications */}
          <button className="p-2 text-gray-600 rounded-md hover:bg-gray-100">
            <IoMdNotificationsOutline size={20} />
          </button>

          {/* Auth buttons or Avatar */}
          {!info.username ? (
            <div className="flex space-x-2">
              <Link
                to={`${import.meta.env.VITE_URL_BASE_WEB}/login`}
                className="px-4 py-1 text-sm font-medium text-orange-500 border border-orange-500 rounded-full hover:bg-orange-50"
              >
                Log In
              </Link>
              <Link
                to={`${import.meta.env.VITE_URL_BASE_WEB}/register`}
                className="px-4 py-1 text-sm font-medium text-white bg-orange-500 rounded-full hover:bg-orange-600"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <AvatarDropdown
              avatarSrc={info.avatar || ""}
              options={[
                { label: "Account", to: `/info/${info.username}` },
                { label: "Settings", to: "/settings" },
              ]}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../../store/store";
import { logout } from "../../store/user/userSlice";

type DropdownOption = {
  label: string;
  to: string;
};

type AvatarDropdownProps = {
  avatarSrc: string;
  options: DropdownOption[];
};

const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  avatarSrc,
  options,
}) => {
  const dispatch = useDispatch();

  const hanldeLogOut = () => {
    dispatch(logout());
  };

  const infoUser = useSelector((state: RootState) => state.user);

  return (
    <div className="relative inline-block group">
      {/* Avatar Image */}
      <img
        src={avatarSrc}
        alt="avatar"
        className="w-10 h-10 transition duration-300 border-2 border-orange-400 rounded-full shadow-md cursor-pointer group-hover:scale-105"
      />

      {/* Triangle Pointer */}
      <div className="absolute right-3 mt-2 hidden group-hover:block w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white z-30"></div>

      {/* Dropdown Box */}
      <div className="absolute right-0 z-20 flex-col hidden mt-1 bg-white border border-gray-200 rounded-md shadow-xl min-w-36 group-hover:flex animate-fade-in-down">
        {infoUser ? (
          <div className="p-4">
            <span className="mb-1 font-bold text-md">{infoUser.username}</span>
            <p className="text-sm opacity-60">{infoUser.email}</p>
          </div>
        ) : (
          <></>
        )}
        {options.map((option, index) => (
          <Link
            key={index}
            to={option.to}
            className="px-4 py-2 text-sm text-gray-800 transition-all duration-200 hover:bg-orange-100 hover:text-orange-600"
          >
            {option.label}
          </Link>
        ))}
        <Link
          to={"/"}
          onClick={hanldeLogOut}
          className="px-4 py-2 text-sm text-gray-800 transition-all duration-200 hover:bg-orange-100 hover:text-orange-600"
        >
          Logout
        </Link>
      </div>
    </div>
  );
};

export default AvatarDropdown;

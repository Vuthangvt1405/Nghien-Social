import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useSelector } from "react-redux";
// Update the import path below if your store file is located elsewhere
import type { RootState } from "../../store/store";
import { getAllPostBySlug } from "../../api/Post"; // bạn phải tự import đúng path

type Post = {
  id: number;
  title: string;
  caption: string;
  slug: string;
  cover?: string;
};

const SearchBar: React.FC = () => {
  const typeDevice = useSelector((state: RootState) => state.responsive);
  const isMobile = typeDevice.type === "Mobile" || typeDevice.type === "Tablet";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Post[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch data khi query thay đổi
  useEffect(() => {
    const fetchData = async () => {
      if (query.trim() === "") {
        setResults([]);
        return;
      }
      try {
        const response = await getAllPostBySlug(query);
        setResults(response.data || []);
      } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
        setResults([]);
      }
    };

    const delayDebounce = setTimeout(fetchData, 300); // debounce 300ms
    return () => clearTimeout(delayDebounce);
  }, [query]);

  // UI item kết quả
  const renderResults = () =>
    results.length > 0 && (
      <div
        className={`${
          isMobile ? "relative mt-4 max-h-[300px]" : "absolute top-full mt-2"
        } z-40 w-full overflow-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60`}
      >
        {results.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-orange-100"
            onClick={() => {
              window.location.href = `/post/${post.slug}`;
              setQuery("");
              setResults([]);
            }}
          >
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold truncate">{post.title}</div>
              <div className="text-xs text-gray-500 truncate">
                {post.caption}
              </div>
            </div>
            {post.cover && post.cover !== "0" && (
              <img
                src={post.cover}
                alt="cover"
                className="object-cover w-16 h-12 border border-gray-200 rounded-md shrink-0"
              />
            )}
          </div>
        ))}
      </div>
    );

  // ---------- UI ----------
  if (isMobile) {
    // 📱 Mobile UI
    return (
      <div className="relative">
        {!isMobileOpen ? (
          <FaSearch
            className="text-xl text-gray-700 cursor-pointer"
            onClick={() => setIsMobileOpen(true)}
          />
        ) : (
          <div className="fixed inset-0 z-50 px-4 py-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Search</h2>
              <IoClose
                className="text-xl cursor-pointer"
                onClick={() => {
                  setIsMobileOpen(false);
                  setQuery("");
                  setResults([]);
                }}
              />
            </div>
            <input
              type="text"
              placeholder="Search posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg outline-none bg-slate-100 focus:ring-2 ring-blue-400"
            />
            {renderResults()}
          </div>
        )}
      </div>
    );
  }

  // 💻 Desktop UI
  return (
    <div className="relative flex-1 hidden max-w-2xl lg:block">
      <input
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="z-20 w-full px-10 py-3 rounded-full outline-none bg-slate-300 hover:bg-slate-200 focus:border focus:border-blue-500"
      />
      <FaSearch className="absolute z-30 text-gray-600 transform -translate-y-1/2 left-4 top-1/2" />
      {renderResults()}
    </div>
  );
};

export default SearchBar;

import Cookies from "js-cookie";

export const checkUserLogin = () => {
  const cookie = Cookies.get("authToken");
  if (!cookie) {
    window.location.href = `${import.meta.env.VITE_URL_BASE_WEB}/login`;
    return;
  }
};

const decodeJWTFromCookie = () => {
  try {
    // Lấy authToken từ cookie
    const cookies = document.cookie.split(";");
    const authTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("authToken=")
    );

    if (!authTokenCookie) {
      return null;
    }

    const token = authTokenCookie.split("=")[1];

    if (!token) {
      return null;
    }

    // Decode JWT token (chỉ decode payload, không verify signature)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload part (index 1)
    const payload = parts[1];

    // Thêm padding nếu cần thiết cho base64url
    let base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    // Decode base64
    const decodedPayload = atob(base64);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

// Lấy thông tin user hiện tại từ JWT
export const getCurrentUserFromToken = (): {
  id: number;
  name?: string;
  email?: string;
} | null => {
  const decodedToken = decodeJWTFromCookie();

  if (!decodedToken) {
    return null;
  }

  // Tùy thuộc vào cấu trúc token của bạn
  // Thông thường JWT payload có thể chứa: userId, id, sub, etc.
  return {
    id: decodedToken.userId || decodedToken.id || decodedToken.sub,
    name: decodedToken.name || decodedToken.username,
    email: decodedToken.email,
  };
};

// Check xem user có phải admin không
export const isUserAdmin = (): boolean => {
  const decodedToken = decodeJWTFromCookie();
  return (
    decodedToken?.admin === 1 ||
    decodedToken?.role === "admin" ||
    decodedToken?.isAdmin === true
  );
};

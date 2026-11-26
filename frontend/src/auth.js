export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("userData"));
  } catch {
    return null;
  }
};

export const setStoredUser = (user) =>
  localStorage.setItem("userData", JSON.stringify(user));

export const isLoggedIn = () =>
  !!localStorage.getItem("token") && !!getStoredUser();

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  window.location.href = "/";
};

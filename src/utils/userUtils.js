// utils/userUtils.js
export const updateUserInStorage = (userData) => {
  if (!userData) return null;
  localStorage.setItem("transportUser", JSON.stringify(userData));
  // Custom event dispatch karein taaki sab components ko pata chale
  window.dispatchEvent(new CustomEvent('userUpdated', { detail: userData }));
  return userData;
};

export const getUserFromStorage = () => {
  const user = localStorage.getItem("transportUser");
  return user ? JSON.parse(user) : null;
};

export const getSubscriptionRemaining = (endDateString) => {
  if (!endDateString) return null;
  
  const endDate = new Date(endDateString);
  const now = new Date();
  
  const diffMs = endDate - now;
  
  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      totalMs: 0,
      expired: true,
      formatted: "Expired",
      color: 'red'
    };
  }
  
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  let formatted = '';
  if (diffDays > 0) formatted += `${diffDays}d `;
  if (diffHours > 0 || diffDays === 0) formatted += `${diffHours}h `;
  if (diffDays === 0 && diffHours === 0) formatted += `${diffMinutes}m`;
  
  return {
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    totalMs: diffMs,
    expired: false,
    formatted: formatted.trim(),
    color: diffDays <= 7 ? 'orange' : 'green'
  };
};
export function showToast(message, type = "info") {

  const container = document.getElementById("toastContainer");

  if (!container) return;

  const toast = document.createElement("div");

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-yellow-500",
    info: "bg-blue-600"
  };

  toast.className = `
    ${colors[type]}
    text-white px-4 py-3 rounded-lg shadow-lg
    transform transition duration-300
    opacity-0 translate-x-10
  `;

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("opacity-0", "translate-x-10");
  }, 50);

  setTimeout(() => {

    toast.classList.add("opacity-0","translate-x-10");

    setTimeout(() => {
      toast.remove();
    }, 300);

  }, 3000);
}
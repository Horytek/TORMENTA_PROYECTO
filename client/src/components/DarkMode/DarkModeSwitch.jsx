// Puedes poner esto en tu Navbar o en un componente global
import { useEffect, useState } from "react";

function DarkModeSwitch() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [dark]);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={dark}
        onChange={() => setDark(!dark)}
        className="hidden"
      />
      <span className="w-10 h-6 bg-gray-300 rounded-full flex items-center p-1 transition-colors duration-200 dark:bg-gray-700">
        <span
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
            dark ? "translate-x-4" : ""
          }`}
        />
      </span>
      <span className="text-sm">{dark ? "Oscuro" : "Claro"}</span>
    </label>
  );
}

export default DarkModeSwitch;
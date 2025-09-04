import { useEffect, useState } from "react";

const ScrollUpButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    window.addEventListener("scroll", toggleVisible);
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  const toggleVisible = () => {
    const scrolled = document.documentElement.scrollTop;
    if (scrolled > 300) {
      setIsVisible(true);
    } else if (scrolled <= 300) {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      {isVisible && (
        <button
          className="scrollup-btn"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="35px"
            height="35px"
            viewBox="0 0 20 20"
          >
            <path
              d="M4.16732 12.5L10.0007 6.66667L15.834 12.5"
              stroke="rgb(99, 102, 241)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
        </button>
      )}
      <style jsx>{`
        .scrollup-btn {
          width: 3rem;
          height: 3rem;
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          border: 1px solid rgb(255,255,255,0.15);
          border-radius: 0.75rem;
          background-color: rgb(38, 39, 43);
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: background-color 0.15s ease-in-out;
          z-index: 50;
        }
        .scrollup-btn:hover {
          background-color: rgb(48, 49, 54);
        }
      `}</style>
    </>
  );
};

export default ScrollUpButton;
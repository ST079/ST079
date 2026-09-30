import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface PointerProps {
  className?: string;
  children?: React.ReactNode;
}

export const Pointer: React.FC<PointerProps> = ({
  className,
  children,
}) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [visible, setVisible] = React.useState(false);
  const pointerRef = React.useRef<HTMLDivElement>(null);
  const parentRef = React.useRef<HTMLElement | null>(null);

  // Set up mouse tracking on parent element
  React.useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    // Hide native cursor
    const originalCursor = parent.style.cursor;
    parent.style.cursor = "none";

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setVisible(true);
    const handleMouseLeave = () => setVisible(false);

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.style.cursor = originalCursor;
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Default pointer (simple arrow) if no children provided
  const defaultPointer = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 2L14 14M2 14L14 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <>
      {/* Parent element ref */}
      <div ref={parentRef} style={{ position: "relative" }}>
        {/* Pointer element */}
        <AnimatePresence>
          {visible && (
            <motion.div
              ref={pointerRef}
              style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                zIndex: 9999,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={className}
            >
              {children ?? defaultPointer}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Loader from "../ui/Loader";

const IntroLoader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Give the text time to become fully visible
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-999 flex items-center justify-center bg-black"
          initial={{
            y: 0,
          }}
          exit={{
            y: "-100%",
            borderBottomLeftRadius: "50% 160px",
            borderBottomRightRadius: "50% 160px",
            transition: {
              duration: 1.1,
              ease: [0.76, 0, 0.24, 1],
            },
          }}
        >
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
          >
            <Loader />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroLoader;

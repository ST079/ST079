
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import Loader from "../ui/Loader";
import siteConfig from "../config/siteConfig";

interface IntroLoaderProps {
  onComplete: () => void;
}

const IntroLoader = ({ onComplete }: IntroLoaderProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence
      onExitComplete={onComplete}
    >
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

            {siteConfig.loader.showText && (
              <p className="mt-4 text-center text-sm text-white">
                {siteConfig.loader.text}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroLoader;

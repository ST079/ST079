"use client";

import { useState } from "react";
import IntroLoader from "./IntroLoader";

interface IntroGateProps {
  children: React.ReactNode;
}

const IntroGate = ({ children }: IntroGateProps) => {
  const [isIntroFinished, setIsIntroFinished] = useState(false);

  return (
    <>
      {!isIntroFinished && (
        <IntroLoader
          onComplete={() => setIsIntroFinished(true)}
        />
      )}

      {isIntroFinished && children}
    </>
  );
};

export default IntroGate;
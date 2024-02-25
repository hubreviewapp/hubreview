import React from "react";
import { useLocation } from "react-router-dom";

interface NoRenderOnPathProps {
  noRenderPaths?: string[];
  children: React.ReactNode;
}

const NoRenderOnPath: React.FC<NoRenderOnPathProps> = (props: NoRenderOnPathProps) => {
  const location = useLocation();
  return props.noRenderPaths && props.noRenderPaths.includes(location.pathname) ? (
    <React.Fragment></React.Fragment>
  ) : (
    <>{props.children}</>
  );
};

export default NoRenderOnPath;

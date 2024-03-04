import React from "react";
import { useLocation } from "react-router-dom";

interface NoRenderOnPathProps {
  noRenderPaths?: string[];
  children: React.ReactNode;
}

function NoRenderOnPath(props: NoRenderOnPathProps) {
  const location = useLocation();
  return props.noRenderPaths && props.noRenderPaths.includes(location.pathname) ? (
    <React.Fragment></React.Fragment>
  ) : (
    <>{props.children}</>
  );
}

export default NoRenderOnPath;

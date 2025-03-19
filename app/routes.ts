import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  {
    path: "/img",
    file: "routes/img.ts",
  },
  {
    path: "/img-stream",
    file: "routes/img-stream.ts",
  },
] satisfies RouteConfig;

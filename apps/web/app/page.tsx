import dynamic from "next/dynamic";

const CanvasApp = dynamic(() => import("./CanvasApp"), { ssr: false });

export default function Page() {
  return <CanvasApp />;
}

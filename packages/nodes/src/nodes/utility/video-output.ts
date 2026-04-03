import { NodeDef } from "../../types";

export const videoOutputNode: NodeDef = {
  id: "video-output",
  label: "Video Output",
  description: "Displays the result video",
  category: "utility",
  icon: "MonitorPlay",
  inputs: {
    video: { type: "video", label: "Video" },
  },
  outputs: {},
  params: {},
  backends: { local: true },
  defaultBackend: "local",
  width: 320,
};

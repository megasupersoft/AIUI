import { NodeDef } from "../../types";

export const videoInputNode: NodeDef = {
  id: "video-input",
  label: "Video",
  description: "Upload or drop a video file",
  category: "utility",
  icon: "Film",
  inputs: {},
  outputs: {
    video: { type: "video", label: "Video" },
  },
  params: {
    video: {
      type: "video",
      label: "Video",
      default: null,
      appModeVisible: true,
    },
  },
  backends: { local: true },
  defaultBackend: "local",
  width: 300,
};

import { Briefcase, FolderGit2, GraduationCap, House, Layers, Mail, type LucideIcon } from "lucide-react";

import type { DestinationId } from "./layout";

/** One icon per destination, shared by the 3D signs and the HUD. */
export const DESTINATION_ICONS: Record<DestinationId, LucideIcon> = {
  about: House,
  experience: Briefcase,
  projects: FolderGit2,
  skills: Layers,
  education: GraduationCap,
  contact: Mail,
};

import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Search,
  Building2,
  Brain,
  Download,
  Database,
  Users,
  ShieldCheck,
  ActivitySquare,
  Plug,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { hasAdminAccess } from "@/lib/rbac";

export type SidebarLinkItem = {
  to: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
};

export const analysisNavigationLinks: SidebarLinkItem[] = [
  { to: "/", label: "Översikt", icon: <BarChart3 className="h-4 w-4" />, exact: true },
  { to: "/search", label: "Företagssökning", icon: <Search className="h-4 w-4" /> },
  { to: "/analysis", label: "Analys", icon: <Building2 className="h-4 w-4" /> },
  { to: "/insights", label: "AI-insikter", icon: <Brain className="h-4 w-4" /> },
  { to: "/export", label: "Export", icon: <Download className="h-4 w-4" /> },
  { to: "/scrapers", label: "Dataskraper", icon: <Database className="h-4 w-4" /> },
];

export const adminNavigationLinks: SidebarLinkItem[] = [
  { to: "/admin/users", label: "Användare", icon: <Users className="h-4 w-4" /> },
  { to: "/admin/roles", label: "Roller & Behörigheter", icon: <ShieldCheck className="h-4 w-4" /> },
  { to: "/admin/db-status", label: "Databasstatus", icon: <ActivitySquare className="h-4 w-4" /> },
  { to: "/admin/integrations", label: "Integrationer", icon: <Plug className="h-4 w-4" /> },
];

function SidebarLink({ link }: { link: SidebarLinkItem }) {
  return (
    <NavLink
      to={link.to}
      end={link.exact}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          isActive && "bg-muted text-foreground"
        )
      }
    >
      <span className="flex h-4 w-4 items-center justify-center text-current">{link.icon}</span>
      {link.label}
    </NavLink>
  );
}

export function Sidebar() {
  const { userRole } = useAuth();

  return (
    <aside className="flex h-full flex-col justify-between border-r bg-background/70 px-4 py-6 backdrop-blur">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Analys</p>
          <nav className="mt-3 space-y-1">
            {analysisNavigationLinks.map((link) => (
              <SidebarLink key={link.to} link={link} />
            ))}
          </nav>
        </div>
      </div>

      {hasAdminAccess(userRole) && (
        <div className="space-y-3 border-t pt-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Administration</p>
          <nav className="space-y-1">
            {adminNavigationLinks.map((link) => (
              <SidebarLink key={link.to} link={link} />
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;


import { Outlet } from "react-router-dom";
import { Sidebar, analysisNavigationLinks, adminNavigationLinks } from "@/components/navigation/Sidebar";
import { ModeToggle } from "@/components/ui-custom/ModeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { hasAdminAccess } from "@/lib/rbac";
import { useNavigate } from "react-router-dom";

export function DashboardLayout() {
  const { signOut, userRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  const availableLinks = hasAdminAccess(userRole)
    ? [...analysisNavigationLinks, ...adminNavigationLinks]
    : analysisNavigationLinks;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden border-r bg-background/80 shadow-sm lg:block lg:w-64">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Nivo Dashboard</h1>
              <p className="text-sm text-muted-foreground">Dataintelligens och operationell insikt</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Navigering
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.to}
                        onSelect={() => navigate(link.to)}
                        className="cursor-pointer"
                      >
                        {link.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ModeToggle />
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logga ut
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-muted/30 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;


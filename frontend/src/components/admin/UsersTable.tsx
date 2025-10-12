import { useEffect, useMemo, useState } from "react";
import { listUsersWithRoles, updateUserRole, UserRole } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPageHeader } from "./AdminPageHeader";

interface ManagedUser {
  id: string;
  email: string;
  createdAt: string;
  role: UserRole;
  approved: boolean;
}

const mockUsers: ManagedUser[] = [
  {
    id: "mock-1",
    email: "jesper@nivo.ai",
    createdAt: new Date().toISOString(),
    role: "admin",
    approved: true,
  },
  {
    id: "mock-2",
    email: "analyst@nivo.ai",
    createdAt: new Date().toISOString(),
    role: "analyst",
    approved: true,
  },
  {
    id: "mock-3",
    email: "viewer@nivo.ai",
    createdAt: new Date().toISOString(),
    role: "viewer",
    approved: false,
  },
];

export function UsersTable() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const { users: fetchedUsers, error } = await listUsersWithRoles();
      if (error) {
        console.warn("Falling back to mock users", error);
        setError(error.message);
        setUsers(mockUsers);
      } else {
        setError(null);
        setUsers(fetchedUsers as ManagedUser[]);
      }
    } catch (err) {
      console.error("Failed to load users", err);
      setError("Kunde inte hämta användare");
      setUsers(mockUsers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const previous = users;
    setUsers((state) => state.map((user) => (user.id === userId ? { ...user, role, approved: true } : user)));

    const { error } = await updateUserRole(userId, role);
    if (error) {
      console.error("Failed to update role", error);
      setError(error.message);
      setUsers(previous);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Användare"
        description="Hantera inbjudningar, roller och åtkomsträttigheter för hela organisationen."
        items={[{ label: "Användare" }]}
        actions={
          <Button variant="ghost" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Uppdatera
          </Button>
        }
      />
      <Card className="border-none bg-background shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-wrap gap-3">
              <Input
                placeholder="Sök på e-post"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full lg:w-64"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrera roll" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla roller</SelectItem>
                  <SelectItem value="admin">Administratör</SelectItem>
                  <SelectItem value="analyst">Analytiker</SelectItem>
                  <SelectItem value="viewer">Visare</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-dashed border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700">
              {error} (mock-data används)
            </div>
          )}

          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  E-post
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Roll
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Åtgärd
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Inga användare matchar filtret just nu.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administratör</SelectItem>
                          <SelectItem value="analyst">Analytiker</SelectItem>
                          <SelectItem value="viewer">Visare</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={user.approved ? "default" : "secondary"}>
                        {user.approved ? "Aktiv" : "Inväntar godkännande"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      Senast uppdaterad {new Date(user.createdAt).toLocaleDateString("sv-SE")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UsersTable;


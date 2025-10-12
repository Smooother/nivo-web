import { Fragment, ReactNode } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  items?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, items = [], actions }: AdminPageHeaderProps) {
  const crumbs = [{ label: "Administration", href: "/admin/users" }, ...items];

  return (
    <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                <BreadcrumbItem>
                  {crumb.href && index !== crumbs.length - 1 ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index !== crumbs.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions}
    </div>
  );
}

export default AdminPageHeader;


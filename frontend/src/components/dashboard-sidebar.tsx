import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  CreditCard,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  X,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Payments", href: "/dashboard/payments", icon: ArrowLeftRight },
  { label: "Assets", href: "/dashboard/assets", icon: PieChart },
  { label: "Cards", href: "/dashboard/cards", icon: CreditCard },
  { label: "Privacy", href: "/dashboard/privacy", icon: Shield },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const bottomItems = [
  { label: "Help Center", href: "#", icon: HelpCircle },
  { label: "Log Out", href: "/", icon: LogOut },
];

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  const { pathname } = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-sm font-bold text-primary-foreground">
                V
              </span>
            </div>
            <span className="font-display text-lg font-bold text-sidebar-foreground">
              Renaissance
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom nav */}
        <div className="border-t border-sidebar-border px-3 py-4">
          <ul className="flex flex-col gap-1">
            {bottomItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Wallet */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const connected = mounted && account && chain;
              return (
                <div className="mt-4">
                  {connected ? (
                    <div className="flex flex-col gap-2 rounded-lg bg-sidebar-accent px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <div className="flex-1 truncate">
                          <button
                            onClick={openAccountModal}
                            className="text-sm font-medium text-sidebar-accent-foreground truncate block hover:underline"
                          >
                            {account.displayName}
                          </button>
                          <button
                            onClick={openChainModal}
                            className="text-xs text-muted-foreground truncate block hover:underline"
                          >
                            {chain.name}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={openConnectModal} className="w-full gap-2">
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </Button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </aside>
    </>
  );
}

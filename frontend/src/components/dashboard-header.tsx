import { Menu, Search } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="flex h-16 items-center gap-4 border-b border-border/50 bg-card px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="text-foreground lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="relative hidden flex-1 md:block md:max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions, assets..."
          className="pl-9 bg-secondary/50 border-border/50 font-extralight tracking-wider text-[13px]"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* <ConnectButton
          accountStatus="avatar"
          chainStatus="icon"
          showBalance={false}
        /> */}
        <ThemeToggle />
      </div>
    </header>
  );
}

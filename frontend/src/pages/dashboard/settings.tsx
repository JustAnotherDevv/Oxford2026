import { useState } from "react";
import {
  Building2,
  Shield,
  Users,
  Bell,
  Key,
  Globe,
  Save,
  UserPlus,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const teamMembers = [
  {
    name: "Sarah Chen",
    email: "sarah@acmecorp.io",
    role: "Admin",
    status: "Active",
  },
  {
    name: "James Wilson",
    email: "james@acmecorp.io",
    role: "Finance",
    status: "Active",
  },
  {
    name: "Maria Garcia",
    email: "maria@acmecorp.io",
    role: "Viewer",
    status: "Active",
  },
  {
    name: "Alex Tanaka",
    email: "alex@acmecorp.io",
    role: "Finance",
    status: "Invited",
  },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    payments: true,
    security: true,
    team: false,
    marketing: false,
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your company profile, security, team, and preferences.
        </p>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="mb-6 w-full justify-start overflow-x-auto">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <div className="flex flex-col gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-card-foreground">
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      defaultValue="Acme Corp"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="legalEntity">Legal Entity</Label>
                    <Input
                      id="legalEntity"
                      defaultValue="Acme Corporation Inc."
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select defaultValue="technology">
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Select defaultValue="us">
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="sg">Singapore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="website"
                        defaultValue="https://acmecorp.io"
                        className="bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button size="sm" className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="flex flex-col gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-card-foreground">
                  Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Require 2FA for all team members
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-border" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        Multi-Sig Approval
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Require multiple signatures for large transactions
                      </p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator className="bg-border" />
                <div className="flex flex-col gap-3">
                  <Label>Transaction Approval Threshold</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="number"
                      defaultValue="10000"
                      className="w-40 bg-secondary border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                      USDC - Transactions above this require approval
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-card-foreground">
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        Production Key
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        vx_prod_****...a3f2
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        Test Key
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        vx_test_****...b7d1
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Test
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 gap-2 bg-transparent">
                  <Key className="h-4 w-4" />
                  Generate New Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-card-foreground">
                Team Members
              </CardTitle>
              <Button size="sm" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <Badge
                      variant={
                        member.status === "Active" ? "secondary" : "outline"
                      }
                      className="hidden text-xs sm:inline-flex"
                    >
                      {member.status}
                    </Badge>
                    <Select defaultValue={member.role.toLowerCase()}>
                      <SelectTrigger className="w-28 bg-secondary border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove member</span>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-card-foreground">
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {[
                {
                  key: "payments" as const,
                  title: "Payment Alerts",
                  desc: "Get notified for all incoming and outgoing payments",
                },
                {
                  key: "security" as const,
                  title: "Security Alerts",
                  desc: "Login attempts, API key usage, and suspicious activity",
                },
                {
                  key: "team" as const,
                  title: "Team Activity",
                  desc: "New member invites, role changes, and access updates",
                },
                {
                  key: "marketing" as const,
                  title: "Product Updates",
                  desc: "New features, improvements, and platform announcements",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: checked,
                      }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

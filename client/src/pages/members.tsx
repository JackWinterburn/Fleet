import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Plus, Users, Trash2, Shield, Crown, User } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "member"]).default("member"),
});

interface MemberWithUser {
  id: string;
  fleetId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

const roleConfig: Record<string, { icon: typeof User; color: string; label: string }> = {
  owner: { icon: Crown, color: "text-chart-4", label: "Owner" },
  admin: { icon: Shield, color: "text-chart-1", label: "Admin" },
  member: { icon: User, color: "text-muted-foreground", label: "Member" },
};

export default function MembersPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: members, isLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/fleets", fleetId, "members"],
  });

  const form = useForm({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: "", role: "member" as const },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addMemberSchema>) => {
      const res = await apiRequest("POST", `/api/fleets/${fleetId}/members`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "members"] });
      toast({ title: "Member added" });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "members"] });
      toast({ title: "Member removed" });
    },
  });

  const currentUserRole = members?.find((m) => m.userId === user?.id)?.role;
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage team access to this fleet</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-member">
                <Plus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Member</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => addMemberMutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="colleague@company.com" type="email" {...field} data-testid="input-member-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-member-role">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={addMemberMutation.isPending} data-testid="button-submit-member">
                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : members && members.length > 0 ? (
        <div className="space-y-2">
          {members.map((member) => {
            const config = roleConfig[member.role] || roleConfig.member;
            const RoleIcon = config.icon;
            const initials = `${member.user.firstName?.[0] ?? ""}${member.user.lastName?.[0] ?? ""}`.toUpperCase() || "U";
            const isOwner = member.role === "owner";
            const isSelf = member.userId === user?.id;

            return (
              <Card key={member.id} className="p-4" data-testid={`card-member-${member.id}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.user.profileImageUrl ?? undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {member.user.firstName} {member.user.lastName}
                      </span>
                      {isSelf && <Badge variant="secondary" className="text-xs">You</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <RoleIcon className={`w-3 h-3 ${config.color}`} />
                      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                    </div>
                    {canManage && !isOwner && !isSelf && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        data-testid={`button-remove-member-${member.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No members</h3>
          <p className="text-sm text-muted-foreground">Invite team members to collaborate on this fleet.</p>
        </Card>
      )}
    </div>
  );
}

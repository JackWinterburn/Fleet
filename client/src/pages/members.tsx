import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import {
  Button,
  Modal,
  TextInput,
  Select,
  SelectItem,
  Tile,
  Tag,
  SkeletonText,
} from "@carbon/react";
import { Add, TrashCan, UserMultiple, UserAdmin, User } from "@carbon/icons-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
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

const roleConfig: Record<string, { color: string; label: string; tagType: string }> = {
  owner: { color: "#b28600", label: "Owner", tagType: "warm-gray" },
  admin: { color: "#0f62fe", label: "Admin", tagType: "blue" },
  member: { color: "#525252", label: "Member", tagType: "gray" },
};

export default function MembersPage() {
  const { fleetId } = useParams<{ fleetId: string }>();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

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
      setModalOpen(false);
      form.reset();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await apiRequest("DELETE", `/api/fleets/${fleetId}/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fleets", fleetId, "members"] });
    },
  });

  const onSubmit = form.handleSubmit((d) => addMemberMutation.mutate(d));

  const currentUserRole = members?.find((m) => m.userId === user?.id)?.role;
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div>
      <div className="tc-page-header">
        <div>
          <h1 data-testid="text-page-title">Members</h1>
          <p>Manage team access to this fleet</p>
        </div>
        {canManage && (
          <Button kind="primary" renderIcon={Add} onClick={() => setModalOpen(true)} data-testid="button-add-member">
            Add Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[1, 2, 3].map((i) => <Tile key={i}><SkeletonText paragraph lineCount={2} /></Tile>)}
        </div>
      ) : members && members.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {members.map((member) => {
            const config = roleConfig[member.role] || roleConfig.member;
            const initials = `${member.user.firstName?.[0] ?? ""}${member.user.lastName?.[0] ?? ""}`.toUpperCase() || "U";
            const isOwner = member.role === "owner";
            const isSelf = member.userId === user?.id;

            return (
              <Tile key={member.id} data-testid={`card-member-${member.id}`}>
                <div className="tc-member-card" style={{ padding: 0 }}>
                  <div
                    className="tc-avatar"
                    style={{ backgroundColor: "var(--cds-border-subtle, #e0e0e0)", color: "var(--cds-text-primary, #161616)" }}
                  >
                    {member.user.profileImageUrl ? (
                      <img src={member.user.profileImageUrl} alt={initials} />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="tc-member-info">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span className="tc-member-name">
                        {member.user.firstName} {member.user.lastName}
                      </span>
                      {isSelf && <Tag size="sm" type="blue">You</Tag>}
                    </div>
                    <span className="tc-member-email">{member.user.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Tag size="sm" type={config.tagType as any}>{config.label}</Tag>
                    {canManage && !isOwner && !isSelf && (
                      <Button
                        kind="ghost"
                        size="sm"
                        hasIconOnly
                        renderIcon={TrashCan}
                        iconDescription="Remove"
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        data-testid={`button-remove-member-${member.id}`}
                      />
                    )}
                  </div>
                </div>
              </Tile>
            );
          })}
        </div>
      ) : (
        <Tile className="tc-empty-state">
          <UserMultiple size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
          <h3>No members</h3>
          <p>Invite team members to collaborate on this fleet.</p>
        </Tile>
      )}

      <Modal
        open={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={onSubmit}
        modalHeading="Add Member"
        primaryButtonText={addMemberMutation.isPending ? "Adding..." : "Add Member"}
        secondaryButtonText="Cancel"
        primaryButtonDisabled={addMemberMutation.isPending}
        data-testid="modal-add-member"
      >
        <div style={{ marginBottom: "1rem" }}>
          <TextInput
            id="member-email"
            labelText="Email Address"
            placeholder="colleague@company.com"
            type="email"
            value={form.watch("email")}
            onChange={(e: any) => form.setValue("email", e.target.value)}
            invalid={!!form.formState.errors.email}
            invalidText={form.formState.errors.email?.message}
            data-testid="input-member-email"
          />
        </div>
        <Select
          id="member-role"
          labelText="Role"
          value={form.watch("role")}
          onChange={(e: any) => form.setValue("role", e.target.value)}
          data-testid="select-member-role"
        >
          <SelectItem value="admin" text="Admin" />
          <SelectItem value="member" text="Member" />
        </Select>
      </Modal>
    </div>
  );
}

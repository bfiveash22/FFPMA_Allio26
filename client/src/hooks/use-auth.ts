import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

const PREVIEW_MODE_KEY = "allio_preview_mode";

const TRUSTEE_PREVIEW_USER: User = {
  id: "preview-trustee",
  email: "trustee@forgottenformula.com",
  firstName: "Trustee",
  lastName: "",
  profileImageUrl: null,
  wpUserId: null,
  wpUsername: null,
  wpRoles: "administrator",
  authProvider: "preview",
  createdAt: null,
  updatedAt: null,
};

export function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREVIEW_MODE_KEY) === "trustee";
}

export function enablePreviewMode(): void {
  localStorage.setItem(PREVIEW_MODE_KEY, "trustee");
  window.location.reload();
}

export function disablePreviewMode(): void {
  localStorage.removeItem(PREVIEW_MODE_KEY);
  window.location.reload();
}

async function fetchUser(): Promise<User | null> {
  if (isPreviewMode()) {
    return TRUSTEE_PREVIEW_USER;
  }

  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  if (isPreviewMode()) {
    disablePreviewMode();
    return;
  }
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const previewActive = isPreviewMode();

  const { data: user, isLoading, isFetching } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user: previewActive ? TRUSTEE_PREVIEW_USER : user,
    isLoading: previewActive ? false : (isLoading || isFetching),
    isAuthenticated: previewActive ? true : !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isPreviewMode: previewActive,
  };
}

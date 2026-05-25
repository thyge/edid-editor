<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"
import { Plus } from "@lucide/vue"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "none",
})
// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
}
</script>
<template>
  <Sidebar
    class="sticky hidden lg:flex top-0 h-svh border-l"
    v-bind="props"
  >
  HexView
    <SidebarHeader class="h-16 border-b border-sidebar-border">
    </SidebarHeader>
    <SidebarContent>
      <SidebarSeparator class="mx-0" />
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Plus />
            <span>New Calendar</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
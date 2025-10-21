// src/components/dashboard/nav-main.tsx
"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const { setOpenMobile, isMobile } = useSidebar()

  // Function to check if a path is active
  const isPathActive = (path: string, isSubItem: boolean = false) => {
    // Special case: Dashboard root should only match exactly
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }

    // For sub-items, use exact match (including query params check)
    if (isSubItem) {
      // Check exact match
      if (pathname === path) return true

      // Check if it's a query parameter variant (e.g., /dashboard/orders?status=pending)
      const [pathBase, pathQuery] = path.split('?')
      const [pathnameBase] = pathname.split('?')

      if (pathQuery && pathnameBase === pathBase) {
        // For query-based routes, check if the current URL includes the query
        if (typeof window !== 'undefined') {
          return window.location.search.includes(pathQuery.split('=')[1])
        }
      }

      return false
    }

    // For parent items, exact match
    if (pathname === path) return true

    // Check if current path starts with the item path (for nested routes)
    // But exclude root path to avoid false positives
    if (path !== "/" && pathname.startsWith(path + "/")) return true

    return false
  }

  // Function to check if parent item should be highlighted
  const isParentActive = (itemUrl: string, subItems?: { url: string }[]) => {
    // Check if main URL is active
    if (isPathActive(itemUrl)) return true

    // Check if any sub-item is active
    if (subItems && subItems.some(subItem => isPathActive(subItem.url))) {
      return true
    }

    return false
  }

  // Handle link click - close mobile sidebar
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          const parentActive = isParentActive(item.url, item.items)

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || parentActive}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={parentActive}
                >
                  <Link href={item.url} onClick={handleLinkClick}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isPathActive(subItem.url, true)}
                            >
                              <Link href={subItem.url} onClick={handleLinkClick}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
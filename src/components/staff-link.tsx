'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { useStaffPath } from '@/lib/staff-navigation'

export function StaffLink({ href, ...props }: Omit<ComponentProps<typeof Link>, 'href'> & { href: string }) {
  const path = useStaffPath()
  return <Link {...props} href={path(href)} />
}

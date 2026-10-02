import type { ReactNode, SVGProps } from 'react'

export type IconName =
  | 'box' | 'currency' | 'users' | 'tag' | 'grid' | 'store' | 'brush'
  | 'logout' | 'settings' | 'layers' | 'megaphone' | 'compass' | 'image'
  | 'document' | 'chat' | 'shoe' | 'palette' | 'type' | 'sparkles'
  | 'link' | 'info' | 'edit' | 'ticket' | 'bolt' | 'clock' | 'scroll'
  | 'location' | 'phone' | 'mail' | 'check' | 'search' | 'close' | 'cart'
  | 'meat' | 'chicken' | 'milk' | 'bottle' | 'bread' | 'fish' | 'cheese'
  | 'carrot' | 'cleaning' | 'snowflake' | 'coffee' | 'home'

type IconProps = SVGProps<SVGSVGElement> & { name: IconName }

const paths: Record<IconName, ReactNode> = {
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8M7.5 5l9 5" /></>,
  currency: <><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  tag: <><path d="M20.6 13.4 11 3.8A2.7 2.7 0 0 0 9.1 3H4v5.1c0 .7.3 1.4.8 1.9l9.6 9.6a2.3 2.3 0 0 0 3.2 0l3-3a2.3 2.3 0 0 0 0-3.2Z" /><circle cx="7.5" cy="6.5" r=".8" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  store: <><path d="M3 10v10h18V10M2 10l2-7h16l2 7" /><path d="M2 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-5h6v5" /></>,
  brush: <><path d="m14 6 4 4M4 20c3 0 4-1 4-4 0-2 1-3 3-3h1l8-8a2.1 2.1 0 0 0-3-3l-8 8v1c0 2-1 3-3 3-3 0-4 1-4 4Z" /></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1)" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
  megaphone: <><path d="m3 11 18-5v12L3 13v-2Z" /><path d="M11 15.2 13 21H8l-1.5-6.8M5 10V6a2 2 0 0 1 2-2h2" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  chat: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.4Z" /></>,
  shoe: <><path d="M3 16c3 0 5-1 6-5l2 1c2 3 4 4 9 4a2 2 0 0 1 2 2v2H3v-4Z" /><path d="M9 11 8 7M12 14l2-2M16 16l1-2" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.5-3.3 1.9 1.9 0 0 1 1.5-3.2H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z" /><circle cx="7.5" cy="10" r="1" /><circle cx="10" cy="6.5" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
  type: <><path d="M4 7V4h16v3M12 4v16M8 20h8" /></>,
  sparkles: <><path d="m12 3 1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3ZM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7h.01" /></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15l-.8 5Z" /></>,
  ticket: <><path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3v4Z" /><path d="M13 4v2M13 10v2M13 16v2" /></>,
  bolt: <><path d="m13 2-3 8h7l-6 12 2-9H6l7-11Z" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  scroll: <><path d="M8 4H5a2 2 0 0 0 0 4h3v12H5a2 2 0 0 1 0-4h14" /><path d="M8 4h11v16H8M12 8h4M12 12h4" /></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.7 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.7 2.6Z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2l2.6 12.2A2 2 0 0 0 8.6 17h9.7a2 2 0 0 0 2-1.6L22 7H5" /></>,
  meat: <><path d="M7 6.5c2.2-2 6.1-2 8.2.1l2.2 2.2a5.8 5.8 0 0 1-4.1 9.9H8a5 5 0 0 1-1-9.9" /><circle cx="7.5" cy="8" r="1.5" /><path d="M4 6 2.8 4.8M5 10H2.5" /></>,
  chicken: <><path d="M8 8a5 5 0 1 1 7 7l-3 3-7-7 3-3Z" /><path d="m5 16-2 2 3 3 2-2M3 18l-2-2M6 21l-2 2" /></>,
  milk: <><path d="M8 3h8l2 4v14H6V7l2-4Z" /><path d="M8 3v4l-2 3h12l-2-3V3M9 14h6" /></>,
  bottle: <><path d="M9 3h6v4l2 2v12H7V9l2-2V3Z" /><path d="M9 7h6M7 12h10" /></>,
  bread: <><path d="M4 20V9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v11H4Z" /><path d="M8 5v5M12 5v5M16 5v5M4 14h16" /></>,
  fish: <><path d="M3 12c3-4 7-6 12-5l5-3v16l-5-3c-5 1-9-1-12-5Z" /><circle cx="9" cy="10" r=".8" /><path d="M13 9.5c1.5 1.5 1.5 3.5 0 5" /></>,
  cheese: <><path d="m3 10 14-6 4 4v12H3v-10Z" /><circle cx="8" cy="14" r="1" /><circle cx="15" cy="11" r="1.3" /><circle cx="13" cy="17" r=".8" /></>,
  carrot: <><path d="m7 8 9 9-7 4-4-6 2-7Z" /><path d="M7 8 4 5M9 6 9 2M12 7l3-3M9 12l3 3M7 15l2 2" /></>,
  cleaning: <><path d="M9 4h6l1 4-2 2v11h-5V10L7 8l2-4Z" /><path d="M9 4 8 2h7l-1 2M9 14h5M18 5h3M19 8h2" /></>,
  snowflake: <><path d="M12 2v20M4 6l16 12M20 6 4 18" /><path d="m9 4 3-2 3 2M9 20l3 2 3-2M4 10 4 6l4-1M16 19l4-1v-4M16 5l4 1v4M4 14v4l4 1" /></>,
  coffee: <><path d="M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8ZM17 10h2a2 2 0 0 1 0 4h-2M8 4c0 1 1 1 1 2M12 3c0 1 1 1 1 2" /></>,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z" /></>,
}

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}

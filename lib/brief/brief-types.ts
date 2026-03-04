// Morning Brief content types — V1 + V2 fields

export interface ChannelTask {
  channel: string;
  channelId?: string;
  action: string;
  priority: number;
}

export interface ProduceItem {
  product: string;
  productId?: string;
  reason: string;
  videos: number;
  priority: number;
}

export interface NewProductAlert {
  product: string;
  productId?: string;
  why: string;
}

export interface UpcomingEvent {
  title: string;
  date: string;
}

// V2: Per-channel product match
export interface ChannelProductMatch {
  channelId: string;
  channelName: string;
  products: Array<{
    productId: string;
    product: string;
    reason: string;
    tag: "proven" | "explore";
    videos: number;
  }>;
}

// V2: Event-linked products
export interface EventProductBoost {
  event: string;
  date: string;
  products: Array<{
    productId: string;
    product: string;
    reason: string;
  }>;
}

export interface BriefContent {
  greeting: string;
  channel_tasks?: ChannelTask[];
  produce_today: ProduceItem[];
  new_products_alert: NewProductAlert[];
  upcoming_events?: UpcomingEvent[];
  yesterday_recap: string;
  tip: string;
  weekly_progress: string;
  // V2 fields (optional for backward compat)
  channel_product_match?: ChannelProductMatch[];
  event_product_boost?: EventProductBoost[];
  pattern_highlight?: string | null;
}

import { prisma } from "./prisma";

// ============================================================
// Central site settings.
//
// Every value lives in the SiteSetting table (key/value).
// `DEFAULT_SETTINGS` below are the out-of-box values and are
// also used as a fallback if a row is missing (fresh DB).
//
// The admin dashboard exposes these in grouped forms so the
// organisation can edit them without touching code.
// ============================================================

export type SettingDef = {
  key: string;
  group: string;
  type: "STRING" | "TEXT" | "NUMBER" | "BOOLEAN" | "JSON";
  label: string;
  description?: string;
  defaultValue: string;
};

export const SETTING_GROUPS: Array<{ key: string; label: string }> = [
  { key: "general", label: "General" },
  { key: "contact", label: "Contact & WhatsApp" },
  { key: "bank", label: "Bank transfer details" },
  { key: "social", label: "Social media" },
  { key: "seo", label: "SEO" },
  { key: "content", label: "Site content" },
  { key: "awards_content", label: "Awards page content" },
  { key: "legal", label: "Legal / policies" },
];

export const DEFAULT_SETTINGS: SettingDef[] = [
  // ---------- general ----------
  {
    key: "general.siteName",
    group: "general",
    type: "STRING",
    label: "Organisation name",
    defaultValue: "LADIRE Growth Forum",
  },
  {
    key: "general.tagline",
    group: "general",
    type: "STRING",
    label: "Tagline",
    defaultValue: "Building Youth. Promoting Culture. Celebrating Creativity.",
  },
  {
    key: "general.logoUrl",
    group: "general",
    type: "STRING",
    label: "Logo image path/URL",
    defaultValue: "/brand/ladire-logo.png",
  },
  {
    key: "general.websiteNote",
    group: "general",
    type: "TEXT",
    label: "Website announcement bar",
    description: "Optional text shown in the thin bar above the navigation.",
    defaultValue: "",
  },
  // ---------- contact ----------
  {
    key: "contact.phone1",
    group: "contact",
    type: "STRING",
    label: "Primary phone",
    defaultValue: "070 6342 0621",
  },
  {
    key: "contact.phone2",
    group: "contact",
    type: "STRING",
    label: "Secondary phone",
    defaultValue: "070 611 91218",
  },
  {
    key: "contact.phone3",
    group: "contact",
    type: "STRING",
    label: "Tertiary phone",
    defaultValue: "0812 644 8405",
  },
  {
    key: "contact.email1",
    group: "contact",
    type: "STRING",
    label: "Primary email",
    defaultValue: "ladiregrowth@gmail.com",
  },
  {
    key: "contact.email2",
    group: "contact",
    type: "STRING",
    label: "Secondary email",
    defaultValue: "Blackmanworldent@gmail.com",
  },
  {
    key: "contact.whatsapp",
    group: "contact",
    type: "STRING",
    label: "Official WhatsApp (voting/payments)",
    description:
      "International format without +, e.g. 2347063420621. Used for the click-to-chat CTA.",
    defaultValue: "2347063420621",
  },
  {
    key: "contact.whatsappSupport",
    group: "contact",
    type: "STRING",
    label: "WhatsApp (support) — optional",
    defaultValue: "",
  },
  {
    key: "contact.address",
    group: "contact",
    type: "STRING",
    label: "Address / location",
    defaultValue: "Lagos, Nigeria",
  },
  // ---------- bank ----------
  {
    key: "bank.name",
    group: "bank",
    type: "STRING",
    label: "Bank name",
    defaultValue: "GTBank (DEMO — REPLACE BEFORE LAUNCH)",
  },
  {
    key: "bank.accountName",
    group: "bank",
    type: "STRING",
    label: "Account name",
    defaultValue: "LADIRE GROWTH FORUM",
  },
  {
    key: "bank.accountNumber",
    group: "bank",
    type: "STRING",
    label: "Account number",
    defaultValue: "1234567890",
  },
  {
    key: "bank.instructions",
    group: "bank",
    type: "TEXT",
    label: "Transfer instructions shown to voters",
    defaultValue:
      "Make a bank transfer to the account below and use your unique payment reference as the transfer narration where your bank allows it. Keep your receipt — you will upload it on the next step.",
  },
  // ---------- social ----------
  { key: "social.instagram", group: "social", type: "STRING", label: "Instagram handle", defaultValue: "" },
  { key: "social.facebook", group: "social", type: "STRING", label: "Facebook page", defaultValue: "" },
  { key: "social.tiktok", group: "social", type: "STRING", label: "TikTok handle", defaultValue: "" },
  { key: "social.x", group: "social", type: "STRING", label: "X / Twitter handle", defaultValue: "" },
  { key: "social.youtube", group: "social", type: "STRING", label: "YouTube channel", defaultValue: "" },
  // ---------- seo ----------
  {
    key: "seo.siteDescription",
    group: "seo",
    type: "TEXT",
    label: "Default meta description",
    defaultValue:
      "LADIRE Growth Forum is a youth-focused community and movement that helps young people learn, connect, create, collaborate, grow and be recognised — building youth, promoting culture and celebrating creativity.",
  },
  {
    key: "seo.keywords",
    group: "seo",
    type: "STRING",
    label: "Meta keywords",
    defaultValue:
      "LADIRE Growth Forum, LADIRE Awards 2026, LADIRE Youth & Entertainment Awards, youth development, youth entertainment, culture, creativity, community, Lagos",
  },
  // ---------- content (home/about etc) ----------
  {
    key: "content.homeIntro",
    group: "content",
    type: "TEXT",
    label: "Home — short intro paragraph",
    defaultValue:
      "Our vision is to create a community where young people can learn, connect, create, collaborate, grow — and be recognised.",
  },
  {
    key: "content.aboutSummary",
    group: "content",
    type: "TEXT",
    label: "About — summary paragraph",
    defaultValue:
      "LADIRE Growth Forum is a community and platform focused on helping young people learn, connect, create, collaborate, grow and receive recognition. We bring together talent, culture and creativity through events, awards, programmes and everyday community.",
  },
  {
    key: "content.mission",
    group: "content",
    type: "TEXT",
    label: "About — mission",
    defaultValue:
      "To create spaces and opportunities where young people can develop their skills, express their culture, and celebrate their creativity.",
  },
  {
    key: "content.visionStatement",
    group: "content",
    type: "TEXT",
    label: "About — vision",
    defaultValue:
      "A community where young people can learn, connect, create, collaborate, grow — and be recognised.",
  },
  {
    key: "content.values",
    group: "content",
    type: "JSON",
    label: "About — values (JSON list of {title, text})",
    defaultValue:
      '[{"title":"Youth first","text":"Everything we do is designed around young people."},{"title":"Culture","text":"We promote and preserve our culture with pride."},{"title":"Creativity","text":"We celebrate creative expression in every form."},{"title":"Community","text":"We grow together, not alone."},{"title":"Integrity","text":"We run our community, awards and payments with honesty and transparency."},{"title":"Excellence","text":"We push for quality in talent, events and recognition."}]',
  },
  {
    key: "content.doingPillars",
    group: "content",
    type: "JSON",
    label: "About — What we do (JSON list of {title, text})",
    defaultValue:
      '[{"title":"Learn","text":"Workshops, training sessions and mentorship that build real skills."},{"title":"Connect","text":"A growing community of young creatives, professionals and enthusiasts."},{"title":"Create","text":"Spaces and platforms for making art, music, design, content and more."},{"title":"Collaborate","text":"Opportunities to work together on projects, events and campaigns."},{"title":"Grow","text":"Support that helps members develop personally and professionally."},{"title":"Be recognised","text":"Awards, showcases and platforms that celebrate outstanding young talent."}]',
  },
  {
    key: "content.daytimeHangout",
    group: "content",
    type: "TEXT",
    label: "Daytime Hangout — intro",
    defaultValue:
      "LADIRE Daytime Hangout is a relaxed daytime gathering for the community — music, conversations, games and good vibes. Registration details are managed by the LADIRE team.",
  },
  {
    key: "content.vacationProgramme",
    group: "content",
    type: "TEXT",
    label: "Vacation / Holiday Programme — intro",
    defaultValue:
      "Our vacation programme keeps young people active and learning during the holidays — with creative activities, skill sessions and supervised fun. Programme details and booking are managed by the LADIRE team.",
  },
  // ---------- awards page content ----------
  {
    key: "awards.intro",
    group: "awards_content",
    type: "TEXT",
    label: "Awards — introduction",
    defaultValue:
      "The LADIRE Youth & Entertainment Awards 2026 celebrates outstanding young people in entertainment, creativity and culture — where culture meets design. Nominees and categories are published below. Voting is by paid votes only, and every vote is verified by the LADIRE team before it is counted.",
  },
  {
    key: "awards.instructions",
    group: "awards_content",
    type: "JSON",
    label: "Awards — voting instructions (JSON array of steps)",
    defaultValue:
      '["Browse the categories and select your preferred nominee.","Choose how many votes you want to buy.","Make the required bank transfer to the LADIRE account.","Upload your proof of payment and submit your payment reference.","Optionally confirm your payment on WhatsApp.","A LADIRE administrator verifies your payment.","Your votes are officially counted once your payment is approved."]',
  },
  {
    key: "awards.disclaimer",
    group: "awards_content",
    type: "TEXT",
    label: "Awards — verification disclaimer",
    defaultValue:
      "Votes are not counted until payment has been verified and approved by a LADIRE administrator. Uploading a receipt alone does not count a vote.",
  },
  {
    key: "awards.supportNote",
    group: "awards_content",
    type: "TEXT",
    label: "Awards — support message",
    defaultValue:
      "Having trouble with your payment or uploaded the wrong receipt? Contact us on WhatsApp or email before the voting deadline and we will help you.",
  },
  {
    key: "awards.faqs",
    group: "awards_content",
    type: "JSON",
    label: "Awards — FAQs (JSON list of {q, a})",
    defaultValue:
      '[{"q":"How much does a vote cost?","a":"The price per vote is set by LADIRE and shown on the voting page before you pay."},{"q":"How do I pay for votes?","a":"Choose your nominee and number of votes, then make a bank transfer to the official LADIRE account using your unique payment reference."},{"q":"When are my votes counted?","a":"Only after a LADIRE administrator verifies and approves your payment. Uploading a receipt alone does not count a vote."},{"q":"What happens if my payment is rejected?","a":"You will see the reason and may contact support. No votes are counted for rejected payments."},{"q":"Can I vote more than once?","a":"Yes, as long as your payment is approved each time. Additional rules may apply and are stated on the voting page."},{"q":"When does voting close?","a":"The voting deadline is published on the awards page. No new votes are accepted after it closes."}]',
  },
  // ---------- legal ----------
  {
    key: "legal.votingTerms",
    group: "legal",
    type: "TEXT",
    label: "Voting Terms & Conditions",
    defaultValue:
      "Placeholder — the organisation will supply the final voting terms. Suggested items: voting eligibility, price per vote, minimum/maximum votes per transaction, how payments are verified, refund policy, voting deadline, dispute process, fraud/abuse policy and how results are published.",
  },
  {
    key: "legal.privacyPolicy",
    group: "legal",
    type: "TEXT",
    label: "Privacy Policy",
    defaultValue:
      "Placeholder — the organisation will supply the final privacy policy describing what personal data is collected, why it is collected, how it is stored and used, and how users can request access or deletion of their data.",
  },
  {
    key: "legal.termsOfUse",
    group: "legal",
    type: "TEXT",
    label: "Terms of Use",
    defaultValue:
      "Placeholder — the organisation will supply the final website terms of use covering acceptable use, event/membership registration, payments, liability and governing law.",
  },
];

export type SettingsMap = Record<string, string>;

let defaultsByKey = new Map<string, SettingDef>();
for (const d of DEFAULT_SETTINGS) defaultsByKey.set(d.key, d);

/** Return all site settings as a flat map of key -> raw string value. */
export async function getSettingsMap(): Promise<SettingsMap> {
  const rows = await prisma.siteSetting.findMany();
  const map: SettingsMap = {};
  for (const d of DEFAULT_SETTINGS) map[d.key] = d.defaultValue;
  for (const r of rows) map[r.key] = r.value;
  return map;
}

/** Typed helpers over the flat map. */
export function parseBool(v: string | undefined, fallback = false): boolean {
  if (v == null || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

export function parseJson<T>(v: string | undefined, fallback: T): T {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

export type PublicSiteSettings = {
  siteName: string;
  tagline: string;
  logoUrl: string;
  websiteNote: string;
  phones: string[];
  emails: string[];
  whatsapp: string;
  whatsappSupport: string;
  address: string;
  bank: { name: string; accountName: string; accountNumber: string; instructions: string };
  socials: Record<string, string>;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  x?: string;
  youtube?: string;
  // content
  content: Record<string, string>;
  awardsContent: Record<string, string>;
  legal: Record<string, string>;
  seoDescription: string;
};

/** Flatten for consumption in server components. */
export function flattenSettings(map: SettingsMap): PublicSiteSettings {
  const phones = [map["contact.phone1"], map["contact.phone2"], map["contact.phone3"]].filter(
    Boolean
  ) as string[];
  const emails = [map["contact.email1"], map["contact.email2"]].filter(Boolean) as string[];
  const contentKeys = DEFAULT_SETTINGS.filter((s) => s.group === "content").map((s) => s.key);
  const awardsKeys = DEFAULT_SETTINGS.filter((s) => s.group === "awards_content").map((s) => s.key);
  const legalKeys = DEFAULT_SETTINGS.filter((s) => s.group === "legal").map((s) => s.key);
  const content: Record<string, string> = {};
  for (const k of contentKeys) content[k.replace(/^content\./, "")] = map[k] ?? "";
  const awardsContent: Record<string, string> = {};
  for (const k of awardsKeys) awardsContent[k.replace(/^awards\./, "")] = map[k] ?? "";
  const legal: Record<string, string> = {};
  for (const k of legalKeys) legal[k.replace(/^legal\./, "")] = map[k] ?? "";
  return {
    siteName: map["general.siteName"] ?? "LADIRE Growth Forum",
    tagline: map["general.tagline"] ?? "",
    logoUrl: map["general.logoUrl"] ?? "/brand/ladire-logo.png",
    websiteNote: map["general.websiteNote"] ?? "",
    phones,
    emails,
    whatsapp: map["contact.whatsapp"] ?? "",
    whatsappSupport: map["contact.whatsappSupport"] ?? "",
    address: map["contact.address"] ?? "",
    bank: {
      name: map["bank.name"] ?? "",
      accountName: map["bank.accountName"] ?? "",
      accountNumber: map["bank.accountNumber"] ?? "",
      instructions: map["bank.instructions"] ?? "",
    },
    socials: {
      instagram: map["social.instagram"] ?? "",
      facebook: map["social.facebook"] ?? "",
      tiktok: map["social.tiktok"] ?? "",
      x: map["social.x"] ?? "",
      youtube: map["social.youtube"] ?? "",
    },
    instagram: map["social.instagram"],
    facebook: map["social.facebook"],
    tiktok: map["social.tiktok"],
    x: map["social.x"],
    youtube: map["social.youtube"],
    content,
    awardsContent,
    legal,
    seoDescription: map["seo.siteDescription"] ?? "",
  };
}

export { defaultsByKey };

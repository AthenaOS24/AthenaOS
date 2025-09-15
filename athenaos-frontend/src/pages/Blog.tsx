import React, { useState, useEffect } from "react";
import "./Blog.css";

interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  details: string;
  image: string; // hyperlink image
  category?: string;
  authorName?: string;
  authorAvatar?: string;
  comments?: number;
}

const blogPosts: BlogPost[] = [
  {
    title: "How to Choose the Right Therapist",
    date: "September 05, 2025",
    excerpt:
      "Modalities, qualifications, and the first-session checklist to find a good fit.",
    details:
      "We cover licensing, evidence-based approaches, cost/insurance, cultural fit, and how to evaluate your comfort level after session one.",
    image: "https://source.unsplash.com/1600x900/?therapist,counseling,office",
    category: "Therapy",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=therapist",
    comments: 4,
  },
  {
    title: "CBT Basics: Rethinking Unhelpful Thoughts",
    date: "August 28, 2025",
    excerpt:
      "A practical intro to cognitive restructuring with simple worksheets.",
    details:
      "Learn the ABC model, common thinking traps, and how to replace them with balanced alternatives using a 5-step practice.",
    image: "https://source.unsplash.com/1600x900/?psychology,cbt,brain",
    category: "CBT",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=cbt",
    comments: 2,
  },
  {
    title: "Mindfulness for Anxiety (5 Minutes a Day)",
    date: "August 21, 2025",
    excerpt: "Short practices you can slot between classes or meetings.",
    details:
      "Box breathing, 5-senses grounding, and micro-meditations. When to prefer movement-based mindfulness over seated practice.",
    image: "https://source.unsplash.com/1600x900/?mindfulness,calm,breathing",
    category: "Mindfulness",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=mindful",
    comments: 6,
  },
  {
    title: "Telehealth Therapy: Preparing for Your First Session",
    date: "August 14, 2025",
    excerpt: "Tech, privacy, and environment tips for a smoother tele-session.",
    details:
      "Camera framing, headphones, lighting, a privacy checklist, and a pre-session reflection sheet you can reuse.",
    image: "https://source.unsplash.com/1600x900/?telehealth,video-call,therapy",
    category: "Telehealth",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=tele",
    comments: 1,
  },
  {
    title: "Sleep & Mental Health: A Student’s Guide",
    date: "August 07, 2025",
    excerpt:
      "Why sleep architecture matters and 7 cues to improve it without apps.",
    details:
      "Circadian rhythm anchors, caffeine timing, light exposure, and progressive wind-down routines with templates.",
    image: "https://source.unsplash.com/1600x900/?sleep,wellness,night",
    category: "Wellbeing",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=sleep",
    comments: 5,
  },
  {
    title: "Journaling Prompts for Mood Tracking",
    date: "July 31, 2025",
    excerpt:
      "Evidence-informed prompts that link feelings, thoughts, and actions.",
    details:
      "Daily 3-line template, weekly review, and how to visualize patterns for therapy or self-coaching.",
    image: "https://source.unsplash.com/1600x900/?journal,mental-health,notebook",
    category: "Journaling",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=journal",
    comments: 0,
  },
  {
    title: "Burnout vs. Depression: Key Differences",
    date: "July 24, 2025",
    excerpt: "Overlap, distinctions, and when to seek professional help.",
    details:
      "We compare symptom clusters, duration, functional impact, and the role of rest vs. treatment plans.",
    image: "https://source.unsplash.com/1600x900/?burnout,work,mental-health",
    category: "Psychoeducation",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=burnout",
    comments: 7,
  },
  {
    title: "Building a Personal Crisis Plan",
    date: "July 17, 2025",
    excerpt: "Contacts, warning signs, coping steps, and environment safety.",
    details:
      "Download a one-page template, identify triggers, list grounding skills, and arrange safe spaces ahead of time.",
    image: "https://source.unsplash.com/1600x900/?support,helpline,mental-health",
    category: "Safety",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=safety",
    comments: 3,
  },
  {
    title: "How to Support a Friend in Distress",
    date: "July 10, 2025",
    excerpt:
      "Active listening, validating, and boundaries that protect both of you.",
    details:
      "Use the OARS framework, safety questions you can ask, and a list of professional resources by region.",
    image: "https://source.unsplash.com/1600x900/?support-group,listen,empathy",
    category: "Community",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=support",
    comments: 9,
  },
  {
    title: "AI in Therapy: How AthenaOS Assists Clinicians",
    date: "July 03, 2025",
    excerpt:
      "Augmenting—not replacing—care with triage, journaling, and progress views.",
    details:
      "We outline guardrails, privacy, bias checks, and how AthenaOS surfaces insights clinicians can verify.",
    image: "https://source.unsplash.com/1600x900/?ai,healthcare,psychology",
    category: "AI & Ethics",
    authorName: "Athena Team",
    authorAvatar: "https://api.dicebear.com/7.x/miniavs/svg?seed=ai",
    comments: 12,
  },
];

function getDateParts(dateStr: string): { day: string; mon: string } {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { day: "—", mon: "" };
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  return { day, mon };
}

const Blog: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={`blog-wrap ${fadeIn ? "fade-in" : ""}`}>
      <h1 className="blog-title">Blog</h1>
      <p className="blog-subtitle">
        Research-backed tips, therapy explainers, and AthenaOS updates.
      </p>

      <div className="grid three-col">
        {blogPosts.map((post, index) => {
          const { day, mon } = getDateParts(post.date);
          const category = post.category ?? "General";
          const authorName = post.authorName ?? "Athena Team";
          const authorAvatar =
            post.authorAvatar ??
            "https://api.dicebear.com/7.x/miniavs/svg?seed=default";
          const comments = post.comments ?? 0;

          return (
            <article className="post-card" key={index}>
              <div className="media">
                <img className="cover" src={post.image} alt={post.title} />
                <div className="date-badge">
                  <span className="day">{day}</span>
                  <span className="mon">{mon}</span>
                </div>
                <div className="flag">▣</div>
              </div>

              <div className="content">
                <div className="category">{category}</div>
                <h2 className="title">{post.title}</h2>
                <p className="excerpt">{post.excerpt}</p>

                <div className="meta">
                  <div className="author">
                    <img src={authorAvatar} alt="" />
                    <span>by {authorName}</span>
                  </div>
                  <div className="comments">
                    <span className="dot" /> {comments} Comments
                  </div>
                </div>

                <div className="actions">
                  <button
                    className="read-more"
                    onClick={() => toggleExpand(index)}
                    aria-expanded={expandedIndex === index}
                    aria-controls={`details-${index}`}
                  >
                    Read more →
                  </button>

                  <button
                    className="toggle-details"
                    onClick={() => toggleExpand(index)}
                  >
                    {expandedIndex === index ? "Hide Info ▲" : "Show Info ▼"}
                  </button>
                </div>

                <div
                  id={`details-${index}`}
                  className={`dropdown ${
                    expandedIndex === index ? "open" : ""
                  }`}
                >
                  <div className="details">{post.details}</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Blog;

import React, { useState, useEffect } from "react";
import "./Blog.css";

interface BlogPost {
  title: string;
  date: string;
  excerpt: string;
  details: string;
  image: string; // New image field
}

const blogPosts: BlogPost[] = [
  {
    title: "Getting Started with AthenaOS",
    date: "August 12, 2025",
    excerpt: "A quick guide to set up and explore AthenaOS for your projects.",
    details:
      "In this article, you'll learn how to install AthenaOS, configure your workspace, and explore its main features.",
    image: "https://via.placeholder.com/120x80?text=AthenaOS"
  },
  {
    title: "Boosting Productivity with AthenaOS",
    date: "August 5, 2025",
    excerpt: "Discover tips and tricks to streamline your workflow and get the most out of AthenaOS.",
    details:
      "We share productivity hacks, keyboard shortcuts, and recommended integrations to speed up your work.",
    image: "https://via.placeholder.com/120x80?text=Productivity"
  },
  {
    title: "Future of AthenaOS",
    date: "July 29, 2025",
    excerpt: "What’s next for AthenaOS? Here’s a sneak peek into upcoming features and improvements.",
    details:
      "A preview of AthenaOS's roadmap, including planned updates, community features, and performance improvements.",
    image: "https://via.placeholder.com/120x80?text=Future"
  }
];

const Blog: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    setFadeIn(true); // Trigger fade-in animation on load
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={`blog-container ${fadeIn ? "fade-in" : ""}`}>
      <h1 className="blog-title">BLOG</h1>
      <p className="blog-subtitle">
        Updates, tutorials, and insights from the AthenaOS team.
      </p>
      <div className="blog-divider">
        <span className="divider-text">Latest Posts</span>
      </div>
      <div className="blog-posts">
        {blogPosts.map((post, index) => (
          <div key={index} className="blog-card">
            <div className="blog-card-header">
              <img src={post.image} alt={post.title} className="post-image" />
              <div className="post-header-text">
                <h2 className="post-title">{post.title}</h2>
                <p className="post-date">{post.date}</p>
              </div>
            </div>
            <p className="post-excerpt">{post.excerpt}</p>

            <button
              className="toggle-details"
              onClick={() => toggleExpand(index)}
            >
              {expandedIndex === index ? "Hide Info ▲" : "Show Info ▼"}
            </button>

            <div
              className={`dropdown-wrapper ${
                expandedIndex === index ? "open" : ""
              }`}
            >
              <div className="post-details">{post.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;

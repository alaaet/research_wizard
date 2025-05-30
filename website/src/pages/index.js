import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import Heading from "@theme/Heading";
import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 32 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <img
              src="img/rwiz.png"
              alt="Research Wizard Logo"
              className="hero__logo"
              style={{ width: "100px", height: "100px", marginBottom: 16 }}
            />
            <Heading as="h1" className="hero__title">
              {siteConfig.title}
            </Heading>
            <p
              className="hero__subtitle"
              style={{ fontSize: "1.3em", marginBottom: 8 }}
            >
              Your all-in-one AI-powered workspace for research management,
              literature discovery, and drafting.
            </p>
            <p
              style={{
                maxWidth: 600,
                margin: "0 auto 20px",
                color: "#e0e0e0",
                fontSize: "1.1em",
              }}
            >
              Research Wizard helps you organize projects, search and manage
              scientific literature, and draft research reports with the help of
              advanced AI agents—all in a modern, intuitive desktop app.
            </p>
            <div className={styles.buttons}>
              <Link
                className="button button--secondary button--lg"
                to="/docs/user-guide/intro"
              >
                Get Started: User Guide
              </Link>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <img
              src="img/user-guide/Settings%20-%20Integrations%20management.png"
              alt="Research Wizard Screenshot"
              className="hero__screenshot"
              style={{ width: "100%", height: "auto", marginBottom: 16, borderRadius: 8, boxShadow: "0 2px 16px rgba(0,0,0,0.15)" }}
            />
            <p style={{ fontSize: '0.95em', color: '#e0e0e0', textAlign: 'center', marginTop: 4, opacity: 0.85 }}>
              <em>We do not use web-scraping or any hacking technique inside the app.</em>
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`Welcome to ${siteConfig.title}`}
      description="Research Wizard: AI-powered research management, literature discovery, and drafting."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <section className={`${styles.ctaSection} mb-4`}>
          <div
            className="container text--center"
            style={{ marginTop: 40, marginBottom: 40 }}
          >
            <Heading as="h2">Ready to supercharge your research?</Heading>
            <p
              style={{
                fontSize: "1.1em",
                margin: "16px auto 24px",
                maxWidth: 600,
              }}
            >
              Explore the <Link to="/docs/intro">User Guide</Link> to begin your
              journey with Research Wizard.
            </p>
            <Link
              className="button button--primary button--lg mb-4"
              to="/docs/intro"
            >
              Start the User Guide
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}

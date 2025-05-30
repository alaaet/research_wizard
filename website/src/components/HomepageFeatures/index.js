import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Unified Research Workspace',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Organize your research projects, literature, and drafts in one place. Switch seamlessly between project management, literature discovery, and writing.
      </>
    ),
  },
  {
    title: 'AI-Powered Drafting',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Generate outlines and full research drafts using leading AI models (Gemini, OpenAI, Claude) or write manually for full control.
      </>
    ),
  },
  {
    title: 'Comprehensive Literature Search',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Search and import papers from Exa, Crossref, DBLP, PLOS, OpenAlex, EuropePMC, CoreAPI, Elsevier, NCBI-NIH, arXiv, and Semantic Scholar.
      </>
    ),
  },
  {
    title: 'Customizable Reports',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Generate, edit, and export research reports in Markdown, DOCX, or PDF. Fine-tune structure and language to fit your needs.
      </>
    ),
  },
  {
    title: 'Modern, Intuitive UI',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Enjoy a distraction-free, responsive interface with multi-language and RTL/LTR support. Built for productivity and ease of use.
      </>
    ),
  },
  {
    title: 'Open Source & Extensible',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Built for researchers, by researchers. Easily add new AI agents or literature sources. Contributions welcome!
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

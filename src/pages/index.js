import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';

import Heading from '@theme/Heading';
import styles from './index.module.css';

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    return (<header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
            <Heading as="h1" className="hero__title">
                {siteConfig.title}
            </Heading>
            <img src="img/logo.svg" alt="LangChain4j Logo" className={styles.logo} style={{maxWidth: '20vh'}}/>
            <p className="hero__subtitle">
                <Translate id="site.tagline">Supercharge your Java application with the power of LLMs</Translate>
            </p>
            <div className={styles.buttons}>
                <Link
                    className="button button--secondary button--lg"
                    to="/intro">
                    <Translate id="homepage.header.button">Introduction</Translate>
                </Link>
            </div>
        </div>
    </header>);
}

export default function Home() {
    const {siteConfig} = useDocusaurusContext();
    return (<Layout
        title={`${siteConfig.title}`}
        description={<Translate id="homepage.meta.description">LangChain4j documentation homepage</Translate>}>
        <HomepageHeader/>
        <main>
            <HomepageFeatures/>
        </main>
    </Layout>);
}
